import { useNavigate } from "react-router-dom";
import DashboardTabs from "./DashboardTabs";
import MyTripsSection from "./MyTripsSection";
import ExploreSection from "./ExploreSection";
import Navbar from "@/components/layout/Navbar";

export default function DashboardPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="max-w-screen-xl mx-auto px-6 py-10 space-y-6">
                <DashboardTabs
                    mytrips={<MyTripsSection />}
                    explore={<ExploreSection />}
                    onNewTrip={() => navigate("/trip-circle/trip/new")}
                />
            </div>
        </div>
    );
}
