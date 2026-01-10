import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    AxiosError,
} from "axios";

// Re-export types for use in other modules
export type { AxiosRequestConfig };

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

/**
 * Central API client with JWT token attachment and error handling.
 * - Automatically attaches Authorization: Bearer <token> header
 * - Handles 401 (Unauthorized) errors and triggers logout
 * - Provides get/post/put/delete wrappers
 */

let currentToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/**
 * Set the JWT token to be attached to all requests
 */
export function setApiToken(token: string | null) {
    currentToken = token;
}

/**
 * Register a callback to be called when a 401 error is received
 */
export function setOnUnauthorizedCallback(callback: (() => void) | null) {
    onUnauthorized = callback;
}

/**
 * Create axios instance with interceptors
 */
function createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            "Content-Type": "application/json",
        },
    });

    // Request interceptor: attach token
    instance.interceptors.request.use(
        (config) => {
            if (currentToken) {
                config.headers.Authorization = `Bearer ${currentToken}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor: handle 401
    instance.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            if (error.response?.status === 401) {
                // Token expired or invalid
                setApiToken(null);
                if (onUnauthorized) {
                    onUnauthorized();
                }
            }
            return Promise.reject(error);
        }
    );

    return instance;
}

const axiosInstance = createAxiosInstance();

/**
 * Generic GET request
 */
export async function apiGet<T>(
    endpoint: string,
    config?: AxiosRequestConfig
): Promise<T> {
    const response: AxiosResponse<T> = await axiosInstance.get(endpoint, config);
    return response.data;
}

/**
 * Generic POST request
 */
export async function apiPost<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<T> {
    const response: AxiosResponse<T> = await axiosInstance.post(
        endpoint,
        data,
        config
    );
    return response.data;
}

/**
 * Generic PUT request
 */
export async function apiPut<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<T> {
    const response: AxiosResponse<T> = await axiosInstance.put(
        endpoint,
        data,
        config
    );
    return response.data;
}

/**
 * Generic DELETE request
 */
export async function apiDelete<T>(
    endpoint: string,
    config?: AxiosRequestConfig
): Promise<T> {
    const response: AxiosResponse<T> = await axiosInstance.delete(endpoint, config);
    return response.data;
}

/**
 * Get the base API URL (for reference)
 */
export function getApiBaseUrl(): string {
    return API_BASE_URL;
}
