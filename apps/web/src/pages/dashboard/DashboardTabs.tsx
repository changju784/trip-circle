import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";

interface DashboardTabsProps {
    mytrips: React.ReactNode;
    explore: React.ReactNode;
    onNewTrip: () => void;
}

export default function DashboardTabs({ mytrips, explore, onNewTrip }: DashboardTabsProps) {
    return (
        <Tabs defaultValue="mytrips" className="w-full">

            <div className="flex items-center justify-between mb-8 w-full">

                <TabsList className="w-[260px] grid grid-cols-2">
                    <TabsTrigger value="mytrips">My Trips</TabsTrigger>
                    <TabsTrigger value="explore">🧭 Explore</TabsTrigger>
                </TabsList>

                <Button variant="ghost" size="sm" onClick={onNewTrip} className="text-xs uppercase tracking-widest font-bold">
                    + New Trip
                </Button>
            </div>

            <TabsContent value="mytrips">
                {mytrips}
            </TabsContent>

            <TabsContent value="explore">
                {explore}
            </TabsContent>
        </Tabs>
    );
}