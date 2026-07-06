import GameRoundDTO from "../models/DTOs/Game/GameRoundDTO";
import GameTeamDTO from "../models/DTOs/Game/GameTeamDTO";
import GameWithRulesDTO from "../models/DTOs/Game/GameWithRulesDTO";
import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import TeamGetWithPlayerNamesDTO from "../models/DTOs/Team/TeamGetWithPlayerNamesDTO";
import {
    buildGameHistoryResult,
    GameHistoryResult,
    gameMatchesHistoryFilters,
    sortGameHistoryResults,
} from "./gameHistoryUtils";

const player = (id: number, nickName: string): PlayerGetBasicDTO => Object.assign(new PlayerGetBasicDTO(), {
    id,
    nickName,
    fullName: nickName,
});

const game = (id: number, date: Date): GameWithRulesDTO => Object.assign(new GameWithRulesDTO(), {
    id,
    date,
});

const gameTeam = (id: number, teamId: number, name: string, members: PlayerGetBasicDTO[]): GameTeamDTO => {
    const team = Object.assign(new TeamGetWithPlayerNamesDTO(), {
        id: teamId,
        name,
        teamMembers: members,
    });

    return Object.assign(new GameTeamDTO(), {
        id,
        team,
    });
};

const round = (
    gameTeamValue: GameTeamDTO,
    roundNumber: number,
    handScore: number,
    cleanBooks = 0,
    dirtyBooks = 0,
): GameRoundDTO => Object.assign(new GameRoundDTO(), {
    gameTeam: gameTeamValue,
    roundNumber,
    handScore,
    cleanBooks,
    dirtyBooks,
});

test("builds direct game history with ranked teams, book totals, and four-round completion", () => {
    const alex = player(1, "Alex");
    const sam = player(2, "Sam");
    const blaze = gameTeam(10, 100, "Blaze", [alex]);
    const wildCards = gameTeam(11, 101, "Wild Cards", [sam]);

    const result = buildGameHistoryResult(game(7, new Date("2026-07-01T12:00:00Z")), [blaze, wildCards], [
        round(blaze, 1, 500, 1, 0),
        round(wildCards, 1, 700, 0, 2),
        round(blaze, 2, 600, 1, 1),
        round(wildCards, 2, 400, 0, 1),
        round(blaze, 3, 300),
        round(wildCards, 3, 100),
        round(blaze, 4, 200),
        round(wildCards, 4, 50),
    ]);

    expect(result?.gameId).toBe(7);
    expect(result?.rankedTeams.map((team) => team.team?.name)).toEqual(["Blaze", "Wild Cards"]);
    expect(result?.teamStats[10]).toEqual({
        totalScore: 1600,
        cleanBooks: 2,
        dirtyBooks: 1,
        redThrees: 0,
    });
    expect(result?.teamStats[11]).toEqual({
        totalScore: 1250,
        cleanBooks: 0,
        dirtyBooks: 3,
        redThrees: 0,
    });
    expect(result?.roundCount).toBe(4);
    expect(result?.isComplete).toBe(true);
});

test("filters game history by player, team, and saved rounds", () => {
    const alex = player(1, "Alex");
    const casey = player(2, "Casey");
    const blaze = gameTeam(10, 100, "Blaze", [alex]);
    const tableTalk = gameTeam(11, 101, "Table Talk", [casey]);

    const result = buildGameHistoryResult(game(8, new Date("2026-07-02T12:00:00Z")), [blaze, tableTalk], [
        round(blaze, 1, 300),
        round(tableTalk, 1, 250),
    ]);
    const emptyResult = buildGameHistoryResult(game(9, new Date("2026-07-03T12:00:00Z")), [tableTalk], []);

    expect(result && gameMatchesHistoryFilters(result, { playerId: 1 })).toBe(true);
    expect(result && gameMatchesHistoryFilters(result, { teamId: 101 })).toBe(true);
    expect(result && gameMatchesHistoryFilters(result, { playerId: 42 })).toBe(false);
    expect(emptyResult && gameMatchesHistoryFilters(emptyResult, { requireRounds: true })).toBe(false);
});

test("sorts game history newest first with game id as a tie breaker", () => {
    const team = gameTeam(10, 100, "Blaze", [player(1, "Alex")]);
    const older = buildGameHistoryResult(game(1, new Date("2026-06-01T12:00:00Z")), [team], []);
    const newerLowId = buildGameHistoryResult(game(2, new Date("2026-07-01T12:00:00Z")), [team], []);
    const newerHighId = buildGameHistoryResult(game(3, new Date("2026-07-01T12:00:00Z")), [team], []);

    const results = [older, newerLowId, newerHighId].filter(Boolean) as GameHistoryResult[];

    expect(sortGameHistoryResults(results).map((result) => result.gameId))
        .toEqual([3, 2, 1]);
});
