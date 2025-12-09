import { useAuth } from "../../auth/hook/use-auth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();
    
    // Wait for auth to finish loading before redirecting
    if (loading) {
        return <div>Loading...</div>;
    }
    
    return user ? children : <Navigate to="/trip-circle/auth" replace />;
}
