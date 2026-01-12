import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface GlobalSearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function GlobalSearchBar({ value, onChange, placeholder = "Search destinations, trips..." }: GlobalSearchBarProps) {
    return (
        <div className="relative flex-1 max-w-md w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-white/40 z-10 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="
                    pl-12 pr-4 h-12 w-full rounded-full 
                    /* Light Mode styling */
                    border-2 border-zinc-200 bg-zinc-100 text-zinc-900
                    /* Dark Mode styling */
                    dark:border-white/10 dark:bg-zinc-900/50 dark:text-white
                    
                    backdrop-blur-md transition-all duration-300 outline-none
                    focus:border-blue-500/50 focus:bg-white dark:focus:bg-zinc-900/80
                    placeholder:text-zinc-400 dark:placeholder:text-white/40
                "
            />
        </div>
    );
}