import { useNavigate } from "react-router-dom";
import DashboardTabs from "./DashboardTabs";
import MyTripsSection from "./MyTripsSection";
import ExploreSection from "./ExploreSection";

export default function DashboardPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen">

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
