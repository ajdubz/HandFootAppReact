import { ApiError, apiRequest, isApiErrorCode } from "./apiClient";

describe("apiRequest", () => {
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

    test("throws backend error payload details when a request fails", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 409,
            text: jest.fn().mockResolvedValue(JSON.stringify({
                message: "Player already exists.",
                code: "duplicate_player",
                details: { field: "email" },
            })),
        } as unknown as Response);

        try {
            await apiRequest("/Player/account", {
                method: "POST",
                authenticated: false,
                body: { email: "dupe@example.com" },
                fallbackErrorMessage: "Fallback error",
            });
            throw new Error("Expected request to fail");
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError);
            expect(error).toMatchObject({
                message: "Player already exists.",
                status: 409,
                code: "duplicate_player",
                details: { field: "email" },
            });
            expect(isApiErrorCode(error, "duplicate_player")).toBe(true);
        }
    });
});
