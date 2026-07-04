import { buildApiUrl, getDataBackend, isApiBackend, isFirebaseBackend, isMockApiConfigured } from "./apiConfig";

const restoreEnv = (key: string, value: string | undefined): void => {
    if (value === undefined) {
        delete process.env[key];
        return;
    }

    process.env[key] = value;
};

describe("apiConfig data backend selection", () => {
    const originalDataBackend = process.env.REACT_APP_DATA_BACKEND;
    const originalApiUrl = process.env.REACT_APP_API_URL;

    afterEach(() => {
        restoreEnv("REACT_APP_DATA_BACKEND", originalDataBackend);
        restoreEnv("REACT_APP_API_URL", originalApiUrl);
    });

    test("defaults to mock when no backend or API URL is configured", () => {
        delete process.env.REACT_APP_DATA_BACKEND;
        delete process.env.REACT_APP_API_URL;

        expect(getDataBackend()).toBe("mock");
        expect(isMockApiConfigured()).toBe(true);
    });

    test("keeps existing API URL mode compatible", () => {
        delete process.env.REACT_APP_DATA_BACKEND;
        process.env.REACT_APP_API_URL = "http://localhost:8000/";

        expect(getDataBackend()).toBe("api");
        expect(isApiBackend()).toBe(true);
        expect(buildApiUrl("/Player")).toBe("http://localhost:8000/Player");
    });

    test("uses explicit firebase backend without treating API URL as active", () => {
        process.env.REACT_APP_DATA_BACKEND = "firebase";
        process.env.REACT_APP_API_URL = "http://localhost:8000";

        expect(getDataBackend()).toBe("firebase");
        expect(isFirebaseBackend()).toBe(true);
        expect(() => buildApiUrl("/Player")).toThrow("API URL is not configured");
    });
});
