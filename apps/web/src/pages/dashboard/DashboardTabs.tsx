import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";

interface DashboardTabsProps {
    onNewTrip: () => void;
}

export default function DashboardTabs({ onNewTrip }: DashboardTabsProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const activeTab = location.pathname.endsWith("explore") ? "explore" : "mytrips";

    return (
        <Tabs value={activeTab} onValueChange={(val) => navigate(val === "explore" ? "explore" : "")} className="w-full">
            <div className="flex items-center justify-between mb-8 w-full">
                <TabsList className="w-[260px] grid grid-cols-2">
                    <TabsTrigger value="mytrips">My Trips</TabsTrigger>
                    <TabsTrigger value="explore">🧭 Explore</TabsTrigger>
                </TabsList>

                <Button variant="ghost" size="sm" onClick={onNewTrip} className="text-xs uppercase tracking-widest font-bold">
                    + New Trip
                </Button>
            </div>

            {/* Note: We removed TabsContent here because the content is now handled by the Outlet in the parent */}
        </Tabs>
    );
}