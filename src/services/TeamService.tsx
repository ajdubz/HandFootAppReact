import GetTeamsByPlayerIdsDTO from "../models/DTOs/Team/GetTeamsByPlayerIdsDTO";
import PlayerTeamCreateDTO from "../models/DTOs/Team/PlayerTeamCreateDTO";
import PlayerTeamDTO from "../models/DTOs/Team/PlayerTeamDTO";
import TeamCreateDTO from "../models/DTOs/Team/TeamCreateDTO";
import TeamGetBasicDTO from "../models/DTOs/Team/TeamGetBasicDTO";
import TeamGetWithPlayerNamesDTO from "../models/DTOs/Team/TeamGetWithPlayerNamesDTO";

class TeamService {

    public static async getTeamsWithPlayerNames(): Promise<TeamGetWithPlayerNamesDTO[] | undefined> {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Team/Names`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${myToken}`,
                },
            });
            if (!url.ok) {
                throw new Error("Error in getTeams");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in getTeams FE:", error);
            throw error;
        }
    }

    public static async getTeamById(id: number): Promise<TeamGetBasicDTO> {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Team/${id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${myToken}`,
                },
            });
            if (!url.ok) {
                throw new Error("Error in getTeamById");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in getTeamById FE:", error);
            throw error;
        }
    }

    public static async createTeam(Team: TeamCreateDTO): Promise<TeamCreateDTO> {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Team`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${myToken}`,
                },
                body: JSON.stringify(Team),
            });
            if (!url.ok) {
                throw new Error("Error in createTeam");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;

        } catch (error) {
            console.error("Error in createTeam FE:", error);
            throw error;
        }
    }

    public static async searchTeams(searchText: string): Promise<TeamGetBasicDTO[] | undefined> {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Team/search/${searchText}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${myToken}`,
                },
            });
            if (!url.ok) {
                throw new Error("Error in searchTeams");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in searchTeams FE:", error);
            throw error;
        }
    }

    public static async searchPlayerTeams(inId: number, searchText: string): Promise<TeamGetWithPlayerNamesDTO[] | undefined> {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Team/search/${inId}-${searchText}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${myToken}`,
                },
            });
            if (!url.ok) {
                throw new Error("Error in searchPlayerTeams");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in searchPlayerTeams FE:", error);
            throw error;
        }
    }

    public static async getTeamsByPlayers(getTeamsByPlayers: GetTeamsByPlayerIdsDTO): Promise<TeamGetWithPlayerNamesDTO[] | undefined> {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Team/Players/${getTeamsByPlayers}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${myToken}`,
                },
            });
            if (!url.ok) {
                throw new Error("Error in getTeamsByPlayers");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            console.error("Error in getTeamsByPlayers FE:", error);
            throw error;
        }
    }

    public static async addPlayersToNewTeam(playerTeamCreate: PlayerTeamCreateDTO) {
        try {
            const myToken = localStorage.getItem("token");
            if (!myToken) {
                throw new Error("No token found");
            }

            const url = await fetch(`${process.env.REACT_APP_API_URL}/Team/Player`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${myToken}`,
                },
                body: JSON.stringify(playerTeamCreate),
            });
            if (!url.ok) {
                throw new Error("Error in addPlayersToTeam");
            }
            const text = await url.text();

            // Parse the response body
            const data = JSON.parse(text);
            return data;

        } catch (error) {
            console.error("Error in addPlayerToTeam FE:", error);
            throw error;
        }
    }


}

export default TeamService;