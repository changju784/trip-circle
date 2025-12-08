import React from "react";
import { TabsList, TabsTrigger } from "../ui/Tabs";

export default function DayTabs({ days }: { days: any[] }) {
    return (
        <TabsList className="flex w-full justify-start overflow-x-auto h-auto p-1 bg-gray-100 rounded-md">
            {days.map((d, i) => (
                <TabsTrigger
                    key={d.date || i}
                    value={`day-${i}`}
                    className="px-4 py-2"
                >
                    Day {i + 1}
                </TabsTrigger>
            ))}
        </TabsList>
    );
}