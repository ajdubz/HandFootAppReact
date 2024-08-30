import { useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { Link, useNavigate } from "react-router-dom";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";

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
                    {players && ListFriends(players, (playerId) => { navigateTo(`/player/${playerId}`)})}
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

const ListFriends = (friends: PlayerGetBasicDTO[] | undefined, onClickFunc: (playerId: number | undefined) => void) => {
    return (
        <div>
            {friends?.map((friend) => (
                <div key={friend.id}><strong><a href="#" onClick={(e) => {e.preventDefault(); onClickFunc(friend.id)}}>{friend.nickName}</a></strong></div>
            ))}
        </div>
    );
};

export { PlayerListTable, ListFriends };
