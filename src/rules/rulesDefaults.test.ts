import GameAddDTO from "../models/DTOs/Game/GameAddDTO";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import Rules from "../models/Rules";
import MockApi from "../services/MockApi";
import { buildDefaultRules, loadRuleDefaults, normalizeRules, resetRuleDefaults, saveRuleDefaults } from "./rulesDefaults";

describe("rules defaults", () => {
    const originalApiUrl = process.env.REACT_APP_API_URL;

    beforeEach(() => {
        process.env.REACT_APP_API_URL = "mock";
        localStorage.clear();
        MockApi.reset();
    });

    afterAll(() => {
        process.env.REACT_APP_API_URL = originalApiUrl;
    });

    test("normalizes empty or partial rules against built-in defaults", () => {
        expect(normalizeRules(new Rules())).toEqual(buildDefaultRules());
        expect(normalizeRules({ cleanBookScore: 600, redThreeScore: 250 })).toEqual({
            ...buildDefaultRules(),
            cleanBookScore: 600,
            redThreeScore: -250,
        });
    });

    test("keeps intentional zero values when any rule is customized", () => {
        expect(normalizeRules({ cleanBookScore: 600, winnerScore: 0 })).toEqual({
            ...buildDefaultRules(),
            cleanBookScore: 600,
            winnerScore: 0,
        });
    });

    test("saves, loads, and resets local rule defaults", () => {
        saveRuleDefaults({
            cleanBookScore: 700,
            dirtyBookScore: 400,
            redThreeScore: 200,
            pulledScore: 75,
            winnerScore: 150,
            cardsToStart: 13,
            cardsToDraw: 3,
            roundOneBookThreshold: 55,
            roundTwoBookThreshold: 95,
            roundThreeBookThreshold: 125,
            roundFourBookThreshold: 155,
            cleanBooksRequiredToGoOut: 3,
            dirtyBooksRequiredToGoOut: 1,
        });

        expect(loadRuleDefaults()).toEqual({
            ...buildDefaultRules(),
            cleanBookScore: 700,
            dirtyBookScore: 400,
            redThreeScore: -200,
            pulledScore: 75,
            winnerScore: 150,
            cardsToStart: 13,
            cardsToDraw: 3,
            roundOneBookThreshold: 55,
            roundTwoBookThreshold: 95,
            roundThreeBookThreshold: 125,
            roundFourBookThreshold: 155,
            cleanBooksRequiredToGoOut: 3,
            dirtyBooksRequiredToGoOut: 1,
        });

        expect(resetRuleDefaults()).toEqual(buildDefaultRules());
        expect(loadRuleDefaults()).toEqual(buildDefaultRules());
    });

    test("mock game creation snapshots provided rules", async () => {
        const game = new GameAddDTO();
        game.rules = normalizeRules({
            cleanBookScore: 650,
            dirtyBookScore: 350,
            redThreeScore: 125,
            pulledScore: 25,
            winnerScore: 90,
            cardsToStart: 15,
            cardsToDraw: 4,
            roundOneBookThreshold: 60,
            roundTwoBookThreshold: 100,
            roundThreeBookThreshold: 130,
            roundFourBookThreshold: 160,
            cleanBooksRequiredToGoOut: 3,
            dirtyBooksRequiredToGoOut: 1,
        });

        const createdGame = await MockApi.addGame(game);

        expect(createdGame.rules).toEqual({
            ...buildDefaultRules(),
            cleanBookScore: 650,
            dirtyBookScore: 350,
            redThreeScore: -125,
            pulledScore: 25,
            winnerScore: 90,
            cardsToStart: 15,
            cardsToDraw: 4,
            roundOneBookThreshold: 60,
            roundTwoBookThreshold: 100,
            roundThreeBookThreshold: 130,
            roundFourBookThreshold: 160,
            cleanBooksRequiredToGoOut: 3,
            dirtyBooksRequiredToGoOut: 1,
        });
    });

    test("mock guest creation uses unique fallback emails", async () => {
        const dateSpy = jest.spyOn(Date, "now").mockReturnValue(1234567890);
        const firstGuest = new PlayerAccountDTO();
        firstGuest.nickName = "Blaze (Guest)";
        firstGuest.fullName = "Blaze (Guest)";
        const secondGuest = new PlayerAccountDTO();
        secondGuest.nickName = "Smoke (Guest)";
        secondGuest.fullName = "Smoke (Guest)";

        await expect(MockApi.createGuest(firstGuest)).resolves.toMatchObject({ nickName: "Blaze (Guest)" });
        await expect(MockApi.createGuest(secondGuest)).resolves.toMatchObject({ nickName: "Smoke (Guest)" });

        dateSpy.mockRestore();
    });
});
