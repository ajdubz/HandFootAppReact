import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";
import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import Rules from "../models/Rules";
import {
    calculateRoundScore,
    calculateTeamStats,
    getBookThreshold,
    getEffectiveRules,
    getNextRoundNumber,
    isGameComplete,
} from "./gameHomeUtils";

test("calculates round score with default book, red three, pulled, and winner bonuses", () => {
    const round = new GameRoundDTO();
    round.cardPoints = 120;
    round.cleanBooks = 1;
    round.dirtyBooks = 2;
    round.redThrees = 3;
    round.pulledCorrect = 1;
    round.isWinner = true;

    expect(calculateRoundScore(round, getEffectiveRules())).toBe(470);
});

test("subtracts red three penalties from positive counts", () => {
    const round = new GameRoundDTO();
    round.cardPoints = 700;
    round.redThrees = 2;

    expect(calculateRoundScore(round, getEffectiveRules())).toBe(100);
});

test("uses default rules when persisted rule values are empty", () => {
    const rules = new Rules();

    expect(getEffectiveRules(rules)).toEqual({
        cleanBookScore: 500,
        dirtyBookScore: 300,
        redThreeScore: -300,
        pulledScore: 50,
        winnerScore: 100,
    });
});

test("handles empty round values as zero", () => {
    expect(calculateRoundScore({}, getEffectiveRules())).toBe(0);
});

test("aggregates team stats from saved rounds", () => {
    const team = new GameTeamDTO();
    team.id = 7;

    const roundOne = new GameRoundDTO();
    roundOne.gameTeam = team;
    roundOne.roundNumber = 1;
    roundOne.handScore = 500;
    roundOne.cleanBooks = 1;

    const roundTwo = new GameRoundDTO();
    roundTwo.gameTeam = team;
    roundTwo.roundNumber = 2;
    roundTwo.handScore = -50;
    roundTwo.redThrees = 1;

    expect(calculateTeamStats([team], [roundOne, roundTwo])[7]).toEqual({
        totalScore: 450,
        cleanBooks: 1,
        dirtyBooks: 0,
        redThrees: 1,
    });
});

test("finds the next round number", () => {
    const round = new GameRoundDTO();
    round.roundNumber = 3;

    expect(getNextRoundNumber([round])).toBe(4);
});

test("uses fixed four-round book thresholds", () => {
    expect([1, 2, 3, 4].map(getBookThreshold)).toEqual([50, 90, 120, 150]);
});

test("marks the game complete after four rounds", () => {
    const rounds = [1, 2, 3, 4].map((roundNumber) => {
        const round = new GameRoundDTO();
        round.roundNumber = roundNumber;
        return round;
    });

    expect(isGameComplete(rounds)).toBe(true);
});
