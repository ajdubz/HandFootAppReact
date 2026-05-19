export const clearAuthState = (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("mockPlayerId");
    localStorage.removeItem("currentPlayerId");
};
