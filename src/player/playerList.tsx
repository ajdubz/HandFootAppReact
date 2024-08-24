import { useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { Link } from "react-router-dom";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";

const PlayerListTable = () => {
    const [players, setPlayers] = useState<PlayerGetBasicDTO[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const data = await PlayerService.getPlayers();
            setPlayers(data);
        };

        fetchData();
    });

    return (
        <div>
            <table>
                <ListHeaderRow></ListHeaderRow>
                <tbody>
                    {players.map((player) => {
                        return <ListRow key={player.id} {...player}></ListRow>;
                    })}
                </tbody>
            </table>
            <br />

            <AddPlayerRow />
        </div>
    );
};



function ListHeaderRow() {
    return (
        <thead>
            <tr>
                <th>Id</th>
                <th>Name</th>
            </tr>
        </thead>
    );
}

function ListRow(player: PlayerGetBasicDTO) {
    return (
        <tr>
            <td>{player.id}</td>
            <td>
                <Link to={`/player/${player.id}`} key={player.id}>{player.nickName}</Link>
            </td>
        </tr>
    );
}

function AddPlayerRow() {
    return (
        <div>
            <span>
                <Link to="/player/account">Add Player</Link>
            </span>
        </div>
    );
}

export default PlayerListTable;
