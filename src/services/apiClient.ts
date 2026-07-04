import { getAuthToken } from "../utils/auth";
import { buildApiUrl } from "./apiConfig";

export interface BackendErrorPayload {
    message?: string;
    code?: string;
    details?: Record<string, unknown>;
}

export class ApiError extends Error {
    public status?: number;
    public code?: string;
    public details: Record<string, unknown>;

    constructor(message: string, status?: number, code?: string, details: Record<string, unknown> = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

export const isApiErrorCode = (error: unknown, code: string): boolean => (
    error instanceof ApiError && error.code === code
);

interface ApiRequestOptions extends Omit<RequestInit, "body" | "headers"> {
    authenticated?: boolean;
    body?: unknown;
    fallbackErrorMessage?: string;
    headers?: Record<string, string>;
}

const parseResponseBody = async (response: Response): Promise<unknown> => {
    const text = await response.text();
    if (!text) {
        return undefined;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

const isBackendErrorPayload = (body: unknown): body is BackendErrorPayload => (
    !!body &&
    typeof body === "object" &&
    ("message" in body || "code" in body || "details" in body)
);

const createApiError = (response: Response, body: unknown, fallbackMessage: string): ApiError => {
    if (isBackendErrorPayload(body)) {
        return new ApiError(
            body.message || fallbackMessage,
            response.status,
            body.code,
            body.details ?? {},
        );
    }

    return new ApiError(fallbackMessage, response.status);
};

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
    const {
        authenticated = true,
        body,
        fallbackErrorMessage = "API request failed",
        headers = {},
        ...fetchOptions
    } = options;

    const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...headers,
    };

    if (authenticated) {
        const token = getAuthToken();
        if (!token) {
            throw new ApiError("No token found", 401, "missing_token");
        }

        requestHeaders.Authorization = `Bearer ${token}`;
    }

    let response: Response;
    try {
        response = await fetch(buildApiUrl(path), {
            ...fetchOptions,
            headers: requestHeaders,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch (error) {
        if (error instanceof Error && error.message === "API URL is not configured") {
            throw new ApiError(error.message, undefined, "api_url_missing");
        }

        throw error;
    }

    const parsedBody = await parseResponseBody(response);

    if (!response.ok) {
        throw createApiError(response, parsedBody, fallbackErrorMessage);
    }

    return parsedBody as T;
};
