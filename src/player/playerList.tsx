import React from 'react';
import logo from './logo.svg';
import { Player } from '../models/Player';
import { useEffect, useState } from "react";
import PlayerService from '../services/PlayerService';

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
            <ListHeaderRow></ListHeaderRow>
            {players.map((player) => {
                return (
                    <ListRow key={player.id} {...player}></ListRow>
                );
            })}
        </table>
    );
}

function ListHeaderRow() {
    return (
        <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Team Name</th>
        </tr>
    );
}

function ListRow(player: Player) {
    return (
        <tr>
            <td>{player.id}</td>
            <td>{player.nickName}</td>
            <td>{player.team.name}</td>
        </tr>
    );
}



export default PlayerListTable;