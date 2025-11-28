import React from "react";
import { Tabs, TabsTrigger } from "../ui/Tabs";

export default function DayTabs({ days, selectedDay, onSelectDay, onOpenAdd }) {
    return (
        <Tabs defaultValue={`day-${selectedDay}`} className="mb-4">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
                {days.map((day, i) => (
                    <TabsTrigger
                        key={day.date}
                        value={`day-${i}`}
                        className="px-3"
                        onClick={() => onSelectDay(i)}
                    >
                        Day {i + 1}
                    </TabsTrigger>
                ))}
            </div>
        </Tabs>
    );
}
