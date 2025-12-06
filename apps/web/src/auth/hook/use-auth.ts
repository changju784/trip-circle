/**
 * useAuth Hook
 * Backend-based authentication (no Firebase)
 * Provides login, signup, logout, and OAuth functions
 */

import { useContext } from "react";
import { AuthContext } from "@/components/auth/AuthProvider";
import {
    registerUser,
    loginUser,
    loginWithGoogle,
} from "@/lib/auth/auth-api";
import {
    saveAuthState,
    clearBackendAuthState,
    BackendUser,
} from "@/lib/auth/use-backend-auth";

export const useAuth = () => {
    const { user, loading, error, setLoading, setUser, setError } = useContext(AuthContext);

    /**
     * Register new user with email and password
     */
    const signUp = async (
        email: string,
        password: string,
        name?: string
    ): Promise<BackendUser> => {
        try {
            setError(null);
            setLoading(true);
            const response = await registerUser(email, password, name);
            saveAuthState(response.token, response.user);
            setUser(response.user);
            return response.user;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Registration failed";
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Login with email and password
     */
    const signIn = async (email: string, password: string): Promise<BackendUser> => {
        try {
            setError(null);
            setLoading(true);
            const response = await loginUser(email, password);
            saveAuthState(response.token, response.user);
            setUser(response.user);
            return response.user;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Login failed";
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Login with Google OAuth
     * Backend will redirect to auth/callback?token=<jwt>
     */
    const signInWithGoogle = (): void => {
        try {
            setError(null);
            loginWithGoogle();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Google login failed";
            setError(message);
        }
    };

    /**
     * Logout and clear session
     */
    const logOut = async (): Promise<void> => {
        try {
            setError(null);
            clearBackendAuthState();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Logout failed";
            setError(message);
        }
    };

    return {
        user,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        logOut,
    };
};

