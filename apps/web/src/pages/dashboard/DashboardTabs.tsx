import { Button } from "../..//components/ui/Button";
import { Tabs, TabsTrigger, TabsContent } from "../../components/ui/Tabs";

interface DashboardTabsProps {
    mytrips: React.ReactNode;
    explore: React.ReactNode;
    onNewTrip: () => void;
}

export default function DashboardTabs({ mytrips, explore, onNewTrip }: DashboardTabsProps) {
    return (
        <Tabs defaultValue="mytrips" className="w-full">

            <div className="flex items-center justify-between mb-8 w-full">

                <div className="grid grid-cols-2 bg-gray-100 rounded-full p-1 w-[260px]">
                    <TabsTrigger value="mytrips">My Trips</TabsTrigger>
                    <TabsTrigger value="explore">🧭 Explore</TabsTrigger>

                </div>

                <Button onClick={onNewTrip}>+ New Trip</Button>
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
