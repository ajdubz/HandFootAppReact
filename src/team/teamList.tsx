import React from "react";
import logo from "./logo.svg";
import { Player } from "../models/Player";
import { Team } from "../models/Team";
import { useEffect, useState } from "react";
import TeamService from "../services/TeamService";
import TeamGetBasicDTO from "../models/DTOs/Team/TeamGetBasicDTO";
import { useNavigate } from "react-router-dom";
import GetTeamsByPlayerIdsDTO from "../models/DTOs/Team/GetTeamsByPlayerIdsDTO";
import TeamGetWithPlayerNamesDTO from "../models/DTOs/Team/TeamGetWithPlayerNamesDTO";

const TeamListTable = () => {
    const [teams, setTeams] = useState<TeamGetWithPlayerNamesDTO[] | undefined>([]);
    const navigateTo = useNavigate();

    const fetchData = async () => {
        await TeamService.getTeamsWithPlayerNames()
            .then((data) => {
                setTeams(data);
                if(data && data.length == 0) {
                    alert("No data found in TeamListTable");
                }
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


const ListTeams = (teams: TeamGetWithPlayerNamesDTO[] | undefined, onClickFunc: (teamSelected: TeamGetWithPlayerNamesDTO | undefined) => void) => {

    return (
        <div>
            {teams?.map((team) => (
                <div key={team.id}>
                    <strong>
                        <a href="#" onClick={(e) => {e.preventDefault(); onClickFunc(team)}}>{team.name}</a>
                    </strong>
                    <span>
                        {" (" + team.teamMembers?.map((nickName) => (
                            nickName + ", "
                        )) + ")"}
                    </span>
                </div>
            ))}
        </div>
    );
};


const performTeamSearch = async (searchText: string, setSearchTeamsFunc: ( teams: TeamGetBasicDTO[] | undefined, text: string) => void)=> {
    if (searchText === "") {
        setSearchTeamsFunc(undefined, "");
        return { searchText, setSearchTeamsFunc };
    }

    return await TeamService.searchTeams(searchText).then((data) => setSearchTeamsFunc(data, searchText)).catch((error) => console.error(error));
}

const performPlayerTeamSearch = async (inId: number, searchText: string, setSearchTeamsFunc: ( teams: TeamGetWithPlayerNamesDTO[] | undefined, text: string) => void)=> {
    if (searchText === "") {
        setSearchTeamsFunc(undefined, "");
        return { inId, searchText, setSearchTeamsFunc };
    }

    return await TeamService.searchPlayerTeams(inId, searchText).then((data) => setSearchTeamsFunc(data, searchText)).catch((error) => console.error(error));
}

const getTeamsByPlayerTeams = async (inGetTeamsByPlayerIdDTO: GetTeamsByPlayerIdsDTO, setSearchTeamsFunc: ( teams: TeamGetWithPlayerNamesDTO[] | undefined) => void)=> {
    if (inGetTeamsByPlayerIdDTO.player1Id === 0) {
        setSearchTeamsFunc(undefined);
        return { inGetTeamsByPlayerIdDTO, setSearchTeamsFunc };
    }

    return await TeamService.getTeamsByPlayers(inGetTeamsByPlayerIdDTO).then((data) => setSearchTeamsFunc(data)).catch((error) => console.error(error));
}


export  { TeamListTable, ListTeams, performTeamSearch, getTeamsByPlayerTeams, performPlayerTeamSearch };
