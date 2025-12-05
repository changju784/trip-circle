import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTokenFromCallback } from "@/lib/auth/auth-api";
import { saveAuthState, BackendUser } from "@/lib/auth/use-backend-auth";

export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const token = getTokenFromCallback();

                if (!token) {
                    setError("No authentication token received");
                    setTimeout(() => navigate("/auth/login"), 2000);
                    return;
                }

                // Decode token to extract user info
                const parts = token.split(".");
                if (parts.length !== 3) {
                    setError("Invalid token format");
                    setTimeout(() => navigate("/auth/login"), 2000);
                    return;
                }

                const payload = JSON.parse(atob(parts[1]));

                // Construct user object from JWT payload
                const user: BackendUser = {
                    id: payload.userId,
                    email: payload.email,
                };

                // Save to localStorage and set API token
                saveAuthState(token, user);

                // Clear the token from URL
                window.history.replaceState({}, document.title, window.location.pathname);

                // Redirect to dashboard
                navigate("/trip-circle/dashboard");
            } catch (err) {
                const message = err instanceof Error ? err.message : "Authentication failed";
                setError(message);
                console.error("OAuth callback error:", err);
                setTimeout(() => navigate("/auth/login"), 2000);
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                {error ? (
                    <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm">
                        <div className="text-red-600 font-semibold mb-2">Authentication Error</div>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <p className="text-sm text-gray-500">Redirecting to login...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm">
                        <div className="inline-block animate-spin">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                        </div>
                        <p className="text-gray-600 mt-4">Completing authentication...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
