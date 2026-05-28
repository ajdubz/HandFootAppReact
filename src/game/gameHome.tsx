import { Button, Form, Table } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import "../App.css";
import "./gameHome.css";
import GameWithRulesDTO from "../models/DTOs/Game/GameWithRulesDTO";
import GameService from "../services/GameService";
import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";
import PlayerService from "../services/PlayerService";
import StartGame from "../modals/startGame";
import {
    calculateRoundScore,
    calculateTeamStats,
    getBookThreshold,
    getEffectiveRules,
    getNextRoundNumber,
    isGameComplete,
    numberOrZero,
} from "./gameHomeUtils";
import { useCallback, useEffect, useMemo, useState } from "react";
import NumericStepper from "../components/NumericStepper";
import { clearActiveGameRoute, saveActiveGameRoute } from "../utils/activeGame";

interface RouteParams {
    [id: string]: string | undefined;
}

type RoundEntry = {
    cardPoints: string;
    cleanBooks: string;
    dirtyBooks: string;
    redThrees: string;
    pulledCorrect: boolean[];
    isWinner: boolean;
};

const MAX_DISPLAY_ROUND = 4;

const emptyRoundEntry = (): RoundEntry => ({
    cardPoints: "",
    cleanBooks: "",
    dirtyBooks: "",
    redThrees: "",
    pulledCorrect: [],
    isWinner: false,
});

