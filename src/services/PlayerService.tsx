import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";

    //Why have I needed to add the url.text() and JSON.parse() to the response?
    //      Copie's response
    //The fetch API does not automatically parse the response body into a JSON object.
    //The response body is a stream of data that needs to be converted into a JSON object.
    //The response object has a text() method that returns a promise that resolves with the response body as a string.
    //The JSON.parse() function is then used to convert the string into a JSON object.
    //The text() method is asynchronous and returns a promise, so it needs to be awaited.
    //The JSON.parse() function is synchronous and returns a JSON object, so it does not need to be awaited.
    //The JSON.parse() function is used to convert the response body into a JSON object.


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
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
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
