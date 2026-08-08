const ACTIVE_GAME_ROUTE_KEY = "activeGameRoute";
const ACTIVE_GAME_ROUTE_PATTERN = /^\/player\/(\d+)\/game\/(\d+)$/;

export const buildActiveGameRoute = (playerId: number | string, gameId: number | string): string => {
    return `/player/${playerId}/game/${gameId}`;
};

export const saveActiveGameRoute = (playerId: number | string | undefined, gameId: number | string | undefined): void => {
    if (!playerId || !gameId) {
        return;
    }

    localStorage.setItem(ACTIVE_GAME_ROUTE_KEY, buildActiveGameRoute(playerId, gameId));
};

export const getActiveGameRoute = (currentPlayerId?: number | string): string => {
    const activeGameRoute = localStorage.getItem(ACTIVE_GAME_ROUTE_KEY) ?? "";
    const routeMatch = activeGameRoute.match(ACTIVE_GAME_ROUTE_PATTERN);

    if (!routeMatch) {
        return "";
    }

    if (currentPlayerId && routeMatch[1] !== String(currentPlayerId)) {
        return "";
    }

    return activeGameRoute;
};

export const getGameIdFromActiveGameRoute = (route: string): number | undefined => {
    const routeMatch = route.match(ACTIVE_GAME_ROUTE_PATTERN);
    if (!routeMatch) {
        return undefined;
    }

    return Number(routeMatch[2]);
};

export const isActiveGameRoute = (route: string | undefined): route is string => {
    return Boolean(route?.match(ACTIVE_GAME_ROUTE_PATTERN));
};

export const clearActiveGameRoute = (): void => {
    localStorage.removeItem(ACTIVE_GAME_ROUTE_KEY);
};
