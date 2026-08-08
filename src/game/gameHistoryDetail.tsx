import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Table } from "react-bootstrap";
import { numberOrZero, rankRoundsByScore } from "./gameHomeUtils";
import { GameHistoryResult, loadGameHistoryResultById } from "./gameHistoryUtils";
import "./gameHome.css";

interface RouteParams {
    [id: string]: string | undefined;
}

const formatGameDate = (date?: Date): string => {
    return date ? date.toLocaleDateString() : "Date unknown";
};

function GameHistoryDetail(): React.ReactElement {
    const { gameId = "" } = useParams<RouteParams>();
    const [result, setResult] = useState<GameHistoryResult>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchResult = useCallback(async () => {
        setError("");
        setIsLoading(true);

        try {
            setResult(await loadGameHistoryResultById(Number(gameId)));
        } catch (loadError) {
            console.error("Error loading game rounds:", loadError);
            setError("Unable to load game rounds.");
            setResult(undefined);
        } finally {
            setIsLoading(false);
        }
    }, [gameId]);

    useEffect(() => {
        fetchResult();
    }, [fetchResult]);

    const rankedRounds = useMemo(() => rankRoundsByScore(result?.rounds ?? []), [result]);

    return (
        <div className="game-page">
            <div className="game-header">
                <div>
                    <h1>Game Rounds</h1>
                    <p className="round-context">
                        Game #{result?.gameId ?? gameId}
                        {result?.gameDate ? ` - ${formatGameDate(result.gameDate)}` : ""}
                    </p>
                </div>
                <Link className="btn btn-secondary" to="/games">Back</Link>
            </div>

            {error && <div className="round-error">{error}</div>}

            <section className="game-section">
                <h2>Previous Rounds</h2>
                {isLoading && <p>Loading rounds...</p>}

                {!isLoading && !result && !error && (
                    <p>No game found.</p>
                )}

                {!isLoading && result && (
                    <>
                        <div className="desktop-table-wrap">
                            <Table bordered responsive className="round-history-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Team</th>
                                        <th>Card Points</th>
                                        <th>Clean Books</th>
                                        <th>Dirty Books</th>
                                        <th>Red 3s</th>
                                        <th>Pulled Correct</th>
                                        <th>Went Out</th>
                                        <th>Round Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankedRounds.length ? rankedRounds.map(({ round, rank }, index) => {
                                        const roundNumber = numberOrZero(round.roundNumber);
                                        const previousRoundNumber = index > 0 ? numberOrZero(rankedRounds[index - 1].round.roundNumber) : undefined;
                                        const startsNewRound = index === 0 || roundNumber !== previousRoundNumber;
                                        const rowKey = round.id ?? `${round.gameTeam?.id}-${round.roundNumber}`;

                                        return (
                                            <Fragment key={rowKey}>
                                                {startsNewRound && (
                                                    <tr className="round-history-group-row">
                                                        <th colSpan={9}>Round {roundNumber}</th>
                                                    </tr>
                                                )}
                                                <tr className={round.isWinner ? "round-history-row is-winner" : "round-history-row"}>
                                                    <td>{rank}</td>
                                                    <td>{round.gameTeam?.team?.name}</td>
                                                    <td>{round.cardPoints ?? 0}</td>
                                                    <td>{round.cleanBooks ?? 0}</td>
                                                    <td>{round.dirtyBooks ?? 0}</td>
                                                    <td>{round.redThrees ?? 0}</td>
                                                    <td>{round.pulledCorrect ?? 0}</td>
                                                    <td>{round.isWinner ? "Yes" : "No"}</td>
                                                    <td>{round.handScore ?? 0}</td>
                                                </tr>
                                            </Fragment>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={9} className="empty-rounds">
                                                No rounds saved yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>

                        <div className="mobile-card-list" aria-label="Mobile previous rounds">
                            {rankedRounds.length ? rankedRounds.map(({ round, rank }) => (
                                <article className="round-history-card" key={round.id ?? `${round.gameTeam?.id}-${round.roundNumber}`}>
                                    <div className="round-history-card-header">
                                        <span>Round {round.roundNumber} · Rank #{rank}</span>
                                        <strong>{round.gameTeam?.team?.name}</strong>
                                    </div>
                                    <div className="round-history-total">
                                        <span>Round Total</span>
                                        <strong>{round.handScore ?? 0}</strong>
                                    </div>
                                    <div className="round-history-grid">
                                        <span>Cards: {round.cardPoints ?? 0}</span>
                                        <span>Clean: {round.cleanBooks ?? 0}</span>
                                        <span>Dirty: {round.dirtyBooks ?? 0}</span>
                                        <span>Red 3s: {round.redThrees ?? 0}</span>
                                        <span>Pulled: {round.pulledCorrect ?? 0}</span>
                                        <span>Went Out: {round.isWinner ? "Yes" : "No"}</span>
                                    </div>
                                </article>
                            )) : (
                                <div className="empty-rounds mobile-empty-rounds">
                                    No rounds saved yet.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

export default GameHistoryDetail;
