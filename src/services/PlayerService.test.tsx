import PlayerAccountDTO from "../models/DTOs/Player/PlayerAccountDTO";
import PlayerService from "./PlayerService";

describe("PlayerService backend API integration", () => {
    const originalApiUrl = process.env.REACT_APP_API_URL;
    const originalFetch = global.fetch;

    beforeEach(() => {
        process.env.REACT_APP_API_URL = "http://localhost:8000";
        localStorage.clear();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    afterAll(() => {
        process.env.REACT_APP_API_URL = originalApiUrl;
    });

    test("starts guest sessions through the backend without enabling mock mode", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: jest.fn().mockResolvedValue(JSON.stringify({
                id: 42,
                nickName: "Guest Player",
                email: "guest42@guest.local",
                token: "backend-guest-token",
            })),
        } as unknown as Response);

        const login = await PlayerService.startGuestSession();

        expect(login.id).toBe(42);
        expect(localStorage.getItem("token")).toBe("backend-guest-token");
        expect(localStorage.getItem("currentPlayerId")).toBe("42");
        expect(localStorage.getItem("isGuestSession")).toBeNull();
        expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/auth/guest", expect.objectContaining({
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        }));
    });

    test("creates registered players without a bearer token", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: jest.fn().mockResolvedValue(JSON.stringify({
                id: 7,
                nickName: "Logan",
                email: "logan@example.com",
            })),
        } as unknown as Response);
        const player = new PlayerAccountDTO();
        player.nickName = "Logan";
        player.email = "logan@example.com";

        await PlayerService.createPlayer(player);

        expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/Player/account", expect.objectContaining({
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: expect.any(String),
        }));
        const request = (global.fetch as jest.Mock).mock.calls[0][1];
        expect(request.headers.Authorization).toBeUndefined();
        expect(JSON.parse(request.body)).toMatchObject({
            nickName: "Logan",
            email: "logan@example.com",
        });
    });

    test("uses backend login when an old mock guest session is still in storage", async () => {
        localStorage.setItem("isGuestSession", "true");
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: jest.fn().mockResolvedValue(JSON.stringify({
                id: 1,
                nickName: "Dev Alex",
                email: "alex@example.com",
                token: "backend-token",
            })),
        } as unknown as Response);
        const player = new PlayerAccountDTO();
        player.email = "alex@example.com";
        player.password = "password";

        const login = await PlayerService.LoginPlayer(player);

        expect(login).toMatchObject({
            id: 1,
            email: "alex@example.com",
            token: "backend-token",
        });
        expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/auth/login", expect.objectContaining({
            method: "POST",
        }));
    });
});
