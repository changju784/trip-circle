import Navbar from "../../components/layout/Navbar";
import { Button } from "../../components/ui/Button";
import DashboardTabs from "./DashboardTabs";
import { useNavigate } from "react-router-dom";
import ExploreSection from "./ExploreSection";

export default function DashboardPage() {
    const navigate = useNavigate();

    const MyTripsSection = (
        <div className="bg-white rounded-xl p-20 text-center shadow-sm border space-y-4">
            <div className="text-primary/40 text-5xl">📍</div>
            <h2>No trips yet</h2>
            <p className="text-muted-foreground">Start planning your next adventure!</p>

            <div className="flex justify-center gap-3">
                <Button variant="primary" onClick={() => navigate("/trip-circle/trip/new")}>
                    Create Trip
                </Button>
            </div>
        </div>
    );


    return (
        <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
            <Navbar />

            <div className="max-w-screen-xl mx-auto px-6 py-10 space-y-6">

                <div className="flex items-center justify-between">
                    <DashboardTabs
                        mytrips={MyTripsSection}
                        explore={<ExploreSection/>}
                        onNewTrip={() => navigate("/trip-circle/trip/new")}
                    />
                </div>

            </div>
        </div>
    );
}
