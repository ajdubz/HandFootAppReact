import { ChangeEvent, useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import FriendService from "../services/FriendService";
import { useParams, useNavigate, Link } from "react-router-dom";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import ConfirmChanges from "../modals/confirmChanges";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import { Button, ListGroup } from "react-bootstrap";
import PlayerFriendBasicDTO from "../models/DTOs/Player/PlayerFriendBasicDTO";

interface RouteParams {
    [id: string]: string | undefined;
}

function PlayerFriends(): React.ReactElement {
    const { id = "" } = useParams<RouteParams>();
    const [friends, setFriends] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const [friendRequests, setFriendRequests] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const [sentFriendRequests, setSentFriendRequests] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const [searchPlayers, setSearchPlayers] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const [searchPlayersResults, setSearchPlayersResults] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const [searchText, setSearchText] = useState<string>("");
    const [showAddFriend, setShowAddFriend] = useState<boolean>(false);
    const [newFriendId, setNewFriendId] = useState<number>(0);

    useEffect(() => {

        const fetchData = async () => {

            await FriendService.getFriends(Number(id)).then((data) => setFriends(data)).catch((error) => { console.error("Error in getFriends:", error); return [] });
            await FriendService.getFriendRequests(Number(id)).then((data) => setFriendRequests(data)).catch((error) => { console.error("Error in getFriendRequests:", error); return [] });
            await FriendService.getSentFriendRequests(Number(id)).then((data) => setSentFriendRequests(data)).catch((error) => { console.error("Error in getSentFriendRequests:", error); return [] });
    
        };
        
        fetchData();
        
    }, []);

    useEffect(() => {
        setSearchPlayersResults(searchPlayers);
    }, [searchPlayers]);


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
                <input type="text" name="searchText" placeholder="Search Players" value={searchText} onChange={(e) => { e.preventDefault(); handleSearchPlayers(e); }} />
                {searchPlayersResults && ShowSearchPlayers(searchPlayersResults)}
                {showAddFriend && <Button onClick={handleFriendRequest}>Add Player</Button>}
            </div>
            <br />
            <br />

            
            <Link to={`/player/${id}`}>Back</Link>


        </div>
    );

    function ShowSearchPlayers(searchPlayers: PlayerGetBasicDTO[] | undefined): React.ReactElement {
        return (
            <div>
                {searchPlayers?.map((player) => (
                    <div key={player.id}>
                        <ListGroup>
                            <ListGroup.Item key={player.id}>
                                <strong>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleSearchPlayersClick(player.id, player.nickName); }}>{player.nickName}</a>
                                </strong>
                            </ListGroup.Item>
                        </ListGroup>
                    </div>
                ))}
            </div>
        );
    }

    function handleSearchPlayers(event: React.ChangeEvent<HTMLInputElement>) {
        let search = event.target.value;
        setShowAddFriend(false);
        setSearchText(search);
        if (search.length > 0) {
            PlayerService.searchNewFriends(search).then((data) => setSearchPlayers(data)).catch((error) => { console.error("Error in searchPlayers:", error); return [] });
        } else {
            setSearchPlayers([]);
        }
    }

    function handleSearchPlayersClick(newFriendId: number | undefined, inPlayerName: string | undefined) {
        let search = inPlayerName;
        if (search && newFriendId && search.length > 0) {
            setSearchText(search);
            setSearchPlayers([]);
            setShowAddFriend(true);
            setNewFriendId(newFriendId);
        }
    }

    function handleFriendRequest( event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        setSearchPlayers([]);
        let playerFriend = new PlayerFriendBasicDTO();
        playerFriend.friendId = newFriendId;
        playerFriend.playerId = Number(id);
        
        FriendService.sendFriendRequest(Number(id), playerFriend).then(() => console.log("Friend request sent to:", searchText)).catch((error) => { console.error("Error in sendFriendRequest:", error); return [] });
    }
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