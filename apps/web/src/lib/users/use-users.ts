/**
 * useUsers hook
 * React hook for managing user data and trips
 */

import { useCallback, useState } from "react";
import { getUser as getUserApi, getUserTrips as getUserTripsApi, User } from "@/lib/users/users-api";
import { Trip } from "@/lib/trips/trips-api";

interface UseUsersState {
    user: User | null;
    userTrips: Trip[];
    isLoading: boolean;
    error: string | null;
}

let userCache: Map<string, User> = new Map();
let userTripsCache: Map<string, Trip[]> = new Map();

export function useUsers() {
    const [state, setState] = useState<UseUsersState>({
        user: null,
        userTrips: [],
        isLoading: false,
        error: null,
    });

    const getUser = useCallback(async (userId: string): Promise<User> => {
        try {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            // Check cache first
            if (userCache.has(userId)) {
                setState((prev) => ({ ...prev, isLoading: false, user: userCache.get(userId) || null }));
                return userCache.get(userId)!;
            }

            const user = await getUserApi(userId);
            userCache.set(userId, user);
            setState((prev) => ({
                ...prev,
                user,
                isLoading: false,
            }));
            return user;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch user";
            setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
            throw error;
        }
    }, []);

    const getUserTrips = useCallback(async (userId: string): Promise<Trip[]> => {
        try {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            // Check cache first
            if (userTripsCache.has(userId)) {
                const trips = userTripsCache.get(userId)!;
                setState((prev) => ({ ...prev, isLoading: false, userTrips: trips }));
                return trips;
            }

            const trips = await getUserTripsApi(userId);
            userTripsCache.set(userId, trips);
            setState((prev) => ({
                ...prev,
                userTrips: trips,
                isLoading: false,
            }));
            return trips;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch user trips";
            setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
            throw error;
        }
    }, []);

    const clearCache = useCallback(() => {
        userCache.clear();
        userTripsCache.clear();
        setState({
            user: null,
            userTrips: [],
            isLoading: false,
            error: null,
        });
    }, []);

    return {
        ...state,
        getUser,
        getUserTrips,
        clearCache,
    };
}
