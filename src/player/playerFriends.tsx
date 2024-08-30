import { ChangeEvent, ReactElement, useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import FriendService from "../services/FriendService";
import { useParams, useNavigate, Link } from "react-router-dom";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import ConfirmChanges from "../modals/confirmChanges";
import PlayerFullDetailsDTO from "../models/DTOs/Player/PlayerFullDetailsDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import { Button, ListGroup } from "react-bootstrap";
import PlayerFriendBasicDTO from "../models/DTOs/Player/PlayerFriendBasicDTO";
import { ListFriends } from "./playerList";

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
    const [showConfirmChanges, setShowConfirmChanges] = useState<boolean>(false);
    const [playerFriend, setPlayerFriend] = useState<PlayerFriendBasicDTO>(new PlayerFriendBasicDTO());
    const navigateTo = useNavigate();



    const fetchData = async () => {

        await FriendService.getFriends(Number(id)).then((data) => setFriends(data)).catch((error) => { console.error("Error in getFriends:", error); return [] });
        await FriendService.getFriendRequests(Number(id)).then((data) => setFriendRequests(data)).catch((error) => { console.error("Error in getFriendRequests:", error); return [] });
        await FriendService.getSentFriendRequests(Number(id)).then((data) => setSentFriendRequests(data)).catch((error) => { console.error("Error in getSentFriendRequests:", error); return [] });

    };

    const sendRequest = async (playerFriend: PlayerFriendBasicDTO) => {
        await FriendService.sendFriendRequest(Number(id), playerFriend).then(() => fetchData()).catch((error) => { console.error("Error in sendFriendRequest:", error); return [] });
    };

    const acceptRequest = async (playerFriend: PlayerFriendBasicDTO) => {
        await FriendService.acceptFriendRequest(Number(id), playerFriend).then(() => fetchData()).catch((error) => { console.error("Error in acceptFriendRequest:", error); return [] });
    };

    useEffect(() => {
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
                {ListFriends(friends, friendListClick)}
            </label>
            <br />
            <br />
            <label>
                Friend Requests:
                {ListFriends(friendRequests, acceptFriendClick)}
            </label>
            <br />
            <br />
            <label>
                Sent Friend Requests:
                {ListFriends(sentFriendRequests, friendListClick)}
            </label>
            <br />
            <br />
            <br />
            <div>
                <input type="text" name="searchText" placeholder="Search Players" value={searchText} onChange={(e) => { e.preventDefault(); handleSearchPlayers(e); }} />
                {searchPlayersResults && ShowSearchPlayers(searchPlayersResults)}
                {showAddFriend && <Button onClick={handleSendRequest}>Add Player</Button>}
            </div>
            <br />
            <br />
            
            <Link to={`/player/${id}`}>Back</Link>
            <ConfirmChanges isOpen={showConfirmChanges} onCancel={() => { setShowConfirmChanges(false) }} onConfirm={() => { friendRequestClick() }} />


        </div>
    );

    function acceptFriendClick(playerId: number | undefined) {
        let miniPlayerFriend = new PlayerFriendBasicDTO();

        miniPlayerFriend.friendId = playerId;
        miniPlayerFriend.playerId = Number(id);

        setPlayerFriend(miniPlayerFriend);

        setShowConfirmChanges(true);
    }

    function ShowSearchPlayers(searchPlayers: PlayerGetBasicDTO[] | undefined): ReactElement {
        return (
            <div>
                {searchPlayers?.map((player) => (
                    <div key={player.id}>
                        <strong>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleSearchPlayersClick(player.id, player.nickName); }}>{player.nickName}</a>
                        </strong>
                    </div>
                ))}
            </div>
        );
    }

    function handleSearchPlayers(event: ChangeEvent<HTMLInputElement>) {
        let search = event.target.value;
        setShowAddFriend(false);
        setSearchText(search);
        if (search.length > 0) {
            FriendService.searchNewFriends(Number(id), search).then((data) => setSearchPlayers(data)).catch((error) => { console.error("Error in searchPlayers:", error); return [] });
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

    function handleSendRequest( event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        event.preventDefault();
        let playerFriend = new PlayerFriendBasicDTO();
        playerFriend.friendId = newFriendId;
        playerFriend.playerId = Number(id);
        
        setSearchPlayers([]);
        setNewFriendId(0);
        setSearchText("");
        setShowAddFriend(false);

        sendRequest(playerFriend);
    }

    function friendRequestClick() {
        setShowConfirmChanges(false);
        acceptRequest(playerFriend);
    }

    function friendListClick(playerId: number | undefined) {
        navigateTo(`/player/${playerId}`);

    }





}




export default PlayerFriends;