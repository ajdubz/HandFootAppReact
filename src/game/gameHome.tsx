import { Button, Table } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import "../App.css";
import "./gameHome.css";
import GameWithRulesDTO from "../models/DTOs/Game/GameWithRulesDTO";
import GameService from "../services/GameService";
import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import { calcCleans, calcDirties, calcRed3s, calcScore } from "./gameHomeUtils";
import { useCallback, useEffect, useState } from "react";

interface RouteParams {
    [id: string]: string | undefined;
}

function GamePage() {
    const { id = "" } = useParams<RouteParams>();
    const { gameId = "" } = useParams<RouteParams>();
    const [game, setGame] = useState<GameWithRulesDTO>();
    const [teams, setTeams] = useState<GameTeamDTO[]>();
    const [teamStats, setTeamStats] = useState<Record<number, { totalScore: number; cleanBooks: number; dirtyBooks: number; redThrees: number }>>({});

    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
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
            .then(async (data) => {
                console.log(`getTeamsByGameId: `);
                console.log(data);
                setTeams(data);
                const statsEntries = await Promise.all(
                    (data ?? []).map(async (team) => {
                        const teamId = team.team?.id ?? 0;
                        const [totalScore, cleanBooks, dirtyBooks, redThrees] = await Promise.all([
                            calcScore(team),
                            calcCleans(team),
                            calcDirties(team),
                            calcRed3s(team),
                        ]);

                        return [
                            teamId,
                            {
                                totalScore: totalScore ?? 0,
                                cleanBooks: cleanBooks ?? 0,
                                dirtyBooks: dirtyBooks ?? 0,
                                redThrees: redThrees ?? 0,
                            },
                        ] as const;
                    })
                );
                setTeamStats(Object.fromEntries(statsEntries));
            })
            .catch((error) => {
                console.error("Error in getTeamsByGameId:", error);
                setTeams([]);
                setTeamStats({});
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
    }, [gameId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleBack = () => {
        // alert(`Back to player ${id} from game ${gameId}`);
        navigate(`/player/${id}`);
    };

    return (
        <div>
            <h1>Game Home</h1>
            {game?.id && <h2>{`Game ${game.id}`}</h2>}
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
                                <td>{teamStats[team.team?.id ?? 0]?.totalScore ?? 0}</td>
                                <td>{teamStats[team.team?.id ?? 0]?.cleanBooks ?? 0}</td>
                                <td>{teamStats[team.team?.id ?? 0]?.dirtyBooks ?? 0}</td>
                                <td>{teamStats[team.team?.id ?? 0]?.redThrees ?? 0}</td>
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
