import React from "react";
import { TabsList, TabsTrigger } from "../ui/Tabs";

export default function DayTabs({ days }: { days: any[] }) {
    return (
        <TabsList className="flex w-full justify-start overflow-x-auto h-auto p-1 rounded-md border border-border bg-muted gap-2">
            {days.map((d, i) => (
                <TabsTrigger
                    key={d.date || i}
                    value={`day-${i}`}
                    className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                    Day {i + 1}
                </TabsTrigger>
            ))}
        </TabsList>
    );
}
