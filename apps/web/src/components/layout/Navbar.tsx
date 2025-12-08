import { Link, useNavigate } from "react-router-dom";
import TripCircleLogo from "../TripCircleLogo";
import { useAuth } from "../../auth/hook/use-auth";
import { Button } from "../ui/Button";

export default function Navbar({ showLinks = true }: { showLinks?: boolean }) {
    const navigate = useNavigate();
    const { user, logOut } = useAuth();

    const displayName = user?.name || user?.email || "Traveler";

    const handleLogout = async () => {
        try {
            await logOut();
            navigate("/trip-circle/auth");
        } catch (err) {
            console.error("Logout error", err);
        }
    };

    return (
        <nav className="w-full border-b border-slate-400">
            <div className="max-w-screen-xl mx-auto px-6 py-4 flex justify-between items-center">

                <div className="flex items-center gap-2">
                    <Link to="/trip-circle/dashboard" className="flex items-center gap-2">
                        <TripCircleLogo size={32} />
                        <div>
                            <h2 className="text-lg font-medium">TripCircle</h2>
                            <p className="text-sm text-muted-foreground">Welcome, {displayName}</p>
                        </div>
                    </Link>
                </div>

                {showLinks && (
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => navigate("/trip-circle/profile")}>
                            👤 Profile
                        </Button>

                        <Button variant="outline" onClick={handleLogout}>
                            🚪 Logout
                        </Button>
                    </div>
                )}

            </div>
        </nav>
    );
}