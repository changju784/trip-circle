import Navbar from "./../../components/layout/Navbar";
import { Button } from "./../../components/ui/Button";

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="max-w-screen-xl mx-auto px-6 py-10 space-y-6">

                {/* Tabs */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-lg bg-secondary text-foreground">
                            My Trips
                        </button>
                        <button className="px-4 py-2 rounded-lg text-muted-foreground">
                            Explore
                        </button>
                    </div>

                    <Button variant="primary">+ New Trip</Button>
                </div>

                {/* Empty State */}
                <div className="bg-card rounded-xl p-20 text-center shadow-sm border space-y-4">
                    <div className="text-primary/40 text-5xl">📍</div>

                    <h2>No trips yet</h2>
                    <p className="text-muted-foreground">Start planning your next adventure!</p>

                    <Button variant="primary">
                        + Create Your First Trip
                    </Button>
                </div>
            </div>
        </div>
    );
}
