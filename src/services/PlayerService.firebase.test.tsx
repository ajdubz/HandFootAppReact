import PlayerLoginDTO from "../models/DTOs/Player/PlayerLoginDTO";
import FirebasePlayerService from "./firebase/FirebasePlayerService";
import PlayerService from "./PlayerService";

const restoreEnv = (key: string, value: string | undefined): void => {
    if (value === undefined) {
        delete process.env[key];
        return;
    }

    process.env[key] = value;
};

jest.mock("./firebase/FirebasePlayerService", () => ({
    __esModule: true,
    default: {
        startGuestSession: jest.fn(),
    },
}));

describe("PlayerService firebase backend routing", () => {
    const originalDataBackend = process.env.REACT_APP_DATA_BACKEND;
    const originalApiUrl = process.env.REACT_APP_API_URL;
    const originalFetch = global.fetch;

    beforeEach(() => {
        process.env.REACT_APP_DATA_BACKEND = "firebase";
        process.env.REACT_APP_API_URL = "mock";
        localStorage.clear();
        global.fetch = jest.fn();
        jest.clearAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    afterAll(() => {
        restoreEnv("REACT_APP_DATA_BACKEND", originalDataBackend);
        restoreEnv("REACT_APP_API_URL", originalApiUrl);
    });

    test("starts guest sessions through Firebase instead of mock or API", async () => {
        const login = Object.assign(new PlayerLoginDTO(), {
            id: 77,
            nickName: "Guest Player",
            email: "guest-77@firebase.local",
            token: "firebase-token",
        });
        (FirebasePlayerService.startGuestSession as jest.Mock).mockResolvedValue(login);

        const result = await PlayerService.startGuestSession();

        expect(result).toMatchObject({ id: 77, token: "firebase-token" });
        expect(FirebasePlayerService.startGuestSession).toHaveBeenCalledTimes(1);
        expect(global.fetch).not.toHaveBeenCalled();
        expect(localStorage.getItem("token")).toBe("firebase-token");
        expect(localStorage.getItem("currentPlayerId")).toBe("77");
        expect(localStorage.getItem("isGuestSession")).toBe("true");
    });
});
