import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";
import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import Rules from "../models/Rules";
import { DEFAULT_RULE_VALUES, normalizeRules } from "../rules/rulesDefaults";

export type ScoringRules = {
    cleanBookScore: number;
    dirtyBookScore: number;
    redThreeScore: number;
    pulledScore: number;
    winnerScore: number;
};

export type TeamStats = {
    totalScore: number;
    cleanBooks: number;
    dirtyBooks: number;
    redThrees: number;
};

export const DEFAULT_SCORING_RULES: ScoringRules = {
    cleanBookScore: DEFAULT_RULE_VALUES.cleanBookScore,
    dirtyBookScore: DEFAULT_RULE_VALUES.dirtyBookScore,
    redThreeScore: DEFAULT_RULE_VALUES.redThreeScore,
    pulledScore: DEFAULT_RULE_VALUES.pulledScore,
    winnerScore: DEFAULT_RULE_VALUES.winnerScore,
};

export const BOOK_THRESHOLDS = [50, 90, 120, 150];
export const MAX_ROUNDS = 4;

export const getEffectiveRules = (rules?: Rules): ScoringRules => {
    const effectiveRules = normalizeRules(rules);

    return {
        cleanBookScore: effectiveRules.cleanBookScore,
        dirtyBookScore: effectiveRules.dirtyBookScore,
        redThreeScore: effectiveRules.redThreeScore,
        pulledScore: effectiveRules.pulledScore,
        winnerScore: effectiveRules.winnerScore,
    };
};

export const numberOrZero = (value: string | number | undefined): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const calculateRoundScore = (round: Partial<GameRoundDTO>, rules: ScoringRules): number => {
    return numberOrZero(round.cardPoints) +
        numberOrZero(round.cleanBooks) * rules.cleanBookScore +
        numberOrZero(round.dirtyBooks) * rules.dirtyBookScore +
        Math.max(0, numberOrZero(round.redThrees)) * rules.redThreeScore +
        numberOrZero(round.pulledCorrect) * rules.pulledScore +
        (round.isWinner ? rules.winnerScore : 0);
};

export const getNextRoundNumber = (rounds: GameRoundDTO[]): number => {
    const maxRound = Math.max(0, ...rounds.map((round) => numberOrZero(round.roundNumber)));
    return maxRound + 1;
};

export const isGameComplete = (rounds: GameRoundDTO[]): boolean => {
    return getNextRoundNumber(rounds) > MAX_ROUNDS;
};

export const getBookThreshold = (roundNumber: number): number => {
    return BOOK_THRESHOLDS[Math.min(roundNumber - 1, BOOK_THRESHOLDS.length - 1)] ?? 0;
};

export const groupRoundsByGameTeamId = (rounds: GameRoundDTO[]): Record<number, GameRoundDTO[]> => {
    return rounds.reduce<Record<number, GameRoundDTO[]>>((groups, round) => {
        const gameTeamId = round.gameTeam?.id ?? 0;
        if (!gameTeamId) {
            return groups;
        }

        groups[gameTeamId] = [...(groups[gameTeamId] ?? []), round];
        return groups;
    }, {});
};

export const calculateTeamStats = (teams: GameTeamDTO[], rounds: GameRoundDTO[]): Record<number, TeamStats> => {
    const groupedRounds = groupRoundsByGameTeamId(rounds);

    return teams.reduce<Record<number, TeamStats>>((stats, team) => {
        const gameTeamId = team.id ?? 0;
        const teamRounds = groupedRounds[gameTeamId] ?? [];

        stats[gameTeamId] = teamRounds.reduce<TeamStats>((totals, round) => ({
            totalScore: totals.totalScore + numberOrZero(round.handScore),
            cleanBooks: totals.cleanBooks + numberOrZero(round.cleanBooks),
            dirtyBooks: totals.dirtyBooks + numberOrZero(round.dirtyBooks),
            redThrees: totals.redThrees + numberOrZero(round.redThrees),
        }), {
            totalScore: 0,
            cleanBooks: 0,
            dirtyBooks: 0,
            redThrees: 0,
        });

        return stats;
    }, {});
};
