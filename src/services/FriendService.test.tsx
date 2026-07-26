import PlayerFriendBasicDTO from "../models/DTOs/Player/PlayerFriendBasicDTO";
import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import { getPlayerPublicTag } from "../player/playerPublicId";
import FriendService from "./FriendService";
import MockApi from "./MockApi";

const restoreEnv = (key: string, value: string | undefined): void => {
    if (value === undefined) {
        delete process.env[key];
        return;
    }

    process.env[key] = value;
};

describe("FriendService", () => {
    const originalApiUrl = process.env.REACT_APP_API_URL;
    const originalDataBackend = process.env.REACT_APP_DATA_BACKEND;
    const originalFetch = global.fetch;

    afterEach(() => {
        restoreEnv("REACT_APP_API_URL", originalApiUrl);
        restoreEnv("REACT_APP_DATA_BACKEND", originalDataBackend);
        global.fetch = originalFetch;
        localStorage.clear();
    });

    test("declines friend requests through the backend API route", async () => {
        process.env.REACT_APP_API_URL = "http://localhost:8000";
        delete process.env.REACT_APP_DATA_BACKEND;
        localStorage.setItem("token", "backend-token");
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: jest.fn().mockResolvedValue(""),
        } as unknown as Response);

        const playerFriend = new PlayerFriendBasicDTO();
        playerFriend.playerId = 1;
        playerFriend.friendId = 4;

        await FriendService.declineFriendRequest(1, playerFriend);

        expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/Player/1/friendRequests/4", expect.objectContaining({
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer backend-token",
            },
        }));
    });

    test("mock friend search excludes incoming requests until they are declined", async () => {
        process.env.REACT_APP_API_URL = "mock";
        delete process.env.REACT_APP_DATA_BACKEND;
        MockApi.reset();

        await expect(FriendService.searchNewFriends(1, "Casey")).resolves.toEqual([]);

        const playerFriend = new PlayerFriendBasicDTO();
        playerFriend.playerId = 1;
        playerFriend.friendId = 4;

        await FriendService.declineFriendRequest(1, playerFriend);

        await expect(FriendService.searchNewFriends(1, "Casey")).resolves.toEqual([
            expect.objectContaining({ id: 4, nickName: "Casey" }),
        ]);
    });

    test("mock friend search matches nickname and public tag without case sensitivity, but not private fields", async () => {
        process.env.REACT_APP_API_URL = "mock";
        delete process.env.REACT_APP_DATA_BACKEND;
        MockApi.reset();

        const playerFriend = new PlayerFriendBasicDTO();
        playerFriend.playerId = 1;
        playerFriend.friendId = 4;
        await FriendService.declineFriendRequest(1, playerFriend);

        await expect(FriendService.searchNewFriends(1, "CaSeY")).resolves.toEqual([
            expect.objectContaining({ id: 4, nickName: "Casey" }),
        ]);
        const casey = (await MockApi.getPlayerAccountById(4))!;
        await expect(FriendService.searchNewFriends(1, casey.publicTag!.toLowerCase())).resolves.toEqual([]);
        await expect(FriendService.searchNewFriends(1, `#${casey.publicTag!.toLowerCase()}`)).resolves.toEqual([
            expect.objectContaining({ id: 4, publicTag: casey.publicTag }),
        ]);
        await expect(FriendService.searchNewFriends(1, "Morgan")).resolves.toEqual([]);
        await expect(FriendService.searchNewFriends(1, "casey@example.com")).resolves.toEqual([]);
    });

    test("allows duplicate nicknames and gives each account a different public tag", async () => {
        process.env.REACT_APP_API_URL = "mock";
        delete process.env.REACT_APP_DATA_BACKEND;
        MockApi.reset();

        const duplicateCasey = Object.assign(new PlayerAccountDTO(), {
            nickName: "Casey",
            fullName: "Another Private Name",
            email: "another-casey@example.com",
            password: "password",
        });
        const createdPlayer = await MockApi.createPlayer(duplicateCasey);
        const matches = await MockApi.searchPlayers("casey");

        expect(matches).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: 4, nickName: "Casey" }),
            expect.objectContaining({ id: createdPlayer.id, nickName: "Casey" }),
        ]));
        expect(new Set(matches.map((player) => player.publicTag)).size).toBe(2);
    });

    test("falls back to player list search when the backend search route is unavailable", async () => {
        process.env.REACT_APP_API_URL = "http://localhost:8000";
        delete process.env.REACT_APP_DATA_BACKEND;
        localStorage.setItem("token", "backend-token");
        global.fetch = jest.fn((url: RequestInfo | URL) => {
            const requestUrl = String(url);
            const responseBody = (() => {
                if (requestUrl.endsWith("/Player/1/newFriendSearch/Logan")) {
                    return { ok: false, status: 404, body: { message: "Not found" } };
                }

                if (requestUrl.endsWith("/Player")) {
                    return {
                        ok: true,
                        status: 200,
                        body: [
                            { id: 1, nickName: "Alex", fullName: "Alex Davis" },
                            { id: 2, nickName: "Sam", fullName: "Sam Taylor" },
                            { id: 3, nickName: "Jordan", fullName: "Jordan Lee" },
                            { id: 4, nickName: "Casey", fullName: "Casey Morgan" },
                            { id: 5, nickName: "Logan", fullName: "Logan Smith" },
                        ],
                    };
                }

                if (requestUrl.endsWith("/Player/1/friends")) {
                    return { ok: true, status: 200, body: [{ id: 2, nickName: "Sam", fullName: "Sam Taylor" }] };
                }

                if (requestUrl.endsWith("/Player/1/requestsSent")) {
                    return { ok: true, status: 200, body: [{ id: 3, nickName: "Jordan", fullName: "Jordan Lee" }] };
                }

                if (requestUrl.endsWith("/Player/1/friendRequests")) {
                    return { ok: true, status: 200, body: [{ id: 4, nickName: "Casey", fullName: "Casey Morgan" }] };
                }

                return { ok: false, status: 500, body: { message: "Unexpected URL" } };
            })();

            return Promise.resolve({
                ok: responseBody.ok,
                status: responseBody.status,
                text: jest.fn().mockResolvedValue(JSON.stringify(responseBody.body)),
            } as unknown as Response);
        });

        await expect(FriendService.searchNewFriends(1, "Logan")).resolves.toEqual([
            expect.objectContaining({ id: 5, nickName: "Logan" }),
        ]);
    });

    test("falls back to player list search when the backend search route returns no matches", async () => {
        process.env.REACT_APP_API_URL = "http://localhost:8000";
        delete process.env.REACT_APP_DATA_BACKEND;
        localStorage.setItem("token", "backend-token");
        global.fetch = jest.fn((url: RequestInfo | URL) => {
            const requestUrl = String(url);
            const responseBody = (() => {
                if (requestUrl.endsWith("/Player/1/newFriendSearch/Logan")) {
                    return { ok: true, status: 200, body: [] };
                }

                if (requestUrl.endsWith("/Player")) {
                    return {
                        ok: true,
                        status: 200,
                        body: [
                            { id: 1, nickName: "Alex", fullName: "Alex Davis" },
                            { id: 5, nickName: "Logan", fullName: "Logan Smith" },
                            { id: 6, nickName: "Guest Player", fullName: "Guest Player", isGuest: true },
                        ],
                    };
                }

                if (requestUrl.endsWith("/Player/1/friends") ||
                    requestUrl.endsWith("/Player/1/requestsSent") ||
                    requestUrl.endsWith("/Player/1/friendRequests")) {
                    return { ok: true, status: 200, body: [] };
                }

                return { ok: false, status: 500, body: { message: "Unexpected URL" } };
            })();

            return Promise.resolve({
                ok: responseBody.ok,
                status: responseBody.status,
                text: jest.fn().mockResolvedValue(JSON.stringify(responseBody.body)),
            } as unknown as Response);
        });

        await expect(FriendService.searchNewFriends(1, "Logan")).resolves.toEqual([
            expect.objectContaining({ id: 5, nickName: "Logan" }),
        ]);
    });

    test("filters API current-friend search to nicknames and hash-prefixed public tags", async () => {
        process.env.REACT_APP_API_URL = "http://localhost:8000";
        delete process.env.REACT_APP_DATA_BACKEND;
        localStorage.setItem("token", "backend-token");
        const logan = { id: 5, nickName: "Logan", fullName: "Private Smith" };
        const loganTag = getPlayerPublicTag(logan.id);

        global.fetch = jest.fn((url: RequestInfo | URL) => {
            const requestUrl = String(url);
            const isCurrentFriendSearch = requestUrl.includes("/Player/1/currFriendSearch/");
            const responseBody = isCurrentFriendSearch
                ? [logan]
                : requestUrl.endsWith("/Player/1/friends")
                    ? [logan]
                    : [];

            return Promise.resolve({
                ok: true,
                status: 200,
                text: jest.fn().mockResolvedValue(JSON.stringify(responseBody)),
            } as unknown as Response);
        });

        await expect(FriendService.searchCurrentFriends(1, "Smith")).resolves.toEqual([]);
        await expect(FriendService.searchCurrentFriends(1, `#${loganTag.toLowerCase()}`)).resolves.toEqual([
            expect.objectContaining({ id: 5, nickName: "Logan" }),
        ]);
        await expect(FriendService.searchCurrentFriends(1, loganTag)).resolves.toEqual([]);
    });
});
