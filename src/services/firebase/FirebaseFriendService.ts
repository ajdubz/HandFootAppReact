import PlayerFriendBasicDTO from "../../models/DTOs/Player/PlayerFriendBasicDTO";
import PlayerGetBasicDTO from "../../models/DTOs/Player/PlayerGetBasicDTO";
import { deleteDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { toPlayerBasicDTO } from "./firebaseMappers";
import FirebasePlayerService from "./FirebasePlayerService";
import { getAllOwnedDocs, getCollection, getFirebaseUser, getRequiredFirebase, nextNumericId } from "./firebaseRepository";
import { FirebaseFriendDocument } from "./firebaseTypes";

const friendPairKey = (firstId: number, secondId: number): string => [firstId, secondId].sort((a, b) => a - b).join("-");
const friendRequestDocId = (ownerUid: string, playerId: number, friendId: number): string => `${ownerUid}_${playerId}_${friendId}`;
const friendshipDocId = (ownerUid: string, playerId: number, friendId: number): string => `${ownerUid}_${friendPairKey(playerId, friendId)}`;

class FirebaseFriendService {
    public static async getFriends(id: number): Promise<PlayerGetBasicDTO[]> {
        const user = await getFirebaseUser();
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
        const recipient = await FirebasePlayerService.getReadablePlayerDocumentById(friendId);
        const recipientUid = recipient?.uid ?? recipient?.ownerUid;
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
        const requester = await FirebasePlayerService.getReadablePlayerDocumentById(requesterId);
        const requesterUid = requester?.uid ?? requester?.ownerUid;
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
        };

        const { db } = getRequiredFirebase();
        await setDoc(doc(db, "friendships", friendshipDocId(user.uid, id, requesterId)), friendship, { merge: true });
        await this.deleteFriendRequests(requesterId, id, requesterUid, user.uid);
    }

    public static async declineFriendRequest(id: number, playerFriend: PlayerFriendBasicDTO): Promise<void> {
        const requesterId = playerFriend.friendId ?? 0;
        if (!id || !requesterId) {
            return;
        }

        const user = await getFirebaseUser();
        const requester = await FirebasePlayerService.getReadablePlayerDocumentById(requesterId);
        const requesterUid = requester?.uid ?? requester?.ownerUid;
        await this.deleteFriendRequests(requesterId, id, requesterUid, user.uid);
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
        const normalizedSearch = search.trim().toLowerCase();
        return (await this.getFriends(playerId)).filter((friend) =>
            (friend.nickName ?? "").toLowerCase().includes(normalizedSearch) ||
            (friend.fullName ?? "").toLowerCase().includes(normalizedSearch)
        );
    }

    private static async areFriends(playerId: number, friendId: number): Promise<boolean> {
        return (await this.getFriends(playerId)).some((friend) => friend.id === friendId);
    }

    private static async deleteFriendRequest(ownerUid: string, playerId: number, friendId: number): Promise<void> {
        const { db } = getRequiredFirebase();
        await deleteDoc(doc(db, "friendRequests", friendRequestDocId(ownerUid, playerId, friendId)));
    }

    private static async deleteFriendRequests(
        playerId: number,
        friendId: number,
        requesterUid?: string,
        recipientUid?: string,
    ): Promise<void> {
        if (requesterUid) {
            await this.deleteFriendRequest(requesterUid, playerId, friendId);
        }

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
        const snapshot = await getDocs(query(
            getCollection<FirebaseFriendDocument>("friendships"),
            where("participantUids", "array-contains", ownerUid),
        ));
        return snapshot.docs.map((friendship) => ({
            docId: friendship.id,
            data: friendship.data(),
        }));
    }

    private static isFriendship(friendship: FirebaseFriendDocument, playerId: number, friendId: number): boolean {
        return (friendship.playerId === playerId && friendship.friendId === friendId) ||
            (friendship.playerId === friendId && friendship.friendId === playerId);
    }

    private static async getBasicPlayers(playerIds: number[]): Promise<PlayerGetBasicDTO[]> {
        const uniquePlayerIds = Array.from(new Set(playerIds.filter(Boolean)));
        const players = await Promise.all(uniquePlayerIds.map((playerId) => FirebasePlayerService.getReadablePlayerDocumentById(playerId)));
        return players.filter(Boolean).map((player) => toPlayerBasicDTO(player!));
    }
}

export default FirebaseFriendService;
