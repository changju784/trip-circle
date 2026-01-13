import { Section } from "@/components/ui/Section";
import { Tabs, TabsContent } from "@/components/ui/Tabs";
import DayTabs from "@/components/trip/DayTabs";
import DayStopsPanel from "@/components/trip/DayStopsPanel";
import { Trip } from "@/lib/trips/trips-api";

interface Props {
    trip: Trip;
    isOwner: boolean;
    selectedDay: number;
    setSelectedDay: (idx: number) => void;
    onOpenAdd: (idx: number) => void;
    onEditStop: (sId: string) => void;
    onDeleteStop: (sId: string) => void;
    onReorderStops: (dayIdx: number, stops: any[]) => void;
}

export function TripItinerarySection({
    trip, isOwner, selectedDay, setSelectedDay, onOpenAdd, onEditStop, onDeleteStop, onReorderStops
}: Props) {
    return (
        <Section title="Itinerary">
            <Tabs value={`day-${selectedDay}`} onValueChange={(v) => setSelectedDay(Number(v.replace("day-", "")))} className="mb-4">
                <DayTabs days={trip.days} />
                {trip.days.map((d: any, i: number) => (
                    <TabsContent key={d.date || i} value={`day-${i}`}>
                        <DayStopsPanel
                            days={trip.days} selectedDay={i} isOwner={isOwner}
                            onOpenAdd={() => onOpenAdd(i)}
                            onEditStop={onEditStop}
                            onDeleteStop={onDeleteStop}
                            onReorderStops={onReorderStops}
                        />
                    </TabsContent>
                ))}
            </Tabs>
        </Section>
    );
}