function GamePage() {
    const { id = "" } = useParams<RouteParams>();
    const { gameId = "" } = useParams<RouteParams>();
    const [game, setGame] = useState<GameWithRulesDTO>();
    const [teams, setTeams] = useState<GameTeamDTO[]>([]);
    const [rounds, setRounds] = useState<GameRoundDTO[]>([]);
    const [roundEntries, setRoundEntries] = useState<Record<number, RoundEntry>>({});
    const [isSavingRound, setIsSavingRound] = useState(false);
    const [roundError, setRoundError] = useState("");
    const [showStartGameModal, setShowStartGameModal] = useState(false);

    const navigate = useNavigate();
    const scoringRules = useMemo(() => getEffectiveRules(game?.rules), [game]);
    const teamStats = useMemo(() => calculateTeamStats(teams, rounds), [teams, rounds]);
    const nextRoundNumber = useMemo(() => getNextRoundNumber(rounds), [rounds]);
    const gameComplete = useMemo(() => isGameComplete(rounds), [rounds]);
    const displayRoundNumber = Math.min(nextRoundNumber, MAX_DISPLAY_ROUND);
    const bookThreshold = getBookThreshold(displayRoundNumber, scoringRules);
    const rankedTeams = useMemo(() => [...teams].sort((a, b) => {
        const aScore = teamStats[a.id ?? 0]?.totalScore ?? 0;
        const bScore = teamStats[b.id ?? 0]?.totalScore ?? 0;

        return bScore - aScore;
    }), [teams, teamStats]);
    const sortedRounds = useMemo(() => [...rounds].sort((a, b) => {
        const roundDiff = numberOrZero(a.roundNumber) - numberOrZero(b.roundNumber);
        if (roundDiff !== 0) {
            return roundDiff;
        }

        return (a.gameTeam?.team?.name ?? "").localeCompare(b.gameTeam?.team?.name ?? "");
    }), [rounds]);
    const getRoundEntryBookTotals = (team: GameTeamDTO) => {
        const gameTeamId = team.id ?? 0;
        const entry = roundEntries[gameTeamId] ?? emptyRoundEntry();

        return {
            cleanBooks: numberOrZero(entry.cleanBooks),
            dirtyBooks: numberOrZero(entry.dirtyBooks),
        };
    };
    const canTeamGoOut = (team: GameTeamDTO) => {
        const totals = getRoundEntryBookTotals(team);

        return totals.cleanBooks >= scoringRules.cleanBooksRequiredToGoOut &&
            totals.dirtyBooks >= scoringRules.dirtyBooksRequiredToGoOut;
    };
    const hasWentOutSelection = teams.some((team) => {
        const gameTeamId = team.id ?? 0;
        return (roundEntries[gameTeamId]?.isWinner ?? false) && canTeamGoOut(team);
    });

    const fetchData = useCallback(async () => {
        setRoundError("");

        try {
            const [gameData, teamData, roundData] = await Promise.all([
                GameService.getGameById(Number(gameId)),
                GameService.getTeamsByGameId(Number(gameId)),
                GameService.getRoundsByGameId(Number(gameId)),
            ]);

            setGame(gameData ?? new GameWithRulesDTO());
            setTeams(teamData ?? []);
            setRounds(roundData ?? []);
        } catch (error) {
            console.error("Error loading game data:", error);
            setGame(new GameWithRulesDTO());
            setTeams([]);
            setRounds([]);
            setRoundError("Unable to load game data.");
        }
    }, [gameId]);

    useEffect(() => {
        saveActiveGameRoute(id, gameId);
        fetchData();
    }, [fetchData, gameId, id]);

    useEffect(() => {
        setRoundEntries((currentEntries) => {
            const nextEntries: Record<number, RoundEntry> = {};

            teams.forEach((team) => {
                const gameTeamId = team.id ?? 0;
                if (gameTeamId) {
                    nextEntries[gameTeamId] = currentEntries[gameTeamId] ?? emptyRoundEntry();
                }
            });

            return nextEntries;
        });
    }, [teams]);

    const resetRoundEntries = () => {
        const nextEntries: Record<number, RoundEntry> = {};
        teams.forEach((team) => {
            const gameTeamId = team.id ?? 0;
            if (gameTeamId) {
                nextEntries[gameTeamId] = emptyRoundEntry();
            }
        });
        setRoundEntries(nextEntries);
    };

    const isGuestAccount = (nickname?: string, fullName?: string, email?: string) => {
        const normalizedNickname = (nickname ?? "").trim().toLowerCase();
        const normalizedFullName = (fullName ?? "").trim().toLowerCase();
        const normalizedEmail = (email ?? "").trim().toLowerCase();

        return normalizedNickname.endsWith("(guest)") ||
            normalizedFullName.endsWith("(guest)") ||
            normalizedEmail.endsWith("@mock.local");
    };

    const removeGuestAccountsForSession = async () => {
        const activePlayerId = Number(localStorage.getItem("currentPlayerId") ?? id);
        const teamMemberIds = new Set<number>();
        teams.forEach((team) => {
            (team.team?.teamMembers ?? []).forEach((member) => {
                if (member.id) {
                    teamMemberIds.add(member.id);
                }
            });
        });

        const memberAccounts = await Promise.all(
            Array.from(teamMemberIds).map((playerId) => PlayerService.getPlayerAccountById(playerId))
        );

        const guestPlayerIds = memberAccounts
            .filter((account) =>
                account?.id &&
                account.id !== activePlayerId &&
                isGuestAccount(account.nickName, account.fullName, account.email)
            )
            .map((account) => account?.id as number);

        await Promise.all(guestPlayerIds.map((guestPlayerId) => PlayerService.deletePlayer(guestPlayerId)));
    };

    const handleBack = () => {
        navigate(`/player/${id}`);
    };

    const handleNewGameConfirm = (newGameId: number) => {
        setShowStartGameModal(false);
        navigate(`/player/${id}/game/${newGameId}`);
    };

    const handleEndGame = async () => {
        if (!gameComplete) {
            setRoundError("You can end the game after round 4 is complete.");
            return;
        }

        try {
            await removeGuestAccountsForSession();
        } catch (error) {
            console.error("Error removing guest accounts:", error);
        }

        clearActiveGameRoute();
        navigate(`/player/${id}`);
    };

    const updateRoundEntry = (gameTeamId: number, field: keyof RoundEntry, value: string | boolean) => {
        setRoundEntries((currentEntries) => ({
            ...currentEntries,
            [gameTeamId]: (() => {
                const nextEntry = {
                    ...(currentEntries[gameTeamId] ?? emptyRoundEntry()),
                    [field]: value,
                };

                if (field === "cleanBooks" || field === "dirtyBooks") {
                    const cleanBooks = numberOrZero(nextEntry.cleanBooks);
                    const dirtyBooks = numberOrZero(nextEntry.dirtyBooks);
                    if (
                        cleanBooks < scoringRules.cleanBooksRequiredToGoOut ||
                        dirtyBooks < scoringRules.dirtyBooksRequiredToGoOut
                    ) {
                        nextEntry.isWinner = false;
                    }
                }

                return nextEntry;
            })(),
        }));
    };

    const updatePulledCorrect = (gameTeamId: number, checkedIndex: number, isChecked: boolean) => {
        setRoundEntries((currentEntries) => {
            const currentEntry = currentEntries[gameTeamId] ?? emptyRoundEntry();
            const pulledCorrect = [...currentEntry.pulledCorrect];
            pulledCorrect[checkedIndex] = isChecked;

            return {
                ...currentEntries,
                [gameTeamId]: {
                    ...currentEntry,
                    pulledCorrect,
                },
            };
        });
    };

    const handleWinnerChange = (selectedGameTeamId: number, isWinner: boolean) => {
        const selectedTeam = teams.find((team) => (team.id ?? 0) === selectedGameTeamId);
        if (isWinner && selectedTeam && !canTeamGoOut(selectedTeam)) {
            return;
        }

        setRoundEntries((currentEntries) => {
            const nextEntries: Record<number, RoundEntry> = {};

            teams.forEach((team) => {
                const gameTeamId = team.id ?? 0;
                if (gameTeamId) {
                    nextEntries[gameTeamId] = {
                        ...(currentEntries[gameTeamId] ?? emptyRoundEntry()),
                        isWinner: isWinner && gameTeamId === selectedGameTeamId,
                    };
                }
            });

            return nextEntries;
        });
    };

    const buildRoundPayload = (team: GameTeamDTO) => {
        const gameTeamId = team.id ?? 0;
        const entry = roundEntries[gameTeamId] ?? emptyRoundEntry();
        const round = new GameRoundDTO();
        round.gameTeam = team;
        round.roundNumber = nextRoundNumber;
        round.cardPoints = numberOrZero(entry.cardPoints);
        round.cleanBooks = numberOrZero(entry.cleanBooks);
        round.dirtyBooks = numberOrZero(entry.dirtyBooks);
        round.redThrees = Math.max(0, numberOrZero(entry.redThrees));
        round.pulledCorrect = entry.pulledCorrect.filter(Boolean).length;
        round.isWinner = entry.isWinner && canTeamGoOut(team);
        round.handScore = calculateRoundScore(round, scoringRules);

        return round;
    };

    const getEntryScore = (team: GameTeamDTO) => {
        return calculateRoundScore(buildRoundPayload(team), scoringRules);
    };

    const handleSaveRound = async () => {
        setRoundError("");

        if (gameComplete) {
            setRoundError("This game already has four rounds. Start a new game for the next one.");
            return;
        }

        setIsSavingRound(true);

        try {
            const roundPayloads = teams.map(buildRoundPayload);
            if (!roundPayloads.some((round) => round.isWinner)) {
                return;
            }

            await Promise.all(roundPayloads.map((round) => GameService.saveGameRound(Number(gameId), round)));
            resetRoundEntries();
            await fetchData();
        } catch (error) {
            console.error("Error saving round:", error);
            setRoundError("Unable to save round scores.");
        } finally {
            setIsSavingRound(false);
        }
    };

    const renderScoreInput = (team: GameTeamDTO, field: "cardPoints" | "cleanBooks" | "dirtyBooks" | "redThrees", label: string, labelPrefix = "", showSteppers = false) => {
        const gameTeamId = team.id ?? 0;
        const entry = roundEntries[gameTeamId] ?? emptyRoundEntry();
        const handleChange = (value: string) => {
            updateRoundEntry(gameTeamId, field, value);
        };
        const ariaLabel = `${labelPrefix}${team.team?.name} ${label}`;

        return (
            <NumericStepper
                ariaLabel={ariaLabel}
                controlClassName="score-input"
                min={0}
                onChange={handleChange}
                placeholder="0"
                showSteppers={showSteppers}
                value={entry[field]}
            />
        );
    };

    const renderPulledCorrectChecks = (team: GameTeamDTO, labelPrefix = "") => {
        const gameTeamId = team.id ?? 0;
        const entry = roundEntries[gameTeamId] ?? emptyRoundEntry();
        const teamMemberCount = Math.max(1, Math.min(team.team?.teamMembers?.length ?? 1, 2));

        return Array.from({ length: teamMemberCount }, (_, index) => (
            <Form.Check
                aria-label={`${labelPrefix}${team.team?.name} Pulled Correct ${index + 1}`}
                checked={entry.pulledCorrect[index] ?? false}
                className="pulled-correct-check"
                key={`${gameTeamId}-pulled-${index}`}
                onChange={(event) => updatePulledCorrect(gameTeamId, index, event.target.checked)}
            />
        ));
    };

    const renderMobileScoreField = (team: GameTeamDTO, field: "cardPoints" | "cleanBooks" | "dirtyBooks" | "redThrees", label: string) => (
        <div className="mobile-score-field">
            <span>{label}</span>
            {renderScoreInput(team, field, label, "Mobile ", true)}
        </div>
    );

    return (
        <div className="game-page">
            <div className="game-header">
                <div>
                    <h1>Game Center</h1>
                    <p className="round-context">
                        {gameComplete
                            ? `Game complete. Winner: ${rankedTeams[0]?.team?.name ?? "No winner yet"}`
                            : `Round ${nextRoundNumber} entry - Book threshold: ${bookThreshold} - Go out: ${scoringRules.cleanBooksRequiredToGoOut} clean / ${scoringRules.dirtyBooksRequiredToGoOut} dirty`}
                    </p>
                </div>
                <div>
                    <Button variant="danger" className="me-2" onClick={handleEndGame} disabled={!gameComplete}>
                        End Game
                    </Button>
                    <Button variant="primary" className="me-2" onClick={() => setShowStartGameModal(true)}>
                        New Game
                    </Button>
                    <Button variant="secondary" onClick={handleBack}>
                        Back
                    </Button>
                </div>
            </div>

            <StartGame
                id={Number(id)}
                isOpen={showStartGameModal}
                onCancel={() => setShowStartGameModal(false)}
                onConfirm={handleNewGameConfirm}
            />

            {roundError && <div className="round-error">{roundError}</div>}

            <section className="game-section">
                <h2>Scoreboard</h2>
                <div className="desktop-table-wrap">
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
                            {rankedTeams.map((team, index) => {
                                const gameTeamId = team.id ?? 0;

                                return (
                                    <tr key={gameTeamId}>
                                        <td>{index + 1}</td>
                                        <td>{team.team?.name}</td>
                                        <td>{teamStats[gameTeamId]?.totalScore ?? 0}</td>
                                        <td>{teamStats[gameTeamId]?.cleanBooks ?? 0}</td>
                                        <td>{teamStats[gameTeamId]?.dirtyBooks ?? 0}</td>
                                        <td>{teamStats[gameTeamId]?.redThrees ?? 0}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
                <div className="mobile-card-list" aria-label="Mobile scoreboard">
                    {rankedTeams.map((team, index) => {
                        const gameTeamId = team.id ?? 0;

                        return (
                            <article className="scoreboard-card" key={gameTeamId}>
                                <div className="scoreboard-card-header">
                                    <span className="rank-badge">#{index + 1}</span>
                                    <h3>{team.team?.name}</h3>
                                </div>
                                <div className="mobile-total-row">
                                    <span>Total Score</span>
                                    <strong>{teamStats[gameTeamId]?.totalScore ?? 0}</strong>
                                </div>
                                <div className="scoreboard-stat-grid">
                                    <div>
                                        <span>Clean</span>
                                        <strong>{teamStats[gameTeamId]?.cleanBooks ?? 0}</strong>
                                    </div>
                                    <div>
                                        <span>Dirty</span>
                                        <strong>{teamStats[gameTeamId]?.dirtyBooks ?? 0}</strong>
                                    </div>
                                    <div>
                                        <span>Red 3s</span>
                                        <strong>{teamStats[gameTeamId]?.redThrees ?? 0}</strong>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            <section className="game-section score-round-section">
                <div className="section-heading-row">
                    <h2>{gameComplete ? "Game Complete" : `Score Round ${nextRoundNumber}`}</h2>
                    <Button className="round-save-button" variant="primary" onClick={handleSaveRound} disabled={!teams.length || isSavingRound || gameComplete || !hasWentOutSelection}>
                        {isSavingRound ? "Saving..." : "Save Round"}
                    </Button>
                </div>
                <div className="desktop-table-wrap">
                    <Table bordered responsive className="round-entry-table">
                        <thead>
                            <tr>
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
                            {teams.length ? teams.map((team) => {
                                const gameTeamId = team.id ?? 0;
                                const entry = roundEntries[gameTeamId] ?? emptyRoundEntry();

                                return (
                                    <tr key={gameTeamId}>
                                        <td>{team.team?.name}</td>
                                        <td>{renderScoreInput(team, "cardPoints", "Card Points")}</td>
                                        <td>{renderScoreInput(team, "cleanBooks", "Clean Books")}</td>
                                        <td>{renderScoreInput(team, "dirtyBooks", "Dirty Books")}</td>
                                        <td>{renderScoreInput(team, "redThrees", "Red 3s")}</td>
                                        <td className="pulled-correct-cell">{renderPulledCorrectChecks(team)}</td>
                                        <td className="went-out-cell">
                                            <Form.Check
                                                aria-label={`${team.team?.name} Went Out`}
                                                checked={entry.isWinner && canTeamGoOut(team)}
                                                disabled={!canTeamGoOut(team)}
                                                onChange={(event) => handleWinnerChange(gameTeamId, event.target.checked)}
                                            />
                                        </td>
                                        <td className="round-total">{getEntryScore(team)}</td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={8} className="empty-rounds">
                                        No teams in this game yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
                <div className="mobile-card-list mobile-round-entry-list" aria-label="Mobile round scoring">
                    {teams.length ? teams.map((team) => {
                        const gameTeamId = team.id ?? 0;
                        const entry = roundEntries[gameTeamId] ?? emptyRoundEntry();
                        const canGoOut = canTeamGoOut(team);

                        return (
                            <article className="round-entry-card" key={gameTeamId}>
                                <div className="round-entry-card-header">
                                    <h3>{team.team?.name}</h3>
                                    <div className="mobile-round-total">
                                        <span>Round Total</span>
                                        <strong>{getEntryScore(team)}</strong>
                                    </div>
                                </div>
                                <div className="mobile-score-grid">
                                    {renderMobileScoreField(team, "cardPoints", "Card Points")}
                                    {renderMobileScoreField(team, "cleanBooks", "Clean Books")}
                                    {renderMobileScoreField(team, "dirtyBooks", "Dirty Books")}
                                    {renderMobileScoreField(team, "redThrees", "Red 3s")}
                                </div>
                                <div className="mobile-check-row">
                                    <div>
                                        <span className="mobile-check-label">Pulled Correct</span>
                                        <div className="mobile-check-group">{renderPulledCorrectChecks(team, "Mobile ")}</div>
                                    </div>
                                    <Form.Check
                                        aria-label={`Mobile ${team.team?.name} Went Out`}
                                        checked={entry.isWinner && canGoOut}
                                        className="mobile-went-out"
                                        disabled={!canGoOut}
                                        label="Went Out"
                                        onChange={(event) => handleWinnerChange(gameTeamId, event.target.checked)}
                                    />
                                </div>
                            </article>
                        );
                    }) : (
                        <div className="empty-rounds mobile-empty-rounds">
                            No teams in this game yet.
                        </div>
                    )}
                </div>
            </section>

            <section className="game-section">
                <h2>Previous Rounds</h2>
                <div className="desktop-table-wrap">
                    <Table bordered responsive className="round-history-table">
                        <thead>
                            <tr>
                                <th>Round</th>
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
                            {sortedRounds.length ? sortedRounds.map((round) => (
                                <tr key={round.id ?? `${round.gameTeam?.id}-${round.roundNumber}`}>
                                    <td>{round.roundNumber}</td>
                                    <td>{round.gameTeam?.team?.name}</td>
                                    <td>{round.cardPoints ?? 0}</td>
                                    <td>{round.cleanBooks ?? 0}</td>
                                    <td>{round.dirtyBooks ?? 0}</td>
                                    <td>{round.redThrees ?? 0}</td>
                                    <td>{round.pulledCorrect ?? 0}</td>
                                    <td>{round.isWinner ? "Yes" : "No"}</td>
                                    <td>{round.handScore ?? 0}</td>
                                </tr>
                            )) : (
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
                    {sortedRounds.length ? sortedRounds.map((round) => (
                        <article className="round-history-card" key={round.id ?? `${round.gameTeam?.id}-${round.roundNumber}`}>
                            <div className="round-history-card-header">
                                <span>Round {round.roundNumber}</span>
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
            </section>
        </div>
    );
}

export default GamePage;
