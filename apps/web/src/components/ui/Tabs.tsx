import React, { useState } from "react";

export function Tabs({ defaultValue, children }: any) {
    const [value, setValue] = useState(defaultValue);

    return (
        <div className="space-y-4">
            {React.Children.map(children, (child: any) =>
                React.cloneElement(child, { value, setValue })
            )}
        </div>
    );
}

export function TabTrigger({ value, setValue, children, className = "", ...props }: any) {
    const active = props.value === value;
    return (
        <button
            onClick={() => setValue(props.value)}
            className={`
        text-sm py-2 transition rounded-xl
        ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}
        ${className}
      `}
        >
            {children}
        </button>
    );
}

export function TabContent({ children, value, setValue, ...props }: any) {
    if (props.value !== value) return null;
    return <div>{children}</div>;
}
