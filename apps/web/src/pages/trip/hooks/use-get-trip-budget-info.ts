import { useMemo } from "react";

export function useGetTripBudgetInfo(trip: any) {

    const budgetInfo = useMemo(() => {
        if (!trip) return null;
        const total = trip.totalPrice || 0;
        const limit = trip.budget || 0;
        const remaining = limit - total;
        const percentUsed = limit > 0 ? Math.min((total / limit) * 100, 100) : 0;
        const isOverBudget = remaining < 0;

        return { total, limit, remaining, percentUsed, isOverBudget };
    }, [trip]);

    return budgetInfo;
}
