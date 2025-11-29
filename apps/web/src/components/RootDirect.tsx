import { useAuth } from "../auth/hook/use-auth";
import { Navigate } from "react-router-dom";


export default function RootRedirect() {
    const { user } = useAuth();

    if (user) return <Navigate to="dashboard" replace />;
    return <Navigate to="auth" replace />;
}
