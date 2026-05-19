import { useCallback, useEffect, useState } from "react";
import TeamService from "../services/TeamService";
import TeamGetBasicDTO from "../models/DTOs/Team/TeamGetBasicDTO";
import { useNavigate } from "react-router-dom";
import GetTeamsByPlayerIdsDTO from "../models/DTOs/Team/GetTeamsByPlayerIdsDTO";
import TeamGetWithPlayerNamesDTO from "../models/DTOs/Team/TeamGetWithPlayerNamesDTO";

const TeamListTable = () => {
    const [teams, setTeams] = useState<TeamGetWithPlayerNamesDTO[] | undefined>([]);
    const navigateTo = useNavigate();
    const currentPlayerId = Number(localStorage.getItem("currentPlayerId") ?? localStorage.getItem("mockPlayerId") ?? 0);

    const fetchData = useCallback(async () => {
        await TeamService.getTeamsWithPlayerNames()
            .then((data) => {
                const filteredTeams = (data ?? []).filter((team) =>
                    team.teamMembers?.some((teamMember) => teamMember.id === currentPlayerId)
                );

                setTeams(filteredTeams);
                if(filteredTeams.length === 0) {
                    alert("No data found in TeamListTable");
                }
            })
            .catch((error) => console.error(error));
    }, [currentPlayerId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeletePreviousGames = async (team: TeamGetWithPlayerNamesDTO | undefined) => {
        if (!team?.id || !currentPlayerId) {
            return;
        }

        const shouldDelete = window.confirm("Delete your previous games for this team?");
        if (!shouldDelete) {
            return;
        }

        await TeamService.deletePreviousGamesForPlayerTeam(currentPlayerId, team.id)
            .then(() => {
                alert("Previous games deleted.");
                setTeams((currentTeams) => (currentTeams ?? []).filter((currentTeam) => currentTeam.id !== team.id));
            })
            .catch((error) => console.error(error));
    };



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
                            {teams && ListTeams(
                                teams,
                                (team) => { navigateTo(`/team/${team?.id}`)},
                                (team) => { handleDeletePreviousGames(team); }
                            )}
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    );
};


const ListTeams = (
    teams: TeamGetWithPlayerNamesDTO[] | undefined,
    onClickFunc: (teamSelected: TeamGetWithPlayerNamesDTO | undefined) => void,
    onDeleteGamesFunc?: (teamSelected: TeamGetWithPlayerNamesDTO | undefined) => void
) => {

    return (
        <div>
            {teams?.map((team) => (
                <div key={team.id}>
                    <strong>
                        <button type="button" className="link-button" onClick={() => onClickFunc(team)}>{team.name}</button>
                    </strong>
                    <span>
                        {" (" + team.teamMembers?.map((name) => (
                            name.nickName + ", "
                        )) + ")"}
                    </span>
                    {onDeleteGamesFunc && (
                        <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => onDeleteGamesFunc(team)}>
                            Delete My Previous Games
                        </button>
                    )}
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
