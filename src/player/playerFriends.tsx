import { useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import FriendService from "../services/FriendService";
import { useParams, useNavigate, Link } from "react-router-dom";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import ConfirmChanges from "../modals/confirmChanges";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import { Button } from "react-bootstrap";

interface RouteParams {
    [id: string]: string | undefined;
}

function PlayerFriends(): React.ReactElement {
    const { id = "" } = useParams<RouteParams>();
    const [friends, setFriends] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const [friendRequests, setFriendRequests] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const [sentFriendRequests, setSentFriendRequests] = useState<PlayerGetBasicDTO[] | undefined>([]);

    useEffect(() => {

        const fetchData = async () => {

            await FriendService.getFriends(Number(id)).then((data) => setFriends(data)).catch((error) => { console.error("Error in getFriends:", error); return [] });
            await FriendService.getFriendRequests(Number(id)).then((data) => setFriendRequests(data)).catch((error) => { console.error("Error in getFriendRequests:", error); return [] });
            await FriendService.getSentFriendRequests(Number(id)).then((data) => setSentFriendRequests(data)).catch((error) => { console.error("Error in getSentFriendRequests:", error); return [] });
    
        };
        
        fetchData();
        
    }, []);

    return (
        <div>
            <h1>Player Friends</h1>
            <label>
                Friends:
                {ListFriends(friends)}
            </label>
            <br />
            <br />
            <label>
                Friend Requests:
                {ListFriends(friendRequests)}
            </label>
            <br />
            <br />
            <label>
                Sent Friend Requests:
                {ListFriendRequests(sentFriendRequests)}
            </label>
            <br />
            <br />
            <br />
            <div>
                <Button variant="outline-primary">Add Friend</Button>
            </div>
            <br />
            <br />

            
            <Link to={`/player/${id}`}>Back</Link>


        </div>
    );
}

function ListFriends(friends: PlayerGetBasicDTO[] | undefined): React.ReactElement {
    return (
        <div>
            {friends?.map((friend) => (
                <div key={friend.id}><strong><Link to={`/player/${friend.id}`}>{friend.nickName}</Link></strong></div>
            ))}
        </div>
    );
}

function ListFriendRequests(friends: PlayerGetBasicDTO[] | undefined): React.ReactElement {
    return (
        <div>
            {friends?.map((friend) => (
                <div key={friend.id}><strong>{friend.nickName}</strong></div>
            ))}
        </div>
    );
}

export default PlayerFriends;