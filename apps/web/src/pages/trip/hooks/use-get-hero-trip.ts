import { DayWithStops, Trip } from '@/lib/trips/trips-api';
import { useMemo } from 'react';

export const useGetHeroTrip = (trips: Trip[]) => {
    return useMemo(() => {
        if (!trips || trips.length === 0) return null;

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalize time for date comparisons

        // 1. Logic: Find the "Hero"
        // Priority: Currently happening > Closest upcoming > Most recently created
        const sorted = [...trips].sort((a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );

        const hero = sorted.find(t => new Date(t.endDate) >= now) || sorted[0];

        // 2. Calculate Days Until
        const startDate = new Date(hero.startDate);
        startDate.setHours(0, 0, 0, 0);

        const diffTime = startDate.getTime() - now.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // 3. Calculate Planning Progress
        // Based on your model: % of days that have at least one Stop category defined
        const totalDays = hero.days.length;
        const plannedDays = hero.days.filter((day: DayWithStops) =>
            day.stops && day.stops.length > 0
        ).length;

        // Bonus: Calculate "Stops Density" - average stops per day
        const totalStops = hero.days.reduce((acc, day) => acc + (day.stops?.length || 0), 0);

        const progress = totalDays > 0 ? Math.round((plannedDays / totalDays) * 100) : 0;

        return {
            ...hero,
            daysUntil: daysUntil > 0 ? daysUntil : 0,
            isLive: daysUntil <= 0 && new Date(hero.endDate) >= now,
            progress,
            totalStops,
            // Format destination string for the UI (e.g., "Paris, Rome")
            destinationSummary: hero.destinations.map(d => d.label).join(', ')
        };
    }, [trips]);
};