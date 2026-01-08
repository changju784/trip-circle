import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { Compass, Plane, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardTabsProps {
    onNewTrip: () => void;
}

export default function DashboardTabs({ onNewTrip }: DashboardTabsProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Internal state to keep the input feeling snappy
    const [localQuery, setLocalQuery] = useState(searchParams.get("q") || "");

    const activeTab = location.pathname.endsWith("explore") ? "explore" : "mytrips";

    const handleSearch = (val: string) => {
        setLocalQuery(val);
        if (val) {
            // If user types, force them to explore page to show results
            navigate(`explore?q=${encodeURIComponent(val)}`, { replace: true });
        } else {
            setSearchParams({});
        }
    };

    return (
        <div className="flex flex-col gap-6 mb-8 w-full">
            <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">

                {/* 1. Tabs Toggle */}
                <Tabs
                    value={activeTab}
                    onValueChange={(val) => navigate(val === "explore" ? "explore" : "")}
                    className="w-auto"
                >
                    <TabsList className="bg-muted/30 p-1 h-12 rounded-full border border-border/50 backdrop-blur-sm">
                        <TabsTrigger value="mytrips" className="rounded-full px-6 h-full flex gap-2 items-center font-bold">
                            <Plane size={18} className={activeTab === "mytrips" ? "text-blue-500" : "text-muted-foreground"} />
                            <span>My Trips</span>
                        </TabsTrigger>
                        <TabsTrigger value="explore" className="rounded-full px-6 h-full flex gap-2 items-center font-bold">
                            <Compass size={18} className={activeTab === "explore" ? "text-blue-500" : "text-muted-foreground"} />
                            <span>Explore</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* 2. Search Bar */}
                {/* 2. New Roundy Search Bar */}
                <div className="relative flex-1 max-w-md w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 z-10 group-focus-within:text-blue-500 transition-colors pointer-events-none" />

                    <Input
                        placeholder="Search destinations, trips..."
                        value={localQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="
            pl-12 pr-4 h-12 w-full rounded-full 
            border-2 border-white/10 bg-zinc-900/50 backdrop-blur-md 
            focus:bg-zinc-900/80 focus:border-blue-500/50 
            transition-all duration-300 text-white 
            placeholder:text-white/40 outline-none
        "
                    />
                </div>

                {/* 3. Action Button */}
                <Button
                    variant="ghost"
                    size={'sm'}
                    onClick={onNewTrip}
                    className="rounded-full px-6 h-12 shadow-lg hover:shadow-blue-500/20 transition-all font-black uppercase text-[10px] tracking-[0.15em] bg-background/50 border border-border/50"
                >
                    <Plus className="mr-2 h-4 w-4 stroke-[3]" /> New Trip
                </Button>
            </div>
        </div>
    );
}