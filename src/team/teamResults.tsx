import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Table } from "react-bootstrap";
import { GameHistoryResult, loadGameHistoryResults } from "../game/gameHistoryUtils";
import "../game/gameHome.css";

interface RouteParams {
    [id: string]: string | undefined;
}

function TeamResults(): React.ReactElement {
    const { id = "" } = useParams<RouteParams>();
    const teamId = Number(id);
    const [results, setResults] = useState<GameHistoryResult[]>([]);
    const [error, setError] = useState("");
    const currentPlayerId = Number(localStorage.getItem("currentPlayerId") ?? localStorage.getItem("mockPlayerId") ?? 0);

    const fetchResults = useCallback(async () => {
        setError("");

        try {
            setResults(await loadGameHistoryResults({ teamId, requireRounds: true }));
        } catch (loadError) {
            console.error("Error loading team results:", loadError);
            setError("Unable to load team game results.");
            setResults([]);
        }
    }, [teamId]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

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

            {!results.length && !error && (
                <section className="game-section">
                    <p>No completed game results found for this team yet.</p>
                </section>
            )}

            {results.map((result) => (
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
