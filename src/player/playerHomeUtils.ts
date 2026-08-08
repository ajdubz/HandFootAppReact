import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import { GameHistoryResult } from "../game/gameHistoryUtils";

export type RecentGameOutcome = "won" | "lost" | "tied" | "inProgress" | "unavailable";

export type RecentGameSummary = {
    gameId: number;
    gameDate?: Date;
    isComplete: boolean;
    margin?: number;
    outcome: RecentGameOutcome;
    teamName: string;
};

export type PlayerHomeSummary = {
    completedGames: number;
    recentGame?: RecentGameSummary;
    winRate: number;
    wins: number;
};

const getPlayerTeam = (result: GameHistoryResult, playerId: number): GameTeamDTO | undefined => (
    result.rankedTeams.find((gameTeam) =>
        gameTeam.team?.teamMembers?.some((member) => member.id === playerId)
    )
);

const getTeamScore = (result: GameHistoryResult, gameTeam: GameTeamDTO): number => (
    result.teamStats[gameTeam.id ?? 0]?.totalScore ?? 0
);

const getRecentGameSummary = (result: GameHistoryResult, playerId: number): RecentGameSummary => {
    const playerTeam = getPlayerTeam(result, playerId);
    const teamName = playerTeam?.team?.name?.trim() || "Your team";

    if (!result.isComplete) {
        return {
            gameId: result.gameId,
            gameDate: result.gameDate,
            isComplete: false,
            outcome: "inProgress",
            teamName,
        };
    }

    if (!playerTeam) {
        return {
            gameId: result.gameId,
            gameDate: result.gameDate,
            isComplete: true,
            outcome: "unavailable",
            teamName,
        };
    }

    const playerScore = getTeamScore(result, playerTeam);
    const opponentScores = result.rankedTeams
        .filter((gameTeam) => gameTeam.id !== playerTeam.id)
        .map((gameTeam) => getTeamScore(result, gameTeam));

    if (!opponentScores.length) {
        return {
            gameId: result.gameId,
            gameDate: result.gameDate,
            isComplete: true,
            outcome: "unavailable",
            teamName,
        };
    }

    const bestOpponentScore = Math.max(...opponentScores);
    const margin = Math.abs(playerScore - bestOpponentScore);
    const outcome: RecentGameOutcome = playerScore > bestOpponentScore
        ? "won"
        : playerScore < bestOpponentScore
            ? "lost"
            : "tied";

    return {
        gameId: result.gameId,
        gameDate: result.gameDate,
        isComplete: true,
        margin,
        outcome,
        teamName,
    };
};

const getMostRecentResult = (results: GameHistoryResult[]): GameHistoryResult | undefined => (
    [...results].sort((a, b) =>
        (b.gameDate?.getTime() ?? 0) - (a.gameDate?.getTime() ?? 0) ||
        b.gameId - a.gameId
    )[0]
);

export const buildPlayerHomeSummary = (
    results: GameHistoryResult[],
    playerId: number,
): PlayerHomeSummary => {
    const completedResults = results.filter((result) => result.isComplete);
    const wins = completedResults.filter((result) =>
        getRecentGameSummary(result, playerId).outcome === "won"
    ).length;
    const recentResult = getMostRecentResult(results);

    return {
        completedGames: completedResults.length,
        recentGame: recentResult ? getRecentGameSummary(recentResult, playerId) : undefined,
        winRate: completedResults.length ? Math.round((wins / completedResults.length) * 100) : 0,
        wins,
    };
};
