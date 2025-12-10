import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TripCircleLogo from "../TripCircleLogo";
import { useAuth } from "../../auth/hook/use-auth";
import { Button } from "../ui/Button";
import { Menu, X } from "lucide-react";

export default function Navbar({ showLinks = true }: { showLinks?: boolean }) {
    const navigate = useNavigate();
    const { user, logOut } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

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
        <nav className="w-full border-b border-slate-300">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

                {/* Left: Logo */}
                <Link to="/trip-circle/dashboard" className="flex items-center gap-2">
                    <TripCircleLogo size={30} />
                    <div className="leading-tight">
                        <h2 className="text-base font-semibold">TripCircle</h2>
                        <p className="text-xs text-muted-foreground">
                            Welcome, {displayName}
                        </p>
                    </div>
                </Link>

                {/* Desktop buttons */}
                {showLinks && (
                    <div className="hidden sm:flex items-center gap-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate("/trip-circle/profile")}
                        >
                            👤 Profile
                        </Button>

                        <Button variant="secondary" size="sm" onClick={handleLogout}>
                            🚪 Logout
                        </Button>
                    </div>
                )}

                {/* Mobile hamburger */}
                {showLinks && (
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="sm:hidden p-2 rounded-md hover:bg-slate-100"
                    >
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                )}
            </div>

            {/* Mobile menu dropdown */}
            {mobileOpen && showLinks && (
                <div className="sm:hidden border-t border-slate-200 bg-white p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                            setMobileOpen(false);
                            navigate("/trip-circle/profile");
                        }}
                    >
                        👤 Profile
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={handleLogout}
                    >
                        🚪 Logout
                    </Button>
                </div>
            )}
        </nav>
    );
}
