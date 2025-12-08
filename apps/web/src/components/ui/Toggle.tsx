"use client"

import * as React from "react"
import { Switch } from "@/components/ui/switch"

type ToggleProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
};

export function Toggle({ checked, onChange }: ToggleProps) {
    return (
        <Switch
            checked={checked}
            onCheckedChange={onChange}
        />
    );
}