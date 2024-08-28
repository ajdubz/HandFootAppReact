import PlayerFriendBasicDTO from "../models/DTOs/Player/PlayerFriendBasicDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";


class FriendService {
    public static async getFriends(id: number): Promise<PlayerGetBasicDTO[] | undefined> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Friend/${id}`);
            if (!url.ok) {
                throw new Error("Error in getFriends");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in getFriends:", error);
            throw error;
        }
    }

    public static async getFriendRequests(id: number): Promise<PlayerGetBasicDTO[] | undefined> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Friend/${id}/requests`);
            if (!url.ok) {
                throw new Error("Error in getFriendRequests");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in getFriendRequests:", error);
            throw error;
        }
    }

    public static async getSentFriendRequests(id: number): Promise<PlayerGetBasicDTO[] | undefined> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Friend/${id}/requestsSent`);
            if (!url.ok) {
                throw new Error("Error in getSentFriendRequests");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in getSentFriendRequests:", error);
            throw error;
        }
    }

    public static async sendFriendRequest(id: number, playerFriend: PlayerFriendBasicDTO) {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Friend/${id}/requestAdd`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(playerFriend),
            });
            if (!url.ok) {
                throw new Error("Error in sendFriendRequest");
            }
        } catch (error) {
            console.error("Error in sendFriendRequest:", error);
            throw error;
        }
    }

    public static async acceptFriendRequest(id: number, friendId: number) {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Friend/${id}/friendRequests/${friendId}`, {
                method: "PUT",
            });
            if (!url.ok) {
                throw new Error("Error in acceptFriendRequest");
            }
        } catch (error) {
            console.error("Error in acceptFriendRequest:", error);
            throw error;
        }
    }

    public static async removeFriend(id: number, friendId: number) {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Friend/${id}/friends/${friendId}`, {
                method: "DELETE",
            });
            if (!url.ok) {
                throw new Error("Error in removeFriend");
            }
        } catch (error) {
            console.error("Error in removeFriend:", error);
            throw error;
        }
    }
}

export default FriendService;