import PlayerFriendBasicDTO from "../../models/DTOs/Player/PlayerFriendBasicDTO";
import PlayerGetBasicDTO from "../../models/DTOs/Player/PlayerGetBasicDTO";
import { deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { matchesPlayerPublicSearch } from "../../player/playerPublicId";
import { toPlayerDirectoryBasicDTO } from "./firebaseMappers";
import FirebasePlayerService from "./FirebasePlayerService";
import { getAllOwnedDocs, getCollection, getFirebaseUser, getRequiredFirebase, nextNumericId } from "./firebaseRepository";
import { FirebaseFriendDocument } from "./firebaseTypes";

const friendPairKey = (firstId: number, secondId: number): string => [firstId, secondId].sort((a, b) => a - b).join("-");
const friendRequestDocId = (ownerUid: string, playerId: number, friendId: number): string => `${ownerUid}_${playerId}_${friendId}`;
const friendshipDocId = (ownerUid: string, playerId: number, friendId: number): string => `${ownerUid}_${friendPairKey(playerId, friendId)}`;

class FirebaseFriendService {
    public static async getFriends(id: number): Promise<PlayerGetBasicDTO[]> {
        const user = await getFirebaseUser();
        await FirebasePlayerService.getPlayerDocumentById(id);
        const friendships = await this.getVisibleFriendships(user.uid);
        const friendIds = friendships
            .filter((friendship) => friendship.playerId === id || friendship.friendId === id)
            .map((friendship) => friendship.playerId === id ? friendship.friendId : friendship.playerId);

        return this.getBasicPlayers(friendIds);
    }

    public static async getFriendRequests(id: number): Promise<PlayerGetBasicDTO[]> {
        const user = await getFirebaseUser();
        const requests = await this.getIncomingFriendRequests(user.uid, id);
        const requesterIds = requests
            .filter((request) => request.friendId === id)
            .map((request) => request.playerId);

        return this.getBasicPlayers(requesterIds);
    }

    public static async getSentFriendRequests(id: number): Promise<PlayerGetBasicDTO[]> {
        const user = await getFirebaseUser();
        const requests = await getAllOwnedDocs<FirebaseFriendDocument>("friendRequests", user.uid);
        const recipientIds = requests
            .filter((request) => request.playerId === id)
            .map((request) => request.friendId);

        return this.getBasicPlayers(recipientIds);
    }

    public static async sendFriendRequest(id: number, playerFriend: PlayerFriendBasicDTO): Promise<void> {
        const friendId = playerFriend.friendId ?? 0;
        if (!id || !friendId || id === friendId || await this.areFriends(id, friendId)) {
            return;
        }

        const user = await getFirebaseUser();
        const recipient = await FirebasePlayerService.getPublicPlayerById(friendId);
        const recipientUid = recipient?.ownerUid;
        if (!recipientUid || recipientUid === user.uid) {
            return;
        }

        const requestId = await nextNumericId("friendRequests");
        const request: FirebaseFriendDocument = {
            id: requestId,
            ownerUid: user.uid,
            playerId: id,
            friendId,
            recipientUid,
            participantUids: [user.uid, recipientUid],
        };

        const { db } = getRequiredFirebase();
        await setDoc(doc(db, "friendRequests", friendRequestDocId(user.uid, id, friendId)), request, { merge: true });
    }

    public static async acceptFriendRequest(id: number, playerFriend: PlayerFriendBasicDTO): Promise<void> {
        const requesterId = playerFriend.friendId ?? 0;
        if (!id || !requesterId) {
            return;
        }

        const user = await getFirebaseUser();
        const requester = await FirebasePlayerService.getPublicPlayerById(requesterId);
        const requesterUid = requester?.ownerUid;
        if (!requesterUid) {
            return;
        }

        const friendshipId = await nextNumericId("friendships");
        const friendship: FirebaseFriendDocument = {
            id: friendshipId,
            ownerUid: user.uid,
            playerId: id,
            friendId: requesterId,
            participantUids: [user.uid, requesterUid],
            participantUid1: user.uid,
            participantUid2: requesterUid,
        };

        const { db } = getRequiredFirebase();
        await setDoc(doc(db, "friendships", friendshipDocId(user.uid, id, requesterId)), friendship, { merge: true });
        await this.deleteFriendRequests(requesterId, id, user.uid);
    }

    public static async declineFriendRequest(id: number, playerFriend: PlayerFriendBasicDTO): Promise<void> {
        const requesterId = playerFriend.friendId ?? 0;
        if (!id || !requesterId) {
            return;
        }

        const user = await getFirebaseUser();
        await this.deleteFriendRequests(requesterId, id, user.uid);
    }

    public static async removeFriend(id: number, playerFriend: PlayerFriendBasicDTO): Promise<void> {
        const friendId = playerFriend.friendId ?? 0;
        if (!id || !friendId) {
            return;
        }

        const user = await getFirebaseUser();
        await this.deleteFriendships(user.uid, id, friendId);
    }

    public static async searchNewFriends(playerId: number, search: string): Promise<PlayerGetBasicDTO[]> {
        const players = await FirebasePlayerService.searchPlayers(search);
        const friends = await this.getFriends(playerId);
        const sentRequests = await this.getSentFriendRequests(playerId);
        const incomingRequests = await this.getFriendRequests(playerId);
        const friendIds = new Set(friends.map((friend) => friend.id ?? 0));
        const sentRequestIds = new Set(sentRequests.map((friend) => friend.id ?? 0));
        const incomingRequestIds = new Set(incomingRequests.map((friend) => friend.id ?? 0));

        return players.filter((player) => {
            const candidateId = player.id ?? 0;
            return candidateId !== playerId &&
                !friendIds.has(candidateId) &&
                !sentRequestIds.has(candidateId) &&
                !incomingRequestIds.has(candidateId);
        });
    }

    public static async searchCurrentFriends(playerId: number, search: string): Promise<PlayerGetBasicDTO[]> {
        return (await this.getFriends(playerId)).filter((friend) => matchesPlayerPublicSearch(friend, search));
    }

    private static async areFriends(playerId: number, friendId: number): Promise<boolean> {
        return (await this.getFriends(playerId)).some((friend) => friend.id === friendId);
    }

    private static async deleteFriendRequests(
        playerId: number,
        friendId: number,
        recipientUid?: string,
    ): Promise<void> {
        const matchingRequests = await this.getRequestsForPair(playerId, friendId, recipientUid);
        await Promise.all(matchingRequests.map((request) => this.deleteFriendRequestByDocId(request.docId)));
    }

    private static async deleteFriendRequestByDocId(docId: string): Promise<void> {
        const { db } = getRequiredFirebase();
        await deleteDoc(doc(db, "friendRequests", docId));
    }

    private static async deleteFriendships(userUid: string, playerId: number, friendId: number): Promise<void> {
        const { db } = getRequiredFirebase();
        const friendships = await this.getVisibleFriendshipDocs(userUid);
        const matchingFriendships = friendships.filter((friendship) => this.isFriendship(friendship.data, playerId, friendId));
        await Promise.all(matchingFriendships.map((friendship) => deleteDoc(doc(db, "friendships", friendship.docId))));
    }

    private static async getIncomingFriendRequests(ownerUid: string, playerId: number): Promise<FirebaseFriendDocument[]> {
        const snapshot = await getDocs(query(
            getCollection<FirebaseFriendDocument>("friendRequests"),
            where("recipientUid", "==", ownerUid),
        ));
        return snapshot.docs
            .map((request) => request.data())
            .filter((request) => request.friendId === playerId);
    }

    private static async getRequestsForPair(
        playerId: number,
        friendId: number,
        recipientUid?: string,
    ): Promise<Array<{ docId: string; data: FirebaseFriendDocument }>> {
        if (!recipientUid) {
            return [];
        }

        const snapshot = await getDocs(query(
            getCollection<FirebaseFriendDocument>("friendRequests"),
            where("recipientUid", "==", recipientUid),
        ));
        return snapshot.docs
            .map((request) => ({
                docId: request.id,
                data: request.data(),
            }))
            .filter((request) => request.data.playerId === playerId && request.data.friendId === friendId);
    }

    private static async getVisibleFriendships(ownerUid: string): Promise<FirebaseFriendDocument[]> {
        return (await this.getVisibleFriendshipDocs(ownerUid)).map((friendship) => friendship.data);
    }

    private static async getVisibleFriendshipDocs(ownerUid: string): Promise<Array<{ docId: string; data: FirebaseFriendDocument }>> {
        const friendships = getCollection<FirebaseFriendDocument>("friendships");
        const [ownedSnapshot, firstParticipantSnapshot, secondParticipantSnapshot] = await Promise.all([
            getDocs(query(friendships, where("ownerUid", "==", ownerUid))),
            getDocs(query(friendships, where("participantUid1", "==", ownerUid))),
            getDocs(query(friendships, where("participantUid2", "==", ownerUid))),
        ]);
        const visibleFriendships = new Map<string, { docId: string; data: FirebaseFriendDocument }>();

        [ownedSnapshot, firstParticipantSnapshot, secondParticipantSnapshot].forEach((snapshot) => {
            snapshot.docs.forEach((friendship) => {
                visibleFriendships.set(friendship.id, {
                    docId: friendship.id,
                    data: friendship.data(),
                });
            });
        });

        const legacyOwnedFriendships = ownedSnapshot.docs.filter((friendship) => {
            const data = friendship.data();
            return !data.participantUid1 &&
                !data.participantUid2 &&
                data.participantUids?.length === 2;
        });
        await Promise.all(legacyOwnedFriendships.map(async (friendship) => {
            const data = friendship.data();
            const participantUid1 = data.participantUids![0];
            const participantUid2 = data.participantUids![1];
            const { db } = getRequiredFirebase();
            await updateDoc(doc(db, "friendships", friendship.id), {
                participantUid1,
                participantUid2,
            });
            visibleFriendships.set(friendship.id, {
                docId: friendship.id,
                data: {
                    ...data,
                    participantUid1,
                    participantUid2,
                },
            });
        }));

        return Array.from(visibleFriendships.values());
    }

    private static isFriendship(friendship: FirebaseFriendDocument, playerId: number, friendId: number): boolean {
        return (friendship.playerId === playerId && friendship.friendId === friendId) ||
            (friendship.playerId === friendId && friendship.friendId === playerId);
    }

    private static async getBasicPlayers(playerIds: number[]): Promise<PlayerGetBasicDTO[]> {
        const uniquePlayerIds = Array.from(new Set(playerIds.filter(Boolean)));
        const players = await Promise.all(uniquePlayerIds.map((playerId) => FirebasePlayerService.getPublicPlayerById(playerId)));
        return players.filter(Boolean).map((player) => toPlayerDirectoryBasicDTO(player!));
    }
}

export default FirebaseFriendService;
