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
    rankRoundsByScore,
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
        roundOneBookThreshold: 50,
        roundTwoBookThreshold: 90,
        roundThreeBookThreshold: 120,
        roundFourBookThreshold: 150,
        cleanBooksRequiredToGoOut: 2,
        dirtyBooksRequiredToGoOut: 2,
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

test("ranks teams independently within each round by score", () => {
    const round = (roundNumber: number, handScore: number, teamName: string): GameRoundDTO => {
        const gameRound = new GameRoundDTO();
        gameRound.roundNumber = roundNumber;
        gameRound.handScore = handScore;
        gameRound.gameTeam = Object.assign(new GameTeamDTO(), {
            team: { name: teamName },
        });
        return gameRound;
    };

    const rankedRounds = rankRoundsByScore([
        round(2, 300, "Wild Cards"),
        round(1, 450, "Blaze"),
        round(2, 700, "Blaze"),
        round(1, 200, "Wild Cards"),
    ]);

    expect(rankedRounds.map(({ round: rankedRound, rank }) => ({
        roundNumber: rankedRound.roundNumber,
        teamName: rankedRound.gameTeam?.team?.name,
        rank,
    }))).toEqual([
        { roundNumber: 1, teamName: "Blaze", rank: 1 },
        { roundNumber: 1, teamName: "Wild Cards", rank: 2 },
        { roundNumber: 2, teamName: "Blaze", rank: 1 },
        { roundNumber: 2, teamName: "Wild Cards", rank: 2 },
    ]);
});

test("gives tied round scores the same competition rank", () => {
    const rounds = [500, 500, 200].map((handScore, index) => Object.assign(new GameRoundDTO(), {
        roundNumber: 1,
        handScore,
        gameTeam: Object.assign(new GameTeamDTO(), {
            team: { name: `Team ${index + 1}` },
        }),
    }));

    expect(rankRoundsByScore(rounds).map(({ rank }) => rank)).toEqual([1, 1, 3]);
});

test("finds the next round number", () => {
    const round = new GameRoundDTO();
    round.roundNumber = 3;

    expect(getNextRoundNumber([round])).toBe(4);
});

test("uses configured four-round book thresholds", () => {
    const rules = getEffectiveRules(Object.assign(new Rules(), {
        roundOneBookThreshold: 55,
        roundTwoBookThreshold: 95,
        roundThreeBookThreshold: 125,
        roundFourBookThreshold: 155,
    }));

    expect([1, 2, 3, 4].map((roundNumber) => getBookThreshold(roundNumber, rules))).toEqual([55, 95, 125, 155]);
    expect(getBookThreshold(5, rules)).toBe(155);
});

test("marks the game complete after four rounds", () => {
    const rounds = [1, 2, 3, 4].map((roundNumber) => {
        const round = new GameRoundDTO();
        round.roundNumber = roundNumber;
        return round;
    });

    expect(isGameComplete(rounds)).toBe(true);
});
