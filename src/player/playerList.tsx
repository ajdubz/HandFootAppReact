import React from "react";
import logo from "./logo.svg";
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
        <table>
            <thead>
                <ListHeaderRow></ListHeaderRow>
            </thead>
            <tbody>
                {players.map((player) => {
                    return <ListRowWithLink key={player.id} {...player}></ListRowWithLink>;
                })}
            </tbody>
        </table>
    );
};

function ListHeaderRow() {
    return (
        <tr>
            <th>Id</th>
            <th>Name</th>
        </tr>
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

export default PlayerListTable;
