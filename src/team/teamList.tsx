import React from 'react';
import logo from './logo.svg';
import { Player } from '../models/Player';
import { Team } from '../models/Team';
import { useEffect, useState } from "react";
import TeamService from '../services/TeamService';
import TeamGetWithPlayersDTO from '../models/DTOs/Team/TeamGetWithPlayersDTO';
import TeamGetBasicDTO from '../models/DTOs/Team/TeamGetBasicDTO';


const TeamListTable = () => {
        
        const [teams, setTeams] = useState<TeamGetBasicDTO[]>([]);
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

function ListRow(team: TeamGetBasicDTO) {
    return (
        <tr>
            <td>{team.id}</td>
            <td>{team.name}</td>
        </tr>
    );
}

export default TeamListTable;
