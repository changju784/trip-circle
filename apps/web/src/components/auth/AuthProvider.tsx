import React, { createContext, useEffect, useState } from "react";
import { restoreBackendAuthState, BackendUser, saveAuthState } from "@/lib/auth/use-backend-auth";
import { getTokenFromCallback } from "@/lib/auth/auth-api";
import axios from "axios";

export const AuthContext = createContext<{
    user: BackendUser | null;
    loading: boolean;
    error: string | null;
    setUser: (user: BackendUser | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}>({
    user: null,
    loading: true,
    error: null,
    setUser: () => { },
    setLoading: () => { },
    setError: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<BackendUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ---- Restore authentication on mount ----
    useEffect(() => {
        // 1. OAuth callback handling
        const token = getTokenFromCallback();
        if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const backendUser: BackendUser = {
                id: payload.userId,
                email: payload.email,
                name: payload.name || null,
            };

            saveAuthState(token, backendUser);
            setUser(backendUser);

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            setLoading(false);
            return;
        }

        // 2. Local storage authentication restore
        const authState = restoreBackendAuthState();
        if (authState.backendToken && authState.backendUser) {
            setUser(authState.backendUser);
        }

        setLoading(false);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                setUser,
                setLoading,
                setError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
