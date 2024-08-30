import PlayerFriendBasicDTO from "../models/DTOs/Player/PlayerFriendBasicDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";


class FriendService {
    public static async getFriends(id: number): Promise<PlayerGetBasicDTO[] | undefined> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/friends`);
            if (!url.ok) {
                throw new Error("Error in getFriends FE");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in getFriends FE:", error);
            throw error;
        }
    }

    public static async getFriendRequests(id: number): Promise<PlayerGetBasicDTO[] | undefined> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/friendRequests`);
            if (!url.ok) {
                throw new Error("Error in getFriendRequests FE");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in getFriendRequests FE:", error);
            throw error;
        }
    }

    public static async getSentFriendRequests(id: number): Promise<PlayerGetBasicDTO[] | undefined> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/requestsSent`);
            if (!url.ok) {
                throw new Error("Error in getSentFriendRequests FE");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in getSentFriendRequests FE:", error);
            throw error;
        }
    }

    public static async sendFriendRequest(id: number, playerFriend: PlayerFriendBasicDTO) {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/requestAdd`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(playerFriend),
            });
            if (!url.ok) {
                throw new Error("Error in sendFriendRequest FE");
            }
        } catch (error) {
            console.error("Error in sendFriendRequest FE:", error);
            throw error;
        }
    }

    public static async acceptFriendRequest(id: number, playerFriend: PlayerFriendBasicDTO) {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/requestAccept`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(playerFriend),
            });
            if (!url.ok) {
                throw new Error("Error in acceptFriendRequest FE");
            }
        } catch (error) {
            console.error("Error in acceptFriendRequest FE:", error);
            throw error;
        }
    }

    public static async removeFriend(id: number, playerFriend: PlayerFriendBasicDTO) {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/friends/${playerFriend.friendId}`, {
                method: "DELETE",
            });
            if (!url.ok) {
                throw new Error("Error in removeFriend FE");
            }
        } catch (error) {
            console.error("Error in removeFriend FE:", error);
            throw error;
        }
    }

    public static async searchNewFriends(playerId: number, search: string): Promise<PlayerGetBasicDTO[] | undefined> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${playerId}/friendSearch/${search}`);
            if (!url.ok) {
                throw new Error("Error in searchPlayers");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in searchNewFriends FE:", error);
            throw error;
        }
    }
}

export default FriendService;