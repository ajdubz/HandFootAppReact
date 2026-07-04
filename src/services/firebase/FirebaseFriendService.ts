import PlayerFriendBasicDTO from "../../models/DTOs/Player/PlayerFriendBasicDTO";
import PlayerGetBasicDTO from "../../models/DTOs/Player/PlayerGetBasicDTO";
import FirebasePlayerService from "./FirebasePlayerService";

class FirebaseFriendService {
    public static async getFriends(_id: number): Promise<PlayerGetBasicDTO[]> {
        return [];
    }

    public static async getFriendRequests(_id: number): Promise<PlayerGetBasicDTO[]> {
        return [];
    }

    public static async getSentFriendRequests(_id: number): Promise<PlayerGetBasicDTO[]> {
        return [];
    }

    public static async sendFriendRequest(_id: number, _playerFriend: PlayerFriendBasicDTO): Promise<void> {
        throw new Error("Firebase friend requests are not implemented in this milestone.");
    }

    public static async acceptFriendRequest(_id: number, _playerFriend: PlayerFriendBasicDTO): Promise<void> {
        throw new Error("Firebase friend requests are not implemented in this milestone.");
    }

    public static async removeFriend(_id: number, _playerFriend: PlayerFriendBasicDTO): Promise<void> {
        throw new Error("Firebase friend removal is not implemented in this milestone.");
    }

    public static async searchNewFriends(playerId: number, search: string): Promise<PlayerGetBasicDTO[]> {
        const players = await FirebasePlayerService.searchPlayers(search);
        return players.filter((player) => player.id !== playerId);
    }

    public static async searchCurrentFriends(_playerId: number, _search: string): Promise<PlayerGetBasicDTO[]> {
        return [];
    }
}

export default FirebaseFriendService;
