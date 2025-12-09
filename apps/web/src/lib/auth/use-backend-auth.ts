/**
 * Backend Authentication State Management
 * Handles JWT tokens and user data from backend
 */

import { setApiToken } from "@/lib/api";

export interface BackendUser {
    id: string;
    email: string;
    name?: string;
    username?: string;
    dateCreated?: string;
}

export interface BackendAuthState {
    backendUser: BackendUser | null;
    backendToken: string | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * Save authentication state to localStorage
 */
export function saveAuthState(token: string, user: BackendUser): void {
    localStorage.setItem("backendToken", token);
    localStorage.setItem("backendUser", JSON.stringify(user));
    setApiToken(token);
}

/**
 * Restore backend auth state from localStorage
 */
export function restoreBackendAuthState(): BackendAuthState {
    try {
        const token = localStorage.getItem("backendToken");
        const userJson = localStorage.getItem("backendUser");

        if (token && userJson) {
            const user = JSON.parse(userJson);
            setApiToken(token);
            return {
                backendToken: token,
                backendUser: user,
                isLoading: false,
                error: null,
            };
        }
    } catch (error) {
        console.error("Failed to restore backend auth state:", error);
    }

    return {
        backendToken: null,
        backendUser: null,
        isLoading: false,
        error: null,
    };
}

/**
 * Clear backend auth state from localStorage and API client
 */
export function clearBackendAuthState(): void {
    localStorage.removeItem("backendToken");
    localStorage.removeItem("backendUser");
    setApiToken(null);
}

