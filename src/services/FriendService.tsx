import PlayerFriendBasicDTO from "../models/DTOs/Player/PlayerFriendBasicDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";


class FriendService {
    public static async getFriends(id: number): Promise<PlayerGetBasicDTO[] | undefined> {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/friends`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
                },
            });
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
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/friendRequests`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
                },
            });
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
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/requestsSent`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
                },
            });
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
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/requestAdd`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
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
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/requestAccept`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
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
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/friends/${playerFriend.friendId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
                },
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
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${playerId}/newFriendSearch/${search}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
                },
            });
            if (!url.ok) {
                throw new Error("Error in searchNewFriends");
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

    public static async searchCurrentFriends(playerId: number, search: string): Promise<PlayerGetBasicDTO[] | undefined> {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }
            
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${playerId}/currFriendSearch/${search}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
                },
            });
            if (!url.ok) {
                throw new Error("Error in searchCurrentFriends");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in searchCurrentFriends FE:", error);
            throw error;
        }
    }
}

export default FriendService;