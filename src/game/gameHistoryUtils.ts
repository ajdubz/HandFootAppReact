import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";
import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import GameWithRulesDTO from "../models/DTOs/Game/GameWithRulesDTO";
import GameService from "../services/GameService";
import { calculateTeamStats, isGameComplete, numberOrZero, TeamStats } from "./gameHomeUtils";

export type GameHistoryResult = {
    gameId: number;
    gameDate?: Date;
    rankedTeams: GameTeamDTO[];
    rounds: GameRoundDTO[];
    roundCount: number;
    isComplete: boolean;
    teamStats: Record<number, TeamStats>;
};

export type GameHistoryFilters = {
    playerId?: number;
    teamId?: number;
    requireRounds?: boolean;
};

const toGameDate = (value: unknown): Date | undefined => {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? undefined : value;
    }

    if (typeof value === "string" || typeof value === "number") {
        const parsedDate = new Date(value);
        return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
    }

    return undefined;
};

const getRoundCount = (rounds: GameRoundDTO[]): number => {
    return new Set(rounds.map((round) => numberOrZero(round.roundNumber)).filter(Boolean)).size;
};

export const buildGameHistoryResult = (
    game: GameWithRulesDTO,
    teams: GameTeamDTO[],
    rounds: GameRoundDTO[],
): GameHistoryResult | undefined => {
    const gameId = game.id ?? 0;
    if (!gameId) {
        return undefined;
    }

    const teamStats = calculateTeamStats(teams, rounds);
    const rankedTeams = [...teams].sort((a, b) => {
        const scoreDifference = (teamStats[b.id ?? 0]?.totalScore ?? 0) - (teamStats[a.id ?? 0]?.totalScore ?? 0);
        if (scoreDifference !== 0) {
            return scoreDifference;
        }

        return (a.team?.name ?? "").localeCompare(b.team?.name ?? "");
    });

    return {
        gameId,
        gameDate: toGameDate(game.date),
        rankedTeams,
        rounds,
        roundCount: getRoundCount(rounds),
        isComplete: isGameComplete(rounds),
        teamStats,
    };
};

export const gameMatchesHistoryFilters = (result: GameHistoryResult, filters: GameHistoryFilters = {}): boolean => {
    if (filters.requireRounds && !result.rounds.length) {
        return false;
    }

    if (filters.teamId && !result.rankedTeams.some((gameTeam) => gameTeam.team?.id === filters.teamId)) {
        return false;
    }

    if (filters.playerId && !result.rankedTeams.some((gameTeam) =>
        gameTeam.team?.teamMembers?.some((member) => member.id === filters.playerId)
    )) {
        return false;
    }

    return true;
};

export const sortGameHistoryResults = (results: GameHistoryResult[]): GameHistoryResult[] => {
    return [...results].sort((a, b) =>
        (b.gameDate?.getTime() ?? 0) - (a.gameDate?.getTime() ?? 0) ||
        b.gameId - a.gameId
    );
};

export const gameMatchesHistorySearch = (result: GameHistoryResult, query: string): boolean => {
    const searchTerms = query
        .trim()
        .toLocaleLowerCase()
        .split(/\s+/)
        .filter(Boolean);

    if (!searchTerms.length) {
        return true;
    }

    const dateValues = result.gameDate
        ? [
            result.gameDate.toLocaleDateString(),
            result.gameDate.toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
            }),
            result.gameDate.toISOString().slice(0, 10),
        ]
        : [];
    const teamAndPlayerNames = result.rankedTeams.flatMap((gameTeam) => [
        gameTeam.team?.name ?? "",
        ...(gameTeam.team?.teamMembers ?? []).map((member) => member.nickName ?? ""),
    ]);
    const searchableText = [...dateValues, ...teamAndPlayerNames]
        .join(" ")
        .toLocaleLowerCase();

    return searchTerms.every((term) => searchableText.includes(term));
};

export const loadGameHistoryResults = async (filters: GameHistoryFilters = {}): Promise<GameHistoryResult[]> => {
    const games = await GameService.getGames();
    const gameResults = await Promise.all((games ?? []).map(async (game) => {
        const gameId = game.id ?? 0;
        if (!gameId) {
            return undefined;
        }

        const [teams, rounds] = await Promise.all([
            GameService.getTeamsByGameId(gameId),
            GameService.getRoundsByGameId(gameId),
        ]);

        return buildGameHistoryResult(game, teams ?? [], rounds ?? []);
    }));

    return sortGameHistoryResults(
        (gameResults.filter(Boolean) as GameHistoryResult[])
            .filter((result) => gameMatchesHistoryFilters(result, filters))
    );
};

export const loadGameHistoryResultById = async (gameId: number): Promise<GameHistoryResult | undefined> => {
    if (!gameId) {
        return undefined;
    }

    const [game, teams, rounds] = await Promise.all([
        GameService.getGameById(gameId),
        GameService.getTeamsByGameId(gameId),
        GameService.getRoundsByGameId(gameId),
    ]);

    return game ? buildGameHistoryResult(game, teams ?? [], rounds ?? []) : undefined;
};
