import { useEffect, useState } from "react";

export function useGetUsernameById(userId?: string | null) {
    const [name, setName] = useState<string>("Loading...");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        let cancelled = false;

        async function fetchUser() {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`/api/users/${userId}`);
                const data = await res.json();

                if (!cancelled) {
                    setName(data.username || data.email || "Unknown User");
                }
            } catch {
                if (!cancelled) {
                    setError("Failed to load user");
                    setName("Unknown User");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchUser();

        return () => { cancelled = true; };
    }, [userId]);

    return { name, loading, error };
}
