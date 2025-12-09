import { useAuth } from "../auth/hook/use-auth";
import { Navigate } from "react-router-dom";


export default function RootRedirect() {
    const { user } = useAuth();

    // If user exists but hasn't set a username yet, send to username setup
    if (user && (user.username === null || user.username === undefined)) {
        return <Navigate to="setup-username" replace />;
    }

    if (user) return <Navigate to="dashboard" replace />;
    return <Navigate to="auth" replace />;
}
