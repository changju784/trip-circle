import { useAuth } from "../../auth/hook/use-auth";
import { Navigate } from "react-router-dom";
import { TripLoader } from "@/components/trip/TripLoader";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <TripLoader />;
    }

    return user ? children : <Navigate to="/trip-circle/auth" replace />;
}
