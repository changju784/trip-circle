import React, { createContext, useContext, useState } from "react";

/* ------------------------------
   Tabs Context
--------------------------------- */
const TabsContext = createContext<any>(null);

export function Tabs({ defaultValue, children, className = "" }: any) {
    const [active, setActive] = useState(defaultValue);

    return (
        <TabsContext.Provider value={{ active, setActive }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

export const useTabs = () => useContext(TabsContext);

/* ------------------------------
   Tabs Trigger
--------------------------------- */
export function TabsTrigger({ value, children, className = "" }: any) {
    const { active, setActive } = useTabs();
    const isActive = active === value;

    return (
        <button
            onClick={() => setActive(value)}
            className={`
                w-full py-2 rounded-full text-sm font-medium transition
                ${isActive ? "bg-white shadow text-primary" : "text-gray-500"}
                ${className}
            `}
        >
            {children}
        </button>
    );
}

/* ------------------------------
   Tabs Content
--------------------------------- */
export function TabsContent({ value, children, className = "" }: any) {
    const { active } = useTabs();

    if (value !== active) return null;

    return <div className={className}>{children}</div>;
}
