class PlayerService {
    
    public static async getPlayers() {
        try {
            const url = await fetch('https://localhost:7133/Player');
            const data = await url.json();
            return data;
        } catch (error) {
            console.error('Error in getPlayers:', error);
            throw error;
        }
    } 

    public static async getPlayerById(id: string) {
        try {
            const url = await fetch(`https://localhost:7133/Player/${id}`);
            const data = await url.json();
            console.log(data);
            return data;
        } catch (error) {
            console.error('Error in getPlayerById:', error);
        }
    }

    public static async createPlayer(player: any) {
        try {
            const url = await fetch('https://localhost:7133/Player', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(player)
            });
            const data = await url.json();
            return data;
        } catch (error) {
            console.error('Error in createPlayer:', error);
            throw error;
        }
    }
}

export default PlayerService;