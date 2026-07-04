export const MOCK_API_URL = "mock";

export type DataBackend = "mock" | "api" | "firebase";

export const getConfiguredApiUrl = (): string => (process.env.REACT_APP_API_URL ?? "").trim();

export const getConfiguredDataBackend = (): DataBackend | "" => {
    const configuredBackend = (process.env.REACT_APP_DATA_BACKEND ?? "").trim().toLowerCase();
    if (configuredBackend === "mock" || configuredBackend === "api" || configuredBackend === "firebase") {
        return configuredBackend;
    }

    return "";
};

export const getDataBackend = (): DataBackend => {
    const configuredBackend = getConfiguredDataBackend();
    if (configuredBackend) {
        return configuredBackend;
    }

    const configuredApiUrl = getConfiguredApiUrl();
    if (configuredApiUrl.toLowerCase() === MOCK_API_URL || !configuredApiUrl) {
        return "mock";
    }

    return "api";
};

export const isMockApiConfigured = (): boolean => getDataBackend() === "mock";

export const isApiBackend = (): boolean => getDataBackend() === "api";

export const isFirebaseBackend = (): boolean => getDataBackend() === "firebase";

export const getApiBaseUrl = (): string => getConfiguredApiUrl().replace(/\/+$/, "");

export const buildApiUrl = (path: string): string => {
    const apiBaseUrl = getApiBaseUrl();
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    if (!apiBaseUrl || !isApiBackend()) {
        throw new Error("API URL is not configured");
    }

    return `${apiBaseUrl}${normalizedPath}`;
};
