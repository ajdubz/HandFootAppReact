import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table } from "react-bootstrap";
import { GameHistoryResult, loadGameHistoryResults } from "./gameHistoryUtils";
import "./gameHome.css";

const formatGameDate = (date?: Date): string => {
    return date ? date.toLocaleDateString() : "Date unknown";
};

const getTeamNames = (result: GameHistoryResult): string => {
    return result.rankedTeams.map((gameTeam) => gameTeam.team?.name).filter(Boolean).join(" vs ") || "No teams";
};

const getTopTeamLabel = (result: GameHistoryResult): string => {
    const topTeam = result.rankedTeams[0];
    if (!topTeam) {
        return "No score yet";
    }

    return topTeam.team?.name ?? "Unknown team";
};

const getScoreLabel = (result: GameHistoryResult): string => {
    const scores = result.rankedTeams
        .map((gameTeam) => result.teamStats[gameTeam.id ?? 0]?.totalScore ?? 0);

    return scores.length ? scores.join(" / ") : "0";
};

const getMarginLabel = (result: GameHistoryResult): string => {
    const scores = result.rankedTeams
        .map((gameTeam) => result.teamStats[gameTeam.id ?? 0]?.totalScore ?? 0);

    if (scores.length < 2) {
        return "-";
    }

    const margin = scores[0] - scores[1];
    return margin > 0 ? `+${margin}` : "Even";
};

const getActionLabel = (result: GameHistoryResult): string => {
    return result.isComplete ? "View" : "Continue";
};

const getActionRoute = (result: GameHistoryResult, currentPlayerId: number): string => {
    if (!result.isComplete && currentPlayerId) {
        return `/player/${currentPlayerId}/game/${result.gameId}`;
    }

    return `/games/${result.gameId}`;
};

function GameHistory(): React.ReactElement {
    const [results, setResults] = useState<GameHistoryResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const currentPlayerId = Number(localStorage.getItem("currentPlayerId") ?? localStorage.getItem("mockPlayerId") ?? 0);

    const fetchResults = useCallback(async () => {
        setError("");
        setIsLoading(true);

        try {
            const gameResults = await loadGameHistoryResults(currentPlayerId ? { playerId: currentPlayerId } : {});
            setResults(gameResults);
        } catch (loadError) {
            console.error("Error loading game history:", loadError);
            setError("Unable to load game history.");
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentPlayerId]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    return (
        <div className="game-page">
            <div className="game-header">
                <div>
                    <h1>Games</h1>
                    <p className="round-context">Previous Hand and Foot scorecards.</p>
                </div>
            </div>

            {error && <div className="round-error">{error}</div>}

            <section className="game-section">
                {isLoading && <p>Loading games...</p>}

                {!isLoading && !results.length && !error && (
                    <p>No previous games found yet.</p>
                )}

                {!!results.length && (
                    <>
                        <div className="desktop-table-wrap">
                            <Table bordered responsive id="gameTable">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Teams</th>
                                        <th>Winner / Leader</th>
                                        <th>Score</th>
                                        <th>Margin</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((result) => (
                                        <tr key={result.gameId}>
                                            <td>{formatGameDate(result.gameDate)}</td>
                                            <td>{getTeamNames(result)}</td>
                                            <td>
                                                <span className={result.isComplete ? "leader-badge winner" : "leader-badge"}>
                                                    {result.isComplete ? "Winner" : "Leader"}
                                                </span>
                                                <strong className="leader-name">{getTopTeamLabel(result)}</strong>
                                            </td>
                                            <td className="score-total">{getScoreLabel(result)}</td>
                                            <td>{getMarginLabel(result)}</td>
                                            <td>
                                                <Link className="game-history-action btn btn-primary btn-sm" to={getActionRoute(result, currentPlayerId)}>
                                                    {getActionLabel(result)}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>

                        <div className="mobile-card-list" aria-label="Mobile games history">
                            {results.map((result) => (
                                <article className="game-history-card" key={result.gameId}>
                                    <div className="game-history-card-header">
                                        <div>
                                            <span>{formatGameDate(result.gameDate)}</span>
                                            <h2>Game #{result.gameId}</h2>
                                        </div>
                                        <strong className={result.isComplete ? "leader-badge winner" : "leader-badge"}>
                                            {result.isComplete ? "Winner" : "Leader"}
                                        </strong>
                                    </div>
                                    <p>{getTeamNames(result)}</p>
                                    <strong className="mobile-leader-name">{getTopTeamLabel(result)}</strong>
                                    <div className="game-history-grid">
                                        <span>Score: {getScoreLabel(result)}</span>
                                        <span>Margin: {getMarginLabel(result)}</span>
                                    </div>
                                    <Link className="game-history-action btn btn-primary" to={getActionRoute(result, currentPlayerId)}>
                                        {getActionLabel(result)}
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

export default GameHistory;
