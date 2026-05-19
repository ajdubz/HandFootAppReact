import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Table } from "react-bootstrap";
import GameService from "../services/GameService";
import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import { calculateTeamStats } from "../game/gameHomeUtils";
import "../game/gameHome.css";

interface RouteParams {
    [id: string]: string | undefined;
}

type GameResult = {
    gameId: number;
    gameDate: Date | undefined;
    rankedTeams: GameTeamDTO[];
    teamStats: Record<number, { totalScore: number; cleanBooks: number; dirtyBooks: number; redThrees: number }>;
};

function TeamResults(): React.ReactElement {
    const { id = "" } = useParams<RouteParams>();
    const teamId = Number(id);
    const [results, setResults] = useState<GameResult[]>([]);
    const [error, setError] = useState("");
    const currentPlayerId = Number(localStorage.getItem("currentPlayerId") ?? localStorage.getItem("mockPlayerId") ?? 0);

    const fetchResults = useCallback(async () => {
        setError("");

        try {
            const games = await GameService.getGames();
            const allGames = games ?? [];

            const gamesWithDetails = await Promise.all(allGames.map(async (game) => {
                const gameId = game.id ?? 0;
                if (!gameId) {
                    return undefined;
                }

                const [teams, rounds] = await Promise.all([
                    GameService.getTeamsByGameId(gameId),
                    GameService.getRoundsByGameId(gameId),
                ]);

                const gameTeams = teams ?? [];
                const gameRounds = rounds ?? [];
                const hasSelectedTeam = gameTeams.some((gameTeam) => gameTeam.team?.id === teamId);

                if (!hasSelectedTeam || !gameRounds.length) {
                    return undefined;
                }

                const teamStats = calculateTeamStats(gameTeams, gameRounds);
                const rankedTeams = [...gameTeams].sort((a, b) =>
                    (teamStats[b.id ?? 0]?.totalScore ?? 0) - (teamStats[a.id ?? 0]?.totalScore ?? 0)
                );

                return {
                    gameId,
                    gameDate: game.date ? new Date(game.date) : undefined,
                    rankedTeams,
                    teamStats,
                } as GameResult;
            }));

            setResults(gamesWithDetails.filter(Boolean) as GameResult[]);
        } catch (loadError) {
            console.error("Error loading team results:", loadError);
            setError("Unable to load team game results.");
            setResults([]);
        }
    }, [teamId]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const sortedResults = useMemo(() =>
        [...results].sort((a, b) => (b.gameDate?.getTime() ?? 0) - (a.gameDate?.getTime() ?? 0)),
    [results]);

    return (
        <div className="game-page">
            <div className="game-header">
                <div>
                    <h1>Team Results</h1>
                    <p className="round-context">Final scoreboards for games involving this team.</p>
                </div>
                <Link to={currentPlayerId ? `/player/${currentPlayerId}` : "/teams"}>Back</Link>
            </div>

            {error && <div className="round-error">{error}</div>}

            {!sortedResults.length && !error && (
                <section className="game-section">
                    <p>No completed game results found for this team yet.</p>
                </section>
            )}

            {sortedResults.map((result) => (
                <section className="game-section" key={result.gameId}>
                    <h2>
                        Game #{result.gameId}
                        {result.gameDate ? ` - ${result.gameDate.toLocaleDateString()}` : ""}
                    </h2>
                    <Table bordered responsive id="gameTable">
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
                            {result.rankedTeams.map((gameTeam, index) => {
                                const stats = result.teamStats[gameTeam.id ?? 0];
                                return (
                                    <tr key={gameTeam.id}>
                                        <td>{index + 1}</td>
                                        <td>{gameTeam.team?.name}</td>
                                        <td>{stats?.totalScore ?? 0}</td>
                                        <td>{stats?.cleanBooks ?? 0}</td>
                                        <td>{stats?.dirtyBooks ?? 0}</td>
                                        <td>{stats?.redThrees ?? 0}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </section>
            ))}
        </div>
    );
}

export default TeamResults;
