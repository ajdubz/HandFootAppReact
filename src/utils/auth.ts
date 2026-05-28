const TOKEN_KEY = "token";
const MOCK_PLAYER_ID_KEY = "mockPlayerId";
const CURRENT_PLAYER_ID_KEY = "currentPlayerId";
const GUEST_SESSION_KEY = "isGuestSession";
const ACTIVE_GAME_ROUTE_KEY = "activeGameRoute";

export const setAuthState = (playerId: number | string | undefined, token: string, isGuest = false): void => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(CURRENT_PLAYER_ID_KEY, String(playerId ?? ""));

    if (isGuest) {
        localStorage.setItem(MOCK_PLAYER_ID_KEY, String(playerId ?? ""));
        localStorage.setItem(GUEST_SESSION_KEY, "true");
        return;
    }

    localStorage.removeItem(MOCK_PLAYER_ID_KEY);
    localStorage.removeItem(GUEST_SESSION_KEY);
};

export const setGuestAuthState = (playerId: number | string | undefined, token: string): void => {
    setAuthState(playerId, token, true);
};

export const isGuestSession = (): boolean => localStorage.getItem(GUEST_SESSION_KEY) === "true";

export const clearAuthState = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MOCK_PLAYER_ID_KEY);
    localStorage.removeItem(CURRENT_PLAYER_ID_KEY);
    localStorage.removeItem(GUEST_SESSION_KEY);
    localStorage.removeItem(ACTIVE_GAME_ROUTE_KEY);
};
