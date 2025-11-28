import React from "react";
import { TabsTrigger } from "../../components/ui/Tabs";

export default function DayTabs({ days }) {
    return (
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
            {days.map((d, i) => (
                <TabsTrigger
                    key={d.date}
                    value={`day-${i}`}
                    className="px-3"
                >
                    Day {i + 1}
                </TabsTrigger>
            ))}
        </div>
    );
}
