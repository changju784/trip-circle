import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RootRedirect() {
    const { user } = useAuth();

    if (user) return <Navigate to="dashboard" replace />;
    return <Navigate to="auth" replace />;
}
