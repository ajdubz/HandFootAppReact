import TeamCreateDTO from "../models/DTOs/Team/TeamCreateDTO";
import TeamGetBasicDTO from "../models/DTOs/Team/TeamGetBasicDTO";
import TeamGetWithPlayersDTO from "../models/DTOs/Team/TeamGetWithPlayersDTO";

class TeamService {
    
    public static async getTeams(): Promise<TeamGetBasicDTO[]> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Team`);
            const data = await url.json();
            return data;
        } catch (error) {
            console.error('Error in getTeams:', error);
            throw error;
        }
    } 

    public static async getTeamById(id: number): Promise<TeamGetWithPlayersDTO> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Team/${id}`);
            const data = await url.json();
            return data;
        } catch (error) {
            console.error('Error in getTeamById:', error);
            throw error;
        }
    }

    public static async createTeam(Team: TeamCreateDTO): Promise<any> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Team`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Team)
            });
            const data = await url.json();
            return data;
        } catch (error) {
            console.error('Error in createTeam:', error);
            throw error;
        }
    }
}

export default TeamService;