import { GameHistoryResult } from "../game/gameHistoryUtils";
import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import { buildPlayerHomeSummary } from "./playerHomeUtils";

const buildResult = (
    gameId: number,
    playerScore: number,
    opponentScore: number,
    options: { complete?: boolean; date?: string } = {},
): GameHistoryResult => {
    const playerTeam = Object.assign(new GameTeamDTO(), {
        id: gameId * 10 + 1,
        team: {
            id: gameId * 10 + 1,
            name: "Alex and Sam",
            teamMembers: [{ id: 1, nickName: "Alex" }, { id: 2, nickName: "Sam" }],
        },
    });
    const opponentTeam = Object.assign(new GameTeamDTO(), {
        id: gameId * 10 + 2,
        team: {
            id: gameId * 10 + 2,
            name: "Jordan and Casey",
            teamMembers: [{ id: 3, nickName: "Jordan" }, { id: 4, nickName: "Casey" }],
        },
    });
    const rankedTeams = playerScore >= opponentScore
        ? [playerTeam, opponentTeam]
        : [opponentTeam, playerTeam];

    return {
        gameId,
        gameDate: options.date ? new Date(options.date) : undefined,
        isComplete: options.complete ?? true,
        rankedTeams,
        roundCount: options.complete === false ? 2 : 4,
        rounds: [],
        teamStats: {
            [playerTeam.id ?? 0]: { totalScore: playerScore, cleanBooks: 0, dirtyBooks: 0, redThrees: 0 },
            [opponentTeam.id ?? 0]: { totalScore: opponentScore, cleanBooks: 0, dirtyBooks: 0, redThrees: 0 },
        },
    };
};

test("summarizes completed games, wins, and rounded win rate", () => {
    const summary = buildPlayerHomeSummary([
        buildResult(1, 1600, 1200),
        buildResult(2, 900, 1400),
        buildResult(3, 1300, 1300),
    ], 1);

    expect(summary).toMatchObject({ completedGames: 3, wins: 1, winRate: 33 });
});

test.each([
    { playerScore: 1600, opponentScore: 1200, outcome: "won", margin: 400 },
    { playerScore: 900, opponentScore: 1400, outcome: "lost", margin: 500 },
    { playerScore: 1300, opponentScore: 1300, outcome: "tied", margin: 0 },
])("describes a completed recent game as $outcome", ({ playerScore, opponentScore, outcome, margin }) => {
    const summary = buildPlayerHomeSummary([
        buildResult(1, playerScore, opponentScore, { date: "2026-08-01" }),
    ], 1);

    expect(summary.recentGame).toMatchObject({ outcome, margin, teamName: "Alex and Sam" });
});

test("shows the newest unfinished game without counting it in stats", () => {
    const summary = buildPlayerHomeSummary([
        buildResult(1, 1600, 1200, { date: "2026-07-01" }),
        buildResult(2, 500, 450, { complete: false, date: "2026-08-01" }),
    ], 1);

    expect(summary).toMatchObject({ completedGames: 1, wins: 1, winRate: 100 });
    expect(summary.recentGame).toMatchObject({ gameId: 2, isComplete: false, outcome: "inProgress" });
});

test("returns an empty summary when the player has no games", () => {
    expect(buildPlayerHomeSummary([], 1)).toEqual({
        completedGames: 0,
        recentGame: undefined,
        winRate: 0,
        wins: 0,
    });
});
