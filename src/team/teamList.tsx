import React from "react";
import logo from "./logo.svg";
import { Player } from "../models/Player";
import { Team } from "../models/Team";
import { useEffect, useState } from "react";
import TeamService from "../services/TeamService";
import TeamGetBasicDTO from "../models/DTOs/Team/TeamGetBasicDTO";
import { useNavigate } from "react-router-dom";
import GetTeamsByPlayerIdsDTO from "../models/DTOs/Team/GetTeamsByPlayerIdsDTO";

const TeamListTable = () => {
    const [teams, setTeams] = useState<TeamGetBasicDTO[] | undefined>([]);
    const navigateTo = useNavigate();

    const fetchData = async () => {
        await TeamService.getTeams()
            .then((data) => {
                setTeams(data);
            })
            .catch((error) => console.error(error));
    };

    useEffect(() => {
        fetchData();
    }, []);



    return (
        <table>
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Name</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <div>
                            {teams && ListTeams(teams, (team) => { navigateTo(`/team/${team?.id}`)})}
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    );
};


const ListTeams = (teams: TeamGetBasicDTO[] | undefined, onClickFunc: (playerSelected: TeamGetBasicDTO | undefined) => void) => {

    return (
        <div>
            {teams?.map((team) => (
                <div key={team.id}>
                    <strong>
                        <a href="#"
                            onClick={(e) => { e.preventDefault(); onClickFunc(team); }} >
                            {team.name}
                        </a>
                    </strong>
                </div>
            ))}
        </div>
    );
};


const performTeamSearch = async (inId: number, searchText: string, setSearchTeamsFunc: ( teams: TeamGetBasicDTO[] | undefined, text: string) => void)=> {
    if (searchText === "") {
        setSearchTeamsFunc(undefined, "");
        return { inId, searchText, setSearchTeamsFunc };
    }

    return await TeamService.searchTeams(inId , searchText).then((data) => setSearchTeamsFunc(data, searchText)).catch((error) => console.error(error));
}

const performTeamByPlayerSearch = async (inGetTeamsByPlayerIdDTO: GetTeamsByPlayerIdsDTO, setSearchTeamsFunc: ( teams: TeamGetBasicDTO[] | undefined) => void)=> {
    if (inGetTeamsByPlayerIdDTO.player1Id === 0) {
        setSearchTeamsFunc(undefined);
        return { inGetTeamsByPlayerIdDTO, setSearchTeamsFunc };
    }

    return await TeamService.getTeamsByPlayers(inGetTeamsByPlayerIdDTO).then((data) => setSearchTeamsFunc(data)).catch((error) => console.error(error));
}


export  { TeamListTable, ListTeams, performTeamSearch, performTeamByPlayerSearch };
