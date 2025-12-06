/**
 * useUsers hook
 * React hook for managing user data, user trips, and user searching
 */

import { useCallback, useState } from "react";
import {
    getUser as getUserApi,
    getUserTrips as getUserTripsApi,
    searchUsers as searchUsersApi,
    User
} from "@/lib/users/users-api";
import { Trip } from "@/lib/trips/trips-api";

interface UseUsersState {
    user: User | null;
    userTrips: Trip[];
    isLoading: boolean;
    error: string | null;
}

let userCache: Map<string, User> = new Map();
let userTripsCache: Map<string, Trip[]> = new Map();
// Optional search cache to avoid hitting backend on repeat queries
let userSearchCache: Map<string, User[]> = new Map();

export function useUsers() {
    const [state, setState] = useState<UseUsersState>({
        user: null,
        userTrips: [],
        isLoading: false,
        error: null,
    });

    /**
     * Fetch a user by ID (cached)
     */
    const getUser = useCallback(async (userId: string): Promise<User> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            if (userCache.has(userId)) {
                const cachedUser = userCache.get(userId)!;
                setState(prev => ({ ...prev, isLoading: false, user: cachedUser }));
                return cachedUser;
            }

            const user = await getUserApi(userId);
            userCache.set(userId, user);

            setState(prev => ({ ...prev, isLoading: false, user }));
            return user;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch user";
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            throw error;
        }
    }, []);

    /**
     * Fetch all trips belonging to a user (cached)
     */
    const getUserTrips = useCallback(async (userId: string): Promise<Trip[]> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            if (userTripsCache.has(userId)) {
                const cachedTrips = userTripsCache.get(userId)!;
                setState(prev => ({ ...prev, isLoading: false, userTrips: cachedTrips }));
                return cachedTrips;
            }

            const trips = await getUserTripsApi(userId);
            userTripsCache.set(userId, trips);

            setState(prev => ({ ...prev, isLoading: false, userTrips: trips }));
            return trips;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch user trips";
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            throw error;
        }
    }, []);

    /**
     * Search users by username/email (supports multi-select user sharing)
     * - Uses backend route `/api/users/search/:query`
     * - Results cached per query
     */
    const searchUsers = useCallback(async (query: string): Promise<User[]> => {
        try {
            if (!query.trim()) return [];

            // Use cached search if exists
            if (userSearchCache.has(query)) {
                return userSearchCache.get(query)!;
            }

            setState(prev => ({ ...prev, isLoading: true, error: null }));

            const results = await searchUsersApi(query);

            // Cache search results
            userSearchCache.set(query, results);

            setState(prev => ({ ...prev, isLoading: false }));
            return results;

        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to search users";
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            return [];
        }
    }, []);

    /**
     * Clear all user caches (manual)
     */
    const clearCache = useCallback(() => {
        userCache.clear();
        userTripsCache.clear();
        userSearchCache.clear();
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
        searchUsers,   // ⭐ NEW
        clearCache,
    };
}
