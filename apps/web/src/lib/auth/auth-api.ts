/**
 * Backend Authentication API
 * Handles registration, login, and logout with the backend
 */

import { apiPost } from "../api";

export interface BackendUser {
    id: string;
    email: string;
    name?: string;
    dateCreated?: string;
}

export interface AuthResponse {
    token: string;
    user: BackendUser;
}

export async function registerUser(
    email: string,
    password: string,
    name?: string
): Promise<AuthResponse> {
    return apiPost<AuthResponse>("/api/auth/register", {
        email,
        password,
        name: name || undefined,
    });
}

export async function loginUser(
    email: string,
    password: string
): Promise<AuthResponse> {
    return apiPost<AuthResponse>("/api/auth/login", {
        email,
        password,
    });
}

/**
 * Start Google OAuth flow
 * Redirects user to backend Google OAuth endpoint
 */
export function loginWithGoogle(): void {
    const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:5001";
    window.location.href = `${backendUrl}/api/auth/google`;
}

/**
 * Handle OAuth callback after backend redirects with token
 * Extract token from URL query parameter
 */
export function getTokenFromCallback(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
}

