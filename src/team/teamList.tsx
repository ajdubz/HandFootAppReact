import React from 'react';
import logo from './logo.svg';
import { Player } from '../models/Player';
import { Team } from '../models/Team';
import { useEffect, useState } from "react";
import TeamService from '../services/TeamService';


const TeamListTable = () => {
        
        const [teams, setTeams] = useState<Team[]>([]);
        useEffect(() => {
            const fetchData = async () => {
                const data = await TeamService.getTeams();
                setTeams(data);
            };
            fetchData();
        }, []);
    
        return (
            <table>
                <ListHeaderRow></ListHeaderRow>
                {teams.map((team) => {
                    return (
                        <ListRow key={team.id} {...team}></ListRow>
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
        </tr>
    );
}

function ListRow(team: Team) {
    return (
        <tr>
            <td>{team.id}</td>
            <td>{team.name}</td>
        </tr>
    );
}

export default TeamListTable;
