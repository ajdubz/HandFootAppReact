class TeamService {
    
    public static async getTeams() {
        try {
            const url = await fetch('https://localhost:7133/Team');
            const data = await url.json();
            return data;
        } catch (error) {
            console.error('Error in getTeams:', error);
            throw error;
        }
    } 

    public static async getTeamById(id: number) {
        try {
            const url = await fetch(`https://localhost:7133/Team/${id}`);
            const data = await url.json();
            return data;
        } catch (error) {
            console.error('Error in getTeamById:', error);
            throw error;
        }
    }

    public static async createTeam(Team: any) {
        try {
            const url = await fetch('https://localhost:7133/Team', {
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