import { Player } from "../models/Player";
import { useEffect, useState } from "react";
import PlayerService from "../services/PlayerService";
import { Link } from "react-router-dom";

const PlayerListTable = () => {

    const [players, setPlayers] = useState<Player[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const data = await PlayerService.getPlayers();
            setPlayers(data);
        };

        fetchData();
    }, []);


    return (
        <div>
            <table>
                <ListHeaderRow></ListHeaderRow>
                <tbody>
                    {players.map((player) => {
                        return <ListRowWithLink key={player.id} {...player}></ListRowWithLink>;
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

function ListRowWithLink(player: Player) {
    return (
        <tr>
            <td>{player.id}</td>
            <td>
                <Link to={`/player/${player.id}`}>{player.nickName}</Link>
            </td>
        </tr>
    );
}

function AddPlayerRow() {
    return (
        <div>
            <span>
                <Link to="/player">Add Player</Link>
            </span>
        </div>
    );
}

export default PlayerListTable;
