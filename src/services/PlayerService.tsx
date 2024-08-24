import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";

class PlayerService {
    public static async getPlayers(): Promise<PlayerGetBasicDTO[]> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player`);
            const data = await url.json();
            return data;
        } catch (error) {
            console.error("Error in getPlayers:", error);
            throw error;
        }
    }

    public static async getPlayerAccountById(id: number): Promise<PlayerAccountDTO> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}/account`);
            const data = await url.json();
            return data;
        } catch (error) {
            console.error("Error in getPlayerAccountById:", error);
            throw error;
        }
    }

    public static async getPlayerFullDetailsById(id: number): Promise<PlayerFullDetailsDTO> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}`);
            const data = await url.json();
            return data;
        } catch (error) {
            console.error("Error in getPlayerFullDetailsById:", error);
            throw error;
        }
    }

    public static async createPlayer(player: PlayerAccountDTO): Promise<any> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/account`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(player),
            });

            // Check if the response body is empty
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.log(player);
            console.error("Error in createPlayer:", error);
            throw error;
        }
    }

    public static async updatePlayerAccount(playerId: number, player: PlayerAccountDTO): Promise<any> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${playerId}/account`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(player),
            });
            const data = await url.json();
            return data;
        } catch (error) {
            console.error("Error in updatePlayer:", error);
            throw error;
        }
    }

    public static async deletePlayer(playerId: number): Promise<any> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${playerId}/account`, {
                method: "DELETE",
            });
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in deletePlayer:", error);
            throw error;
        }
    }
}

export default PlayerService;
