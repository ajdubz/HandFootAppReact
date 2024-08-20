import PlayerCreateDTO from "../models/DTOs/Player/PlayerCreateDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicsDTO";
import PlayerGetWithFriendsDTO from "../models/DTOs/Player/PlayerGetWithFriendsDTO";
import PlayerUpdateDTO from "../models/DTOs/Player/PlayerUpdateDTO";

class PlayerService {
    
    public static async getPlayers(): Promise<PlayerGetBasicDTO[]> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player`);
            const data = await url.json();
            return data;
        } catch (error) {
            console.error('Error in getPlayers:', error);
            throw error;
        }
    } 

    public static async getPlayerById(id: number): Promise<PlayerGetWithFriendsDTO> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player/${id}`);
            const data = await url.json();
            return data;
        } catch (error) {
            console.error('Error in getPlayerById:', error);
            throw error;
        }
    }

    public static async createPlayer(player: PlayerCreateDTO): Promise<any> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player`, {
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

    public static async updatePlayer(player: PlayerUpdateDTO): Promise<any> {
        try {
            const url = await fetch(`${process.env.REACT_APP_API_URL}/Player`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(player)
            });
            const data = await url.json();
            return data;
        } catch (error) {
            console.error('Error in updatePlayer:', error);
            throw error;
        }
    }
}

export default PlayerService;