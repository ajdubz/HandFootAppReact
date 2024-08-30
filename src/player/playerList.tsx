import { useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { Link, useNavigate } from "react-router-dom";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import FriendService from "../services/FriendService";

interface PlayerSearchProps {
    id?: number;
    searchText: string;
    setSearchPlayersFunc: (players: PlayerGetBasicDTO[] | undefined, text: string) => void;
}

const PlayerListTable = () => {
    const [players, setPlayers] = useState<PlayerGetBasicDTO[] | undefined>([]);
    const navigateTo = useNavigate();

    const fetchData = async () => {
        await PlayerService.getPlayers().then((data) => setPlayers(data)).catch((error) => console.error(error));
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
                    {players && ListFriends(players, (player) => { navigateTo(`/player/${player?.id}`)})}
                </tbody>
            </table>
            <br />
            <div>
                <span>
                    <Link to="/player/account">Add Player</Link>
                </span>
            </div>
        </div>
    );
};




const performPlayerSearch = async (inId: number, searchText: string, setSearchPlayersFunc: ( players: PlayerGetBasicDTO[] | undefined, text: string) => void)=> {
    if (searchText === "") {
        setSearchPlayersFunc(undefined, "");
        return { inId, searchText, setSearchPlayersFunc };
    }

    return await FriendService.searchNewFriends(inId , searchText).then((data) => setSearchPlayersFunc(data, searchText)).catch((error) => console.error(error));
}





const ListFriends = (friends: PlayerGetBasicDTO[] | undefined, onClickFunc: (playerSelected: PlayerGetBasicDTO | undefined) => void) => {
    return (
        <div>
            {friends?.map((friend) => (
                <div key={friend.id}><strong><a href="#" onClick={(e) => {e.preventDefault(); onClickFunc(friend)}}>{friend.nickName}</a></strong></div>
            ))}
        </div>
    );
};










export { PlayerListTable, ListFriends, performPlayerSearch };
