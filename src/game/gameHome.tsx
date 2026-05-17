import { Button, Form, Table } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import "../App.css";
import "./gameHome.css";
import GameWithRulesDTO from "../models/DTOs/Game/GameWithRulesDTO";
import GameService from "../services/GameService";
import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";
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
    cardPoints: "0",
    cleanBooks: "0",
    dirtyBooks: "0",
    redThrees: "0",
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

    const navigate = useNavigate();
    const scoringRules = useMemo(() => getEffectiveRules(game?.rules), [game]);
    const teamStats = useMemo(() => calculateTeamStats(teams, rounds), [teams, rounds]);
    const nextRoundNumber = useMemo(() => getNextRoundNumber(rounds), [rounds]);
    const gameComplete = useMemo(() => isGameComplete(rounds), [rounds]);
    const displayRoundNumber = Math.min(nextRoundNumber, MAX_DISPLAY_ROUND);
    const bookThreshold = getBookThreshold(displayRoundNumber);
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
        fetchData();
    }, [fetchData]);

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

    const handleBack = () => {
        navigate(`/player/${id}`);
    };

    const updateRoundEntry = (gameTeamId: number, field: keyof RoundEntry, value: string | boolean) => {
        setRoundEntries((currentEntries) => ({
            ...currentEntries,
            [gameTeamId]: {
                ...(currentEntries[gameTeamId] ?? emptyRoundEntry()),
                [field]: value,
            },
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
        round.isWinner = entry.isWinner;
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

    const renderScoreInput = (team: GameTeamDTO, field: "cardPoints" | "cleanBooks" | "dirtyBooks" | "redThrees", label: string) => {
        const gameTeamId = team.id ?? 0;
        const entry = roundEntries[gameTeamId] ?? emptyRoundEntry();
        const handleChange = (value: string) => {
            const nextValue = field === "redThrees"
                ? String(Math.max(0, numberOrZero(value)))
                : value;
            updateRoundEntry(gameTeamId, field, nextValue);
        };

        return (
            <Form.Control
                aria-label={`${team.team?.name} ${label}`}
                className="score-input"
                min={field === "redThrees" ? 0 : undefined}
                step="1"
                type="number"
                value={entry[field]}
                onChange={(event) => handleChange(event.target.value)}
            />
        );
    };

    const renderPulledCorrectChecks = (team: GameTeamDTO) => {
        const gameTeamId = team.id ?? 0;
        const entry = roundEntries[gameTeamId] ?? emptyRoundEntry();
        const teamMemberCount = Math.max(1, Math.min(team.team?.teamMembers?.length ?? 1, 2));

        return Array.from({ length: teamMemberCount }, (_, index) => (
            <Form.Check
                aria-label={`${team.team?.name} Pulled Correct ${index + 1}`}
                checked={entry.pulledCorrect[index] ?? false}
                className="pulled-correct-check"
                key={`${gameTeamId}-pulled-${index}`}
                onChange={(event) => updatePulledCorrect(gameTeamId, index, event.target.checked)}
            />
        ));
    };

    return (
        <div className="game-page">
            <div className="game-header">
                <div>
                    <h1>Game Center</h1>
                    <p className="round-context">
                        {gameComplete
                            ? `Game complete. Winner: ${rankedTeams[0]?.team?.name ?? "No winner yet"}`
                            : `Round ${nextRoundNumber} entry - Book threshold: ${bookThreshold}`}
                    </p>
                </div>
                <Button variant="secondary" onClick={handleBack}>
                    Back
                </Button>
            </div>

            {roundError && <div className="round-error">{roundError}</div>}

            <section className="game-section">
                <h2>Scoreboard</h2>
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
            </section>

            <section className="game-section">
                <div className="section-heading-row">
                    <h2>{gameComplete ? "Game Complete" : `Score Round ${nextRoundNumber}`}</h2>
                    <Button variant="primary" onClick={handleSaveRound} disabled={!teams.length || isSavingRound || gameComplete}>
                        {isSavingRound ? "Saving..." : "Save Round"}
                    </Button>
                </div>
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
                        {teams.map((team) => {
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
                                            checked={entry.isWinner}
                                            onChange={(event) => handleWinnerChange(gameTeamId, event.target.checked)}
                                        />
                                    </td>
                                    <td className="round-total">{getEntryScore(team)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </section>

            <section className="game-section">
                <h2>Previous Rounds</h2>
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
            </section>
        </div>
    );
}

export default GamePage;
