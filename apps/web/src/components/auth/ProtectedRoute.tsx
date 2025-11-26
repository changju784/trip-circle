import { useAuth } from "../../auth/hook/use-auth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/trip-circle/login" replace />;
}
