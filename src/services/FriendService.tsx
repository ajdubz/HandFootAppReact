import PlayerFriendBasicDTO from "../models/DTOs/Player/PlayerFriendBasicDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import { apiRequest } from "./apiClient";
import { isFirebaseBackend } from "./apiConfig";
import FirebaseFriendService from "./firebase/FirebaseFriendService";
import MockApi from "./MockApi";
import PlayerService from "./PlayerService";

class FriendService {
    public static async getFriends(id: number): Promise<PlayerGetBasicDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.getFriends(id);
        }

        if (isFirebaseBackend()) {
            return FirebaseFriendService.getFriends(id);
        }

        try {
            return await apiRequest<PlayerGetBasicDTO[]>(`/Player/${id}/friends`, {
                method: "GET",
                fallbackErrorMessage: "Error in getFriends FE",
            });
        } catch (error) {
            console.error("Error in getFriends FE:", error);
            throw error;
        }
    }

    public static async getFriendRequests(id: number): Promise<PlayerGetBasicDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.getFriendRequests(id);
        }

        if (isFirebaseBackend()) {
            return FirebaseFriendService.getFriendRequests(id);
        }

        try {
            return await apiRequest<PlayerGetBasicDTO[]>(`/Player/${id}/friendRequests`, {
                method: "GET",
                fallbackErrorMessage: "Error in getFriendRequests FE",
            });
        } catch (error) {
            console.error("Error in getFriendRequests FE:", error);
            throw error;
        }
    }

    public static async getSentFriendRequests(id: number): Promise<PlayerGetBasicDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.getSentFriendRequests(id);
        }

        if (isFirebaseBackend()) {
            return FirebaseFriendService.getSentFriendRequests(id);
        }

        try {
            return await apiRequest<PlayerGetBasicDTO[]>(`/Player/${id}/requestsSent`, {
                method: "GET",
                fallbackErrorMessage: "Error in getSentFriendRequests FE",
            });
        } catch (error) {
            console.error("Error in getSentFriendRequests FE:", error);
            throw error;
        }
    }

    public static async sendFriendRequest(id: number, playerFriend: PlayerFriendBasicDTO) {
        if (MockApi.isEnabled()) {
            return MockApi.sendFriendRequest(id, playerFriend);
        }

        if (isFirebaseBackend()) {
            return FirebaseFriendService.sendFriendRequest(id, playerFriend);
        }

        try {
            await apiRequest<void>(`/Player/${id}/requestAdd`, {
                method: "POST",
                body: playerFriend,
                fallbackErrorMessage: "Error in sendFriendRequest FE",
            });
        } catch (error) {
            console.error("Error in sendFriendRequest FE:", error);
            throw error;
        }
    }

    public static async acceptFriendRequest(id: number, playerFriend: PlayerFriendBasicDTO) {
        if (MockApi.isEnabled()) {
            return MockApi.acceptFriendRequest(id, playerFriend);
        }

        if (isFirebaseBackend()) {
            return FirebaseFriendService.acceptFriendRequest(id, playerFriend);
        }

        try {
            await apiRequest<void>(`/Player/${id}/requestAccept`, {
                method: "PUT",
                body: playerFriend,
                fallbackErrorMessage: "Error in acceptFriendRequest FE",
            });
        } catch (error) {
            console.error("Error in acceptFriendRequest FE:", error);
            throw error;
        }
    }

    public static async declineFriendRequest(id: number, playerFriend: PlayerFriendBasicDTO) {
        if (MockApi.isEnabled()) {
            return MockApi.declineFriendRequest(id, playerFriend);
        }

        if (isFirebaseBackend()) {
            return FirebaseFriendService.declineFriendRequest(id, playerFriend);
        }

        try {
            await apiRequest<void>(`/Player/${id}/friendRequests/${playerFriend.friendId}`, {
                method: "DELETE",
                fallbackErrorMessage: "Error in declineFriendRequest FE",
            });
        } catch (error) {
            console.error("Error in declineFriendRequest FE:", error);
            throw error;
        }
    }

    public static async removeFriend(id: number, playerFriend: PlayerFriendBasicDTO) {
        if (MockApi.isEnabled()) {
            return MockApi.removeFriend(id, playerFriend);
        }

        if (isFirebaseBackend()) {
            return FirebaseFriendService.removeFriend(id, playerFriend);
        }

        try {
            await apiRequest<void>(`/Player/${id}/friends/${playerFriend.friendId}`, {
                method: "DELETE",
                fallbackErrorMessage: "Error in removeFriend FE",
            });
        } catch (error) {
            console.error("Error in removeFriend FE:", error);
            throw error;
        }
    }

    public static async searchNewFriends(playerId: number, search: string): Promise<PlayerGetBasicDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.searchNewFriends(playerId, search);
        }

        if (isFirebaseBackend()) {
            return FirebaseFriendService.searchNewFriends(playerId, search);
        }

        try {
            const results = await apiRequest<PlayerGetBasicDTO[]>(`/Player/${playerId}/newFriendSearch/${encodeURIComponent(search.trim())}`, {
                method: "GET",
                fallbackErrorMessage: "Error in searchNewFriends",
            });
            const filteredResults = this.filterSearchMatches(results ?? [], playerId, search);
            return filteredResults.length > 0 ? filteredResults : this.searchNewFriendsFromPlayerList(playerId, search);
        } catch {
            return this.searchNewFriendsFromPlayerList(playerId, search);
        }
    }

    public static async searchCurrentFriends(playerId: number, search: string): Promise<PlayerGetBasicDTO[] | undefined> {
        if (MockApi.isEnabled()) {
            return MockApi.searchCurrentFriends(playerId, search);
        }

        if (isFirebaseBackend()) {
            return FirebaseFriendService.searchCurrentFriends(playerId, search);
        }

        try {
            return await apiRequest<PlayerGetBasicDTO[]>(`/Player/${playerId}/currFriendSearch/${encodeURIComponent(search.trim())}`, {
                method: "GET",
                fallbackErrorMessage: "Error in searchCurrentFriends",
            });
        } catch (error) {
            console.error("Error in searchCurrentFriends FE:", error);
            throw error;
        }
    }

    private static async searchNewFriendsFromPlayerList(playerId: number, search: string): Promise<PlayerGetBasicDTO[]> {
        const [players, friends, sentRequests, incomingRequests] = await Promise.all([
            PlayerService.getPlayers(),
            this.getFriends(playerId),
            this.getSentFriendRequests(playerId),
            this.getFriendRequests(playerId),
        ]);
        const friendIds = new Set((friends ?? []).map((player) => player.id ?? 0));
        const sentRequestIds = new Set((sentRequests ?? []).map((player) => player.id ?? 0));
        const incomingRequestIds = new Set((incomingRequests ?? []).map((player) => player.id ?? 0));

        return this.filterSearchMatches(players ?? [], playerId, search).filter((player) => {
            const candidateId = player.id ?? 0;
            return !friendIds.has(candidateId) &&
                !sentRequestIds.has(candidateId) &&
                !incomingRequestIds.has(candidateId);
        });
    }

    private static filterSearchMatches(players: PlayerGetBasicDTO[], playerId: number, search: string): PlayerGetBasicDTO[] {
        const normalizedSearch = search.trim().toLowerCase();
        return players.filter((player) => {
            const candidateId = player.id ?? 0;
            return candidateId !== playerId &&
                !this.isGuestPlayer(player) &&
                (
                    (player.nickName ?? "").toLowerCase().includes(normalizedSearch) ||
                    (player.fullName ?? "").toLowerCase().includes(normalizedSearch) ||
                    (player.email ?? "").toLowerCase().includes(normalizedSearch)
                );
        });
    }

    private static isGuestPlayer(player: PlayerGetBasicDTO): boolean {
        const email = (player.email ?? "").toLowerCase();
        const nickName = (player.nickName ?? "").trim().toLowerCase();
        const fullName = (player.fullName ?? "").trim().toLowerCase();
        return player.isGuest === true ||
            email.endsWith("@mock.local") ||
            email.endsWith("@firebase.local") ||
            email.includes("@guest.") ||
            nickName === "guest player" ||
            fullName === "guest player";
    }
}

export default FriendService;
