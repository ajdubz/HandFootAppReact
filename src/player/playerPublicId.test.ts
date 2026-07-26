import PlayerGetBasicDTO from "../models/DTOs/Player/PlayerGetBasicDTO";
import {
    getPlayerPublicId,
    getPlayerPublicTag,
    matchesPlayerPublicSearch,
} from "./playerPublicId";

describe("player public IDs", () => {
    test("builds a stable public tag and player ID from the numeric player ID", () => {
        const firstTag = getPlayerPublicTag(42);

        expect(firstTag).toMatch(/^[A-Z0-9]{7}$/);
        expect(getPlayerPublicTag(42)).toBe(firstTag);
        expect(getPlayerPublicTag(43)).not.toBe(firstTag);
        expect(getPlayerPublicId("Casey", 42)).toBe(`Casey#${firstTag}`);
    });

    test("matches nicknames normally and tags only with a leading hash without case sensitivity", () => {
        const player = Object.assign(new PlayerGetBasicDTO(), {
            id: 42,
            nickName: "Casey",
            publicTag: "A7K3XYZ",
        });

        expect(matchesPlayerPublicSearch(player, "caS")).toBe(true);
        expect(matchesPlayerPublicSearch(player, "#A7K")).toBe(true);
        expect(matchesPlayerPublicSearch(player, "a7K")).toBe(false);
        expect(matchesPlayerPublicSearch(player, "casey#a7k")).toBe(false);
        expect(matchesPlayerPublicSearch(player, "ase")).toBe(false);
        expect(matchesPlayerPublicSearch(player, "#wrong")).toBe(false);
    });
});
