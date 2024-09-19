import GameAddDTO from "../models/DTOs/Game/GameAddDTO";
import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";
import GameWithRulesDTO from "../models/DTOs/Game/GameWithRulesDTO";
import PlayerTeamDTO from "../models/DTOs/Team/PlayerTeamDTO";


class GameService {
    public static async getGames(): Promise<GameWithRulesDTO[] | undefined> {

        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Game`, {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${myToken}`,
                },
            });

            if (!url.ok) {
                throw new Error("Error in getGames");
            }

            const text = await url.text();
            // Parse the response body
            const data = JSON.parse(text);
            return data;

        } catch (error) {
            console.error("Error in getGames FE:", error);
            throw error;
        }
    }

    public static async getGameById(id: number): Promise<GameWithRulesDTO | undefined> {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Game/${id}`, {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${myToken}`,
                },
            });

            if (!url.ok) {
                throw new Error("Error in getGameById");
            }

            const text = await url.text();
            // Parse the response body
            const data = JSON.parse(text);
            return data;

        } catch (error) {
            console.error("Error in getGameById FE:", error);
            throw error;
        }
    }

    public static async addGame(game: GameAddDTO): Promise<GameWithRulesDTO | undefined> {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Game`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${myToken}`,
                },
                body: JSON.stringify(game),
            });

            if (!url.ok) {
                throw new Error("Error in addGame");
            }

            const text = await url.text();
            // Parse the response body
            const data = JSON.parse(text);
            return data;

        } catch (error) {
            console.error("Error in addGame FE:", error);
            throw error;
        }
    }

    public static async addTeamToGame(gameId: number, teamId: number) {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Game/${gameId}/team/${teamId}`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${myToken}`,
                },
            });

            if (!url.ok) {
                throw new Error("Error in addTeamToGame");
            }

            // const text = await url.text();
            // // Parse the response body
            // const data = JSON.parse(text);
            // return data;

        } catch (error) {
            console.error("Error in addTeamToGame FE:", error);
            throw error;
        }
    }

    public static async getTeamsByGameId(gameId: number): Promise<PlayerTeamDTO[] | undefined> {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Game/${gameId}/team`, {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${myToken}`,
                },
            });

            if (!url.ok) {
                throw new Error("Error in getTeamsByGameId");
            }

            const text = await url.text();
            // Parse the response body
            const data = JSON.parse(text);
            return data;

        } catch (error) {
            console.error("Error in getTeamsByGameId FE:", error);
            throw error;
        }
    }

    public static async getRoundsByGameId(gameId: number): Promise<GameRoundDTO[] | undefined> {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Game/${gameId}/round`, {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${myToken}`,
                },
            });

            if (!url.ok) {
                throw new Error("Error in getRoundsByGameId");
            }

            const text = await url.text();
            // Parse the response body
            const data = JSON.parse(text);
            return data;

        } catch (error) {
            console.error("Error in getRoundsByGameId FE:", error);
            throw error;
        }
    }


}

export default GameService;