import { useState, useEffect } from "react";
import { getUser } from "@/lib/users/users-api";
import { Trip } from "@/lib/trips/trips-api";

export interface TripMember {
    id: string;
    username: string;
    email?: string;
    name?: string;
}

export function useGetTripOwners(trip: Trip | null) {
    const [owner, setOwner] = useState<TripMember | null>(null);
    const [contributors, setContributors] = useState<TripMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!trip?.members) {
            setOwner(null);
            setContributors([]);
            return;
        }

        let isMounted = true;

        async function fetchMembers() {
            setIsLoading(true);
            try {
                const memberIds = trip!.members.map((id) => String(id));
                const uniqueIds = Array.from(new Set(memberIds));

                const users = await Promise.all(
                    uniqueIds.map(async (uid) => {
                        try {
                            const userData = await getUser(uid);
                            return {
                                id: userData.id || uid,
                                username: userData.username || "Traveler",
                                email: userData.email,
                                name: userData.username,
                            };
                        } catch (err) {
                            return { id: uid, username: "Unknown" };
                        }
                    })
                );

                if (!isMounted) return;

                const ownerId = memberIds[0];
                const primaryOwner = users.find((u) => u.id === ownerId) || null;
                const others = users.filter((u) => u.id !== ownerId);

                setOwner(primaryOwner);
                setContributors(others);
            } catch (error) {
                console.error("Error in useGetTripOwners:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchMembers();
        return () => { isMounted = false; };
    }, [trip]);

    return { owner, contributors, isLoading };
}