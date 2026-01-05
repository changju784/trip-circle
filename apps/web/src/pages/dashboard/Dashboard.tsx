import { useNavigate, Outlet } from "react-router-dom";
import DashboardTabs from "./DashboardTabs";

export default function DashboardPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen">
            <div className="max-w-screen-xl mx-auto px-6 py-10 space-y-6">
                <DashboardTabs
                    onNewTrip={() => navigate("/trip-circle/trip/new")}
                />

                {/* This is where MyTripsSection or ExploreSection will appear */}
                <div className="mt-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}