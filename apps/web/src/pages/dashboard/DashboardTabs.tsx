import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Compass, Plane, Plus } from "lucide-react";

interface DashboardTabsProps {
    onNewTrip: () => void;
}

export default function DashboardTabs({ onNewTrip }: DashboardTabsProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const activeTab = location.pathname.endsWith("explore") ? "explore" : "mytrips";

    return (
        <Tabs
            value={activeTab}
            onValueChange={(val) => navigate(val === "explore" ? "explore" : "")}
            className="w-full"
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 w-full gap-4">

                <TabsList className="bg-muted/30 p-1 h-12 rounded-full border border-border/50 backdrop-blur-sm">
                    <TabsTrigger
                        value="mytrips"
                        className="rounded-full px-6 h-full transition-all duration-200
                       data-[state=active]:bg-background 
                       data-[state=active]:text-foreground 
                       data-[state=active]:shadow-md
                       flex gap-2 items-center"
                    >
                        <Plane
                            size={18}
                            className={activeTab === "mytrips" ? "text-blue-500" : "text-muted-foreground"}
                        />
                        <span className="font-bold tracking-tight">My Trips</span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="explore"
                        className="rounded-full px-6 h-full transition-all duration-200
                       data-[state=active]:bg-background 
                       data-[state=active]:text-foreground 
                       data-[state=active]:shadow-md
                       flex gap-2 items-center"
                    >
                        <Compass
                            size={18}
                            className={activeTab === "explore" ? "text-blue-500" : "text-muted-foreground"}
                        />
                        <span className="font-bold tracking-tight">Explore</span>
                    </TabsTrigger>
                </TabsList>

                <Button
                    variant="ghost"
                    size={'sm'}
                    onClick={onNewTrip}
                    className="rounded-full px-6 h-12 shadow-lg hover:shadow-blue-500/20 transition-all font-black uppercase text-[10px] tracking-[0.15em]"
                >
                    <Plus className="mr-2 h-4 w-4 stroke-[3]" /> New Trip
                </Button>
            </div>
        </Tabs>
    );
}