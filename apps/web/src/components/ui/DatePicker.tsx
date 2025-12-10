"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "./Button"

interface DatePickerProps {
    value?: Date;
    onChange?: (date?: Date) => void;
    placeholder?: string;
    minDate?: Date;
    maxDate?: Date;
    disabled?: boolean;
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    minDate,
    maxDate,
    disabled
}: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    disabled={disabled}
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal bg-white text-gray-900 border-gray-300",
                        "flex-nowrap overflow-hidden whitespace-nowrap",
                        "text-ellipsis",
                        "pr-8",
                        !value && "text-gray-500"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    {value ? format(value, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-gray-200" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={onChange}
                    disabled={(date) => {
                        if (minDate && date < minDate) return true;
                        if (maxDate && date > maxDate) return true;
                        return false;
                    }}
                    initialFocus
                    className="bg-white text-gray-900 rounded-md border"
                />
            </PopoverContent>
        </Popover>
    )
}