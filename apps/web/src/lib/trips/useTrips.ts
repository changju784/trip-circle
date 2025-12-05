/**
 * useTrips hook
 * React hook for managing trips with caching
 * Replaces tripStorage usage with backend API calls
 */

import { useCallback, useState } from "react";
import {
    createTrip as createTripApi,
    getTrip as getTripApi,
    updateTrip as updateTripApi,
    deleteTrip as deleteTripApi,
    forkTrip as forkTripApi,
    exploreTrips as exploreTripsApi,
    shareTrip as shareTripApi,
    Trip,
    CreateTripInput,
} from "@/lib/trips/tripsApi";

interface UseTripState {
    trips: Map<string, Trip>;
    isLoading: boolean;
    error: string | null;
}

let tripCache: Map<string, Trip> = new Map();

export function useTrips() {
    const [state, setState] = useState<UseTripState>({
        trips: tripCache,
        isLoading: false,
        error: null,
    });

    const createTrip = useCallback(async (input: CreateTripInput): Promise<Trip> => {
        try {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));
            const trip = await createTripApi(input);
            tripCache.set(trip._id, trip);
            setState((prev) => ({
                ...prev,
                trips: new Map(tripCache),
                isLoading: false,
            }));
            return trip;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create trip";
            setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
            throw error;
        }
    }, []);

    const getTrip = useCallback(async (tripId: string): Promise<Trip> => {
        try {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            // Check cache first
            if (tripCache.has(tripId)) {
                setState((prev) => ({ ...prev, isLoading: false }));
                return tripCache.get(tripId)!;
            }

            const trip = await getTripApi(tripId);
            tripCache.set(trip._id, trip);
            setState((prev) => ({
                ...prev,
                trips: new Map(tripCache),
                isLoading: false,
            }));
            return trip;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch trip";
            setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
            throw error;
        }
    }, []);

    const updateTrip = useCallback(
        async (tripId: string, updates: Partial<CreateTripInput>): Promise<Trip> => {
            try {
                setState((prev) => ({ ...prev, isLoading: true, error: null }));
                const trip = await updateTripApi(tripId, updates);
                tripCache.set(trip._id, trip);
                setState((prev) => ({
                    ...prev,
                    trips: new Map(tripCache),
                    isLoading: false,
                }));
                return trip;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to update trip";
                setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
                throw error;
            }
        },
        []
    );

    const deleteTrip = useCallback(async (tripId: string): Promise<void> => {
        try {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));
            await deleteTripApi(tripId);
            tripCache.delete(tripId);
            setState((prev) => ({
                ...prev,
                trips: new Map(tripCache),
                isLoading: false,
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete trip";
            setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
            throw error;
        }
    }, []);

    const exploreTrips = useCallback(
        async (query?: string, limit?: number, skip?: number): Promise<Trip[]> => {
            try {
                setState((prev) => ({ ...prev, isLoading: true, error: null }));
                const trips = await exploreTripsApi(query, limit, skip);
                // Don't cache explore results in the same way - they're temporary
                setState((prev) => ({ ...prev, isLoading: false }));
                return trips;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to explore trips";
                setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
                throw error;
            }
        },
        []
    );

    const shareTrip = useCallback(async (tripId: string, email: string): Promise<void> => {
        try {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));
            await shareTripApi(tripId, email);
            setState((prev) => ({ ...prev, isLoading: false }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to share trip";
            setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
            throw error;
        }
    }, []);

    const forkTrip = useCallback(async (tripId: string, userId: string): Promise<Trip> => {
        try {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));
            const result = await forkTripApi(tripId, userId);
            const newTrip = result.trip;
            tripCache.set(newTrip._id, newTrip);
            setState((prev) => ({
                ...prev,
                trips: new Map(tripCache),
                isLoading: false,
            }));
            return newTrip;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fork trip";
            setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
            throw error;
        }
    }, []);

    return {
        ...state,
        createTrip,
        getTrip,
        updateTrip,
        deleteTrip,
        exploreTrips,
        shareTrip,
        forkTrip,
    };
}
