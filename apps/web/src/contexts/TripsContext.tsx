import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Trip, CreateTripInput, TripDocument } from "@/lib/trips/trips-api";
import { useTrips as useTripsApi } from "@/lib/trips/use-trips";
import { useAuth } from "@/auth/hook/use-auth";

interface TripsContextValue {
    userTrips: Trip[];
    isLoading: boolean;
    error: string | null;
    refreshUserTrips: () => Promise<void>;
    createTrip: (input: CreateTripInput) => Promise<Trip>;
    updateTrip: (tripId: string, updates: Partial<CreateTripInput>) => Promise<Trip>;
    deleteTrip: (tripId: string) => Promise<void>;
    forkTrip: (
        tripId: string,
        userId: string,
        payload?: {
            startDate: string;
            endDate: string;
            decisions: Record<string, string | "delete">
        }
    ) => Promise<Trip>;
    uploadDocument: (tripId: string, file: File) => Promise<Trip>;
    deleteDocument: (tripId: string, documentId: string) => Promise<Trip>;
    parseDocument: (tripId: string, documentId: string) => Promise<TripDocument>;
}

const TripsContext = createContext<TripsContextValue | undefined>(undefined);

export function TripsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const tripsApi = useTripsApi();

    const [userTrips, setUserTrips] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch user's trips from backend
    const refreshUserTrips = useCallback(async () => {
        if (!user?.id) {
            setUserTrips([]);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Fetch trips via backend API
            const response = await fetch(
                `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/users/${user.id}/trips`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("backendToken")}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch trips");
            }

            const trips = await response.json();
            setUserTrips(trips);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load trips";
            setError(message);
            console.error("Error loading user trips:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    // Load trips when user changes
    useEffect(() => {
        refreshUserTrips();
    }, [refreshUserTrips]);

    // Create trip and refresh list
    const createTrip = useCallback(
        async (input: CreateTripInput): Promise<Trip> => {
            const trip = await tripsApi.createTrip(input);
            await refreshUserTrips(); // Refresh to get updated list
            return trip;
        },
        [tripsApi, refreshUserTrips]
    );

    // Update trip and refresh list
    const updateTrip = useCallback(
        async (tripId: string, updates: Partial<CreateTripInput>): Promise<Trip> => {
            const trip = await tripsApi.updateTrip(tripId, updates);
            await refreshUserTrips(); // Refresh to get updated list
            return trip;
        },
        [tripsApi, refreshUserTrips]
    );

    // Delete trip and refresh list
    const deleteTrip = useCallback(
        async (tripId: string): Promise<void> => {
            await tripsApi.deleteTrip(tripId);
            await refreshUserTrips(); // Refresh to get updated list
        },
        [tripsApi, refreshUserTrips]
    );

    // Fork trip and refresh list
    const forkTrip = useCallback(
        async (tripId: string, userId: string, payload?: any): Promise<Trip> => {
            const trip = await tripsApi.forkTrip(tripId, userId, payload); //
            await refreshUserTrips();
            return trip;
        },
        [tripsApi, refreshUserTrips]
    );

    const uploadDocument = useCallback(async (tripId: string, file: File) => {
        const trip = await tripsApi.uploadDocument(tripId, file);
        await refreshUserTrips();
        return trip;
    }, [tripsApi, refreshUserTrips]);

    const deleteDocument = useCallback(async (tripId: string, documentId: string) => {
        const trip = await tripsApi.deleteDocument(tripId, documentId);
        await refreshUserTrips();
        return trip;
    }, [tripsApi, refreshUserTrips]);

    const parseDocument = useCallback(async (tripId: string, documentId: string) => {
        const doc = await tripsApi.parseDocument(tripId, documentId);
        await refreshUserTrips(); // Refresh to sync 'parsed' status globally
        return doc;
    }, [tripsApi, refreshUserTrips]);

    return (
        <TripsContext.Provider
            value={{
                userTrips,
                isLoading,
                error,
                refreshUserTrips,
                createTrip,
                updateTrip,
                deleteTrip,
                forkTrip,
                uploadDocument,
                deleteDocument,
                parseDocument,
            }}
        >
            {children}
        </TripsContext.Provider>
    );
}

export function useTripsContext() {
    const context = useContext(TripsContext);
    if (context === undefined) {
        throw new Error("useTripsContext must be used within a TripsProvider");
    }
    return context;
}
