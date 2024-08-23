import { useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { useParams, useNavigate } from "react-router-dom";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import TeamService from "../services/TeamService";
import TeamGetBasicDTO from "../models/DTOs/Team/TeamGetBasicDTO";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";

interface RouteParams {
    [id: string]: string | undefined;
}


function PlayerDetails() {
    const { id = "" } = useParams<RouteParams>();
    const [player, setPlayer] = useState<PlayerFullDetailsDTO>();
    const [nickname, setNickname] = useState<string>(player?.nickName || '');
    const [teams, setTeams] = useState<TeamGetBasicDTO[]>([]);
    const navigate = useNavigate();

    useEffect(() => {

        const fetchData = async () => {
            
            const players = !id ? new PlayerFullDetailsDTO : await PlayerService.getPlayerAccountById(Number(id));
            const teams = await TeamService.getTeams();
            setPlayer(players);
            setTeams(teams);
    
            setNickname(players?.nickName || '');
        };
        
        fetchData();
        
    }, [id, PlayerService, navigate]);


    const onSubmitFunc = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form values
        if (!nickname?.trim()) {
            alert("Nickname is required");
            return;
        }

        if (id) {
            // Push to backend
            const playerData: PlayerFullDetailsDTO = {
                nickName: nickname,

            };

            PlayerService.updatePlayer(Number(id), playerData);
        }

        navigate("/players");
    };

    const onCancelFunc = () => {
        navigate("/players");
    };

    
    return (
        <div>
            <h2>Player Details</h2>
            <form onSubmit={onSubmitFunc}>
                <label>
                    Nickname:
                    <input type="text" name="nickname" defaultValue={nickname} onChange={(e) => setNickname(e.target.value)} />
                </label>
                <br />
                <br />
                <label>
                    Friends:
                    {player?.friends && ListFriends(player.friends)}
                </label>
                <br />
                <div>
                    <button>Add Friend</button>
                </div>
                <br />
                <br />
                <div>
                    <button type="submit">Save</button>
                    <button type="button" onClick={onCancelFunc}>
                        Cancel
                    </button>
                </div>
                
            </form>
        </div>
    );
}


function ListFriends(friends: PlayerGetBasicDTO[]) {
    return (
        <span>
            {friends.map((friend) => (
                <span key={friend.id}> {friend.nickName}</span>
            ))}
        </span>
    );
}

export default PlayerDetails;
