import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export type Option = { id: string; label: string };

type SelectProps = {
    value?: Option | Option[] | null;
    multiple?: boolean;
    maxSelection?: number;
    placeholder?: string;
    onChange?: (v: Option | Option[] | null) => void;
    fetchOptions?: (q: string) => Promise<Option[]>;
};

// 1. Expanded Color Palette
const TAG_COLORS = [
    "bg-red-200 text-red-800 hover:bg-red-300",
    "bg-orange-200 text-orange-800 hover:bg-orange-300",
    "bg-amber-200 text-amber-800 hover:bg-amber-300",
    "bg-lime-200 text-lime-800 hover:bg-lime-300",
    "bg-green-200 text-green-800 hover:bg-green-300",
    "bg-emerald-200 text-emerald-800 hover:bg-emerald-300",
    "bg-teal-200 text-teal-800 hover:bg-teal-300",
    "bg-cyan-200 text-cyan-800 hover:bg-cyan-300",
    "bg-sky-200 text-sky-800 hover:bg-sky-300",
    "bg-blue-200 text-blue-800 hover:bg-blue-300",
    "bg-indigo-200 text-indigo-800 hover:bg-indigo-300",
    "bg-violet-200 text-violet-800 hover:bg-violet-300",
    "bg-purple-200 text-purple-800 hover:bg-purple-300",
    "bg-fuchsia-200 text-fuchsia-800 hover:bg-fuchsia-300",
    "bg-pink-200 text-pink-800 hover:bg-pink-300",
    "bg-rose-200 text-rose-800 hover:bg-rose-300",
];

function getColor(index: number) {
    return TAG_COLORS[index % TAG_COLORS.length];
}

export default function Select({
    value,
    multiple = false,
    placeholder = "Select...",
    onChange,
    fetchOptions,
    maxSelection,
}: SelectProps) {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<Option[]>([]);
    const [query, setQuery] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    // Handle Async Search
    React.useEffect(() => {
        let mounted = true;
        if (!fetchOptions) return;

        setLoading(true);
        fetchOptions(query).then((res) => {
            if (mounted) {
                setOptions(res);
                setLoading(false);
            }
        });

        return () => { mounted = false; };
    }, [query, fetchOptions]);

    // Handle Selection Logic
    const handleSelect = (option: Option) => {
        if (multiple) {
            const current = Array.isArray(value) ? value : [];
            const exists = current.find((v) => v.id === option.id);

            if (exists) {
                // Remove if exists
                onChange?.(current.filter((v) => v.id !== option.id));
            } else {
                // Add if limit not reached
                if (maxSelection && current.length >= maxSelection) return;
                onChange?.([...current, option]);
            }
        } else {
            // Single select
            onChange?.(option);
            setOpen(false);
        }
    };

    // Remove Tag Helper
    const removeTag = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!multiple || !Array.isArray(value)) return;
        onChange?.(value.filter((v) => v.id !== id));
    };

    // Helper to normalize value to array for display
    const selected = Array.isArray(value) ? value : value ? [value] : [];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto min-h-[40px] px-3 py-2 bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                >
                    <div className="flex flex-wrap gap-1 items-center text-left">
                        {selected.length > 0 ? (
                            multiple ? (
                                selected.map((v, index) => (
                                    <Badge
                                        key={v.id}
                                        variant="secondary"
                                        className={cn("pr-1 font-normal", getColor(index))}
                                    >
                                        {v.label}
                                        <div
                                            role="button"
                                            className="ml-1 hover:text-red-900 rounded-full p-0.5 cursor-pointer"
                                            onClick={(e) => removeTag(e, v.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </div>
                                    </Badge>
                                ))
                            ) : (
                                // Single Value Display
                                <span className="font-normal text-gray-900">{selected[0].label}</span>
                            )
                        ) : (
                            // Placeholder
                            <span className="text-gray-500 font-normal">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-gray-500" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border-gray-300" align="start">
                <Command className="bg-white">
                    <CommandInput
                        placeholder="Search..."
                        onValueChange={setQuery}
                        value={query}
                        className="text-gray-900 placeholder:text-gray-500"
                    />

                    <CommandList>
                        {loading && <div className="p-2 text-sm text-gray-500 text-center">Loading...</div>}

                        {!loading && options.length === 0 && (
                            <CommandEmpty className="py-6 text-center text-sm text-gray-500">No results found.</CommandEmpty>
                        )}

                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selected.some((s) => s.id === option.id);
                                return (
                                    <CommandItem
                                        key={option.id}
                                        value={option.label}
                                        onSelect={() => handleSelect(option)}
                                        className="text-gray-900 aria-selected:bg-gray-100 aria-selected:text-gray-900 cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 text-gray-900",
                                                isSelected ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {option.label}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}