import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import PlayerLoginDTO from "../models/DTOs/Player/PlayerLoginDTO";

class PlayerService {

    public static async LoginPlayer(playerAccountDTO: PlayerAccountDTO): Promise<PlayerLoginDTO | undefined> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(playerAccountDTO),
            });

            if (!url.ok) {
                throw new Error("Error in LoginPlayer FE");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            // console.log(data);
            return data;
        } catch (error) {
            console.error("Error in LoginPlayer FE:", error);
            throw error;
        }
    }

    public static async getPlayers(): Promise<PlayerGetBasicDTO[] | undefined> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg`,
                },
            });
            if (!url.ok) {
                throw new Error("Error in updatePlayerAccount");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in getPlayers FE:", error);
            throw error;
        }
    }

    public static async getPlayerAccountById(id: number): Promise<PlayerAccountDTO | undefined> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/account`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
                }
            });
            if (!url.ok) {
                throw new Error("Error in getPlayerAccountById");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in getPlayerAccountById FE:", error);
            throw error;
        }
    }

    public static async getPlayerFullDetailsById(id: number): Promise<PlayerFullDetailsDTO | undefined> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
                },
            });
            if (!url.ok) {
                throw new Error("Error in getPlayerFullDetailsById");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in getPlayerFullDetailsById FE:", error);
            throw error;
        }
    }

    public static async createPlayer(player: PlayerAccountDTO) {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/account`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
                },
                body: JSON.stringify(player),
            });
            if (!url.ok) {
                throw new Error("Error in createPlayer");
            }
        } catch (error) {
            console.log(player);
            console.error("Error in createPlayer FE:", error);
            throw error;
        }
    }

    public static async updatePlayerAccount(playerId: number, player: PlayerAccountDTO) {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${playerId}/account`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
                },
                body: JSON.stringify(player),
            });
            if (!url.ok) {
                throw new Error("Error in updatePlayerAccount");
            }
        } catch (error) {
            console.error("Error in updatePlayer FE:", error);
            throw error;
        }
    }

    public static async deletePlayer(playerId: number) {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${playerId}/account`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
                },
            });
            if (!url.ok) {
                throw new Error("Error in deletePlayer");
            }
        } catch (error) {
            console.error("Error in deletePlayer FE:", error);
            throw error;
        }
    }

    public static async searchPlayers(search: string): Promise<PlayerGetBasicDTO[] | undefined> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/search/${search}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiJhamR1YnoiLCJ1bmlxdWVfbmFtZSI6ImFqZHVieiIsImVtYWlsIjoiIiwibmJmIjoxNzI1NDc0MTM0LCJleHAiOjE3MjgwNjYxMzQsImlhdCI6MTcyNTQ3NDEzNH0.CYV6kviovofqJvzfjwNr7VpQjXXmZUFRIjoEYQ275kg",
                },
            });
            if (!url.ok) {
                throw new Error("Error in searchPlayers");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in searchPlayers FE:", error);
            throw error;
        }
    }

    


}

export default PlayerService;
