import { Button, Table } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import "../App.css";
import "./gameHome.css";
import GameWithRulesDTO from "../models/DTOs/Game/GameWithRulesDTO";
import GameService from "../services/GameService";
import PlayerTeamDTO from "../models/DTOs/Team/PlayerTeamDTO";
import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";
import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import { calcCleans, calcDirties, calcRed3s, calcScore } from "./gameHomeUtils";
import { useEffect, useState } from "react";

interface RouteParams {
    [id: string]: string | undefined;
}

function GamePage() {
    const { id = "" } = useParams<RouteParams>();
    const { gameId = "" } = useParams<RouteParams>();
    const [game, setGame] = useState<GameWithRulesDTO>();
    const [teams, setTeams] = useState<GameTeamDTO[]>();
    const [rounds, setRounds] = useState<GameRoundDTO[]>();
    let totalScores: number[] = [];
    let cleanBooks: number[] = [];
    let dirtyBooks: number[] = [];
    let redThrees: number[] = [];

    const navigate = useNavigate();

    const fetchData = async () => {
        await GameService.getGameById(Number(gameId))
            .then((data) => {
                console.log(`getGameById: `);
                console.log(data);
                setGame(data);
            })
            .catch((error) => {
                console.error("Error in getGameById:", error);
                setGame(new GameWithRulesDTO());
            });

        await GameService.getTeamsByGameId(Number(gameId))
            .then((data) => {
                console.log(`getTeamsByGameId: `);
                console.log(data);
                setTeams(data);
                data?.forEach(async (team) => {
                    // let totalScore = await calcScore(team);
                    let cleans = await calcCleans(team);
                    // let dirties = await calcDirties(team);
                    // let red3s = await calcRed3s(team);
                    cleanBooks[team.team?.id != undefined ? team.team?.id : 0] = cleans ?? 0; 
                    // dirtyBooks[team.team?.id != undefined ? team.team?.id : 0] = dirties ?? 0;
                    // redThrees[team.team?.id != undefined ? team.team?.id : 0] = red3s ?? 0;
                    // totalScores[team.team?.id != undefined ? team.team?.id : 0] = totalScore ?? 0;
                });
            })
            .catch((error) => {
                console.error("Error in getTeamsByGameId:", error);
                setTeams([]);
            });

        // await GameService.getRoundsByGameId(Number(gameId))
        //     .then((data) => {
        //         console.log(`getRoundsByGameId: `);
        //         console.log(data);
        //         setRounds(data);
        //     })
        //     .catch((error) => {
        //         console.error("Error in getRoundsByGameId:", error);
        //         setRounds([]);
        //     });
    };

    useEffect(() => {
        fetchData();
    }, [gameId]);

    const handleBack = () => {
        // alert(`Back to player ${id} from game ${gameId}`);
        navigate(`/player/${id}`);
    };

    return (
        <div>
            <h1>Game Home</h1>
            <div>
                <Table bordered id="gameTable">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Team Name</th>
                            <th>Total Score</th>
                            <th>Clean Books</th>
                            <th>Dirty Books</th>
                            <th>Red 3's</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams?.map((team) => (
                            <tr key={team.team?.id}>
                                <td>{team.team?.id}</td>
                                <td>
                                    {team.team?.name +
                                        " - " +
                                        team.team?.teamMembers?.map((names, i) => ((team.team?.teamMembers?.length ?? 0) > i + 1 ? (names?.nickName ?? "") + ", " : names?.nickName ?? ""))}</td>
                                <td>{(team.team?.id !== undefined && cleanBooks[team.team.id] ? cleanBooks[team.team.id] : 0)}</td>
                                <td>{0}</td>
                                <td>{0}</td>
                                <td>{0}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
            <Button variant="primary" onClick={handleBack}>
                Back
            </Button>
        </div>
    );
}

export default GamePage;
