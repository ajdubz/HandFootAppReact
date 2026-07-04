import PlayerFriendBasicDTO from "../../models/DTOs/Player/PlayerFriendBasicDTO";
import PlayerGetBasicDTO from "../../models/DTOs/Player/PlayerGetBasicDTO";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { toPlayerBasicDTO } from "./firebaseMappers";
import FirebasePlayerService from "./FirebasePlayerService";
import { getAllOwnedDocs, getFirebaseUser, getRequiredFirebase, nextNumericId } from "./firebaseRepository";
import { FirebaseFriendDocument } from "./firebaseTypes";

const friendPairKey = (firstId: number, secondId: number): string => [firstId, secondId].sort((a, b) => a - b).join("-");
const friendRequestDocId = (ownerUid: string, playerId: number, friendId: number): string => `${ownerUid}_${playerId}_${friendId}`;
const friendshipDocId = (ownerUid: string, playerId: number, friendId: number): string => `${ownerUid}_${friendPairKey(playerId, friendId)}`;

class FirebaseFriendService {
    public static async getFriends(id: number): Promise<PlayerGetBasicDTO[]> {
        const user = await getFirebaseUser();
        const friendships = await getAllOwnedDocs<FirebaseFriendDocument>("friendships", user.uid);
        const friendIds = friendships
            .filter((friendship) => friendship.playerId === id || friendship.friendId === id)
            .map((friendship) => friendship.playerId === id ? friendship.friendId : friendship.playerId);

        return this.getBasicPlayers(friendIds);
    }

    public static async getFriendRequests(id: number): Promise<PlayerGetBasicDTO[]> {
        const user = await getFirebaseUser();
        const requests = await getAllOwnedDocs<FirebaseFriendDocument>("friendRequests", user.uid);
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
        const requestId = await nextNumericId("friendRequests");
        const request: FirebaseFriendDocument = {
            id: requestId,
            ownerUid: user.uid,
            playerId: id,
            friendId,
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
        const friendshipId = await nextNumericId("friendships");
        const friendship: FirebaseFriendDocument = {
            id: friendshipId,
            ownerUid: user.uid,
            playerId: id,
            friendId: requesterId,
        };

        const { db } = getRequiredFirebase();
        await setDoc(doc(db, "friendships", friendshipDocId(user.uid, id, requesterId)), friendship, { merge: true });
        await this.deleteFriendRequest(user.uid, requesterId, id);
    }

    public static async removeFriend(id: number, playerFriend: PlayerFriendBasicDTO): Promise<void> {
        const friendId = playerFriend.friendId ?? 0;
        if (!id || !friendId) {
            return;
        }

        const user = await getFirebaseUser();
        const { db } = getRequiredFirebase();
        await deleteDoc(doc(db, "friendships", friendshipDocId(user.uid, id, friendId)));
    }

    public static async searchNewFriends(playerId: number, search: string): Promise<PlayerGetBasicDTO[]> {
        const players = await FirebasePlayerService.searchPlayers(search);
        const friends = await this.getFriends(playerId);
        const sentRequests = await this.getSentFriendRequests(playerId);
        const friendIds = new Set(friends.map((friend) => friend.id ?? 0));
        const sentRequestIds = new Set(sentRequests.map((friend) => friend.id ?? 0));

        return players.filter((player) => {
            const candidateId = player.id ?? 0;
            return candidateId !== playerId && !friendIds.has(candidateId) && !sentRequestIds.has(candidateId);
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

    private static async getBasicPlayers(playerIds: number[]): Promise<PlayerGetBasicDTO[]> {
        const uniquePlayerIds = Array.from(new Set(playerIds.filter(Boolean)));
        const players = await Promise.all(uniquePlayerIds.map((playerId) => FirebasePlayerService.getPlayerDocumentById(playerId)));
        return players.filter(Boolean).map((player) => toPlayerBasicDTO(player!));
    }
}

export default FirebaseFriendService;
