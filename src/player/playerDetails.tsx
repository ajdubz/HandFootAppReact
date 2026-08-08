import { useEffect, useMemo, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import StartGame from "../modals/startGame";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import PlayerService from "../services/PlayerService";
import GameService from "../services/GameService";
import { loadGameHistoryResults, GameHistoryResult } from "../game/gameHistoryUtils";
import { isGameComplete } from "../game/gameHomeUtils";
import { isGuestSession } from "../utils/auth";
import { clearActiveGameRoute, getActiveGameRoute, getGameIdFromActiveGameRoute } from "../utils/activeGame";
import { buildPlayerHomeSummary, RecentGameSummary } from "./playerHomeUtils";
import "./playerDetails.css";

interface RouteParams {
    [id: string]: string | undefined;
}

const formatGameDate = (date?: Date): string => date
    ? date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "Date unknown";

const getRecentGameDescription = (recentGame: RecentGameSummary): string => {
    switch (recentGame.outcome) {
        case "won":
            return `${recentGame.teamName} won by ${(recentGame.margin ?? 0).toLocaleString()}.`;
        case "lost":
            return `${recentGame.teamName} lost by ${(recentGame.margin ?? 0).toLocaleString()}.`;
        case "tied":
            return `${recentGame.teamName} tied for the lead.`;
        case "inProgress":
            return `The game with ${recentGame.teamName} is still in progress.`;
        default:
            return "Open the scorecard for the full game result.";
    }
};

function PlayerDetails() {
    const { id = "" } = useParams<RouteParams>();
    const location = useLocation();
    const navigate = useNavigate();
    const rulesMessage = (location.state as { rulesMessage?: string } | null)?.rulesMessage ?? "";
    const currentPlayerId = Number(localStorage.getItem("currentPlayerId") ?? localStorage.getItem("mockPlayerId") ?? 0);
    const playerId = currentPlayerId || Number(id);
    const guestSession = isGuestSession();
    const canEditGuestNickname = guestSession && Number(id) === currentPlayerId;
    const [activeGameRoute, setActiveGameRoute] = useState("");
    const [dashboardError, setDashboardError] = useState("");
    const [gameResults, setGameResults] = useState<GameHistoryResult[]>([]);
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);
    const [nickname, setNickname] = useState("");
    const [showModalStart, setShowModalStart] = useState(false);
    const isNicknameDirtyRef = useRef(false);
    const dashboardSummary = useMemo(
        () => buildPlayerHomeSummary(gameResults, playerId),
        [gameResults, playerId],
    );

    useEffect(() => {
        if (currentPlayerId && Number(id) !== currentPlayerId) {
            navigate(`/player/${currentPlayerId}`);
        }
    }, [currentPlayerId, id, navigate]);

    useEffect(() => {
        if (!canEditGuestNickname) {
            return;
        }

        let isCancelled = false;
        PlayerService.getPlayerAccountById(Number(id))
            .then((account) => {
                if (!isCancelled && !isNicknameDirtyRef.current) {
                    setNickname(account?.nickName?.trim() || "Guest Player");
                }
            })
            .catch((error) => {
                console.error("Error loading guest nickname:", error);
                if (!isCancelled) {
                    setNickname("Guest Player");
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [canEditGuestNickname, id]);

    useEffect(() => {
        let isCancelled = false;
        setDashboardError("");
        setIsDashboardLoading(true);

        loadGameHistoryResults(playerId ? { playerId } : {})
            .then((results) => {
                if (!isCancelled) {
                    setGameResults(results);
                }
            })
            .catch((error) => {
                console.error("Error loading player dashboard:", error);
                if (!isCancelled) {
                    setDashboardError("Your game summary is unavailable right now.");
                    setGameResults([]);
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsDashboardLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [playerId]);

    useEffect(() => {
        const storedRoute = getActiveGameRoute(currentPlayerId);
        const activeGameId = getGameIdFromActiveGameRoute(storedRoute);
        let isCancelled = false;

        if (!activeGameId) {
            setActiveGameRoute("");
            return;
        }

        GameService.getRoundsByGameId(activeGameId)
            .then((rounds) => {
                if (isCancelled) {
                    return;
                }

                if (isGameComplete(rounds ?? [])) {
                    clearActiveGameRoute();
                    setActiveGameRoute("");
                    return;
                }

                setActiveGameRoute(storedRoute);
            })
            .catch((error) => {
                console.error("Error validating active game:", error);
                if (!isCancelled) {
                    setActiveGameRoute(storedRoute);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [currentPlayerId]);

    useEffect(() => {
        if (new URLSearchParams(location.search).get("startGame") === "true") {
            setShowModalStart(true);
        }
    }, [location.search]);

    const saveGuestNickname = async () => {
        if (!canEditGuestNickname) {
            return;
        }

        const nextNickname = nickname.trim() || "Guest Player";
        setNickname(nextNickname);

        const existingAccount = await PlayerService.getPlayerAccountById(Number(id));
        const playerData = Object.assign(new PlayerAccountDTO(), existingAccount, {
            nickName: nextNickname,
            fullName: nextNickname,
        });

        await PlayerService.updatePlayerAccount(Number(id), playerData);
    };

    const handleStartGame = async () => {
        try {
            await saveGuestNickname();
        } catch (error) {
            console.error("Error saving guest nickname:", error);
        }

        setShowModalStart(true);
    };

    const handleConfirm = (newGameId: number) => {
        setShowModalStart(false);
        navigate(`/player/${id}/game/${newGameId}`);
    };

    const recentGame = dashboardSummary.recentGame;
    const recentGameRoute = recentGame?.isComplete
        ? `/games/${recentGame.gameId}`
        : `/player/${id}/game/${recentGame?.gameId}`;

    return (
        <main className="player-home">
            <header className="player-home-hero">
                <p className="player-home-eyebrow">Hand &amp; Foot scorekeeper</p>
                <h1>Ready to play?</h1>
                <p>Start a new scorecard or pick up your game where you left off.</p>
            </header>

            {rulesMessage && <div className="rules-save-message">{rulesMessage}</div>}

            {canEditGuestNickname && (
                <section className="player-home-guest" aria-labelledby="guest-nickname-heading">
                    <h2 id="guest-nickname-heading">Playing as a guest</h2>
                    <label htmlFor="guest-nickname">Nickname</label>
                    <input
                        id="guest-nickname"
                        type="text"
                        name="nickname"
                        value={nickname}
                        onBlur={() => { saveGuestNickname().catch((error) => console.error("Error saving guest nickname:", error)); }}
                        onChange={(event) => {
                            isNicknameDirtyRef.current = true;
                            setNickname(event.target.value);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.currentTarget.blur();
                            }
                        }}
                    />
                </section>
            )}

            <section className="player-home-actions" aria-label="Game actions">
                {activeGameRoute && (
                    <Button size="lg" variant="success" onClick={() => navigate(activeGameRoute)}>
                        Back to Active Game
                    </Button>
                )}
                <Button size="lg" variant="primary" onClick={handleStartGame}>
                    Start Game
                </Button>
            </section>

            <section className="player-home-summary" aria-labelledby="home-stats-heading">
                <div className="player-home-section-heading">
                    <div>
                        <h2 id="home-stats-heading">Your stats</h2>
                        <p>Completed games with you on the scorecard.</p>
                    </div>
                </div>

                {isDashboardLoading && <p className="player-home-message" role="status">Loading your game summary...</p>}
                {!isDashboardLoading && dashboardError && (
                    <p className="player-home-message is-error" role="alert">{dashboardError} You can still start a game.</p>
                )}
                {!isDashboardLoading && !dashboardError && (
                    <dl className="player-home-stat-grid">
                        <div>
                            <dt>Games played</dt>
                            <dd>{dashboardSummary.completedGames}</dd>
                        </div>
                        <div>
                            <dt>Wins</dt>
                            <dd>{dashboardSummary.wins}</dd>
                        </div>
                        <div>
                            <dt>Win rate</dt>
                            <dd>{dashboardSummary.winRate}%</dd>
                        </div>
                    </dl>
                )}
            </section>

            {!isDashboardLoading && !dashboardError && (
                <section className="player-home-recent" aria-labelledby="recent-game-heading">
                    <div className="player-home-section-heading">
                        <div>
                            <h2 id="recent-game-heading">Most recent game</h2>
                            <p>Your latest scorecard at a glance.</p>
                        </div>
                    </div>

                    {recentGame ? (
                        <article className="player-home-recent-card">
                            <p className="player-home-recent-date">{formatGameDate(recentGame.gameDate)}</p>
                            <h3>{recentGame.teamName}</h3>
                            <p>{getRecentGameDescription(recentGame)}</p>
                            <div className="player-home-recent-actions">
                                <Link className="btn btn-primary" to={recentGameRoute}>
                                    {recentGame.isComplete ? "View game" : "Continue game"}
                                </Link>
                                <Link className="btn btn-outline-secondary" to="/games">View all games</Link>
                            </div>
                        </article>
                    ) : (
                        <div className="player-home-empty">
                            <p>No games yet. Start your first scorecard when everyone is ready.</p>
                        </div>
                    )}
                </section>
            )}

            <StartGame
                id={Number(id)}
                isOpen={showModalStart}
                onCancel={() => setShowModalStart(false)}
                onConfirm={handleConfirm}
            />
        </main>
    );
}

export default PlayerDetails;
