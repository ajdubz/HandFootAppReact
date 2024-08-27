import { useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { useParams, useNavigate, Link } from "react-router-dom";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import ConfirmChanges from "../modals/confirmChanges";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";

interface RouteParams {
    [id: string]: string | undefined;
}



function PlayerFriends(): React.ReactElement {
    const { id = "" } = useParams<RouteParams>();
    const [player, setPlayer] = useState<PlayerFullDetailsDTO>();

    useEffect(() => {

        const fetchData = async () => {
            
            const players = !id ? new PlayerFullDetailsDTO : await PlayerService.getPlayerAccountById(Number(id));
            setPlayer(players);
    
        };
        
        fetchData();
        
    }, []);

    return (
        <div>
            <h1>Player Friends</h1>
            <label>
                Friends:
                {player?.friends && ListFriends(player.friends)}
            </label>
            <br />
            {/* <label>
                Friend Requests:
                {player?.friendRequests && ListFriends(player.friendRequests)}
            </label>
            <br />
            <label>
                Sent Friend Requests:
                {player?.sentFriendRequests && ListFriends(player.sentFriendRequests)}
            </label> */}
            <br />
            <Link to={`/player/${id}`}>Back</Link>


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

export default PlayerFriends;