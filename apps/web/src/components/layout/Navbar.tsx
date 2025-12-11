import { useState } from "react";
import { Link } from "react-router-dom";
import TripCircleLogo from "../TripCircleLogo";
import { useAuth } from "../../auth/hook/use-auth";
import { Menu, X } from "lucide-react";
import { NavbarActions } from "./NavbarActions";
import { Avatar } from "../ui/Avatar";

export default function Navbar({ showLinks = true }: { showLinks?: boolean }) {
    const { user } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const displayName = user?.name || user?.email || "Traveler";

    return (
        <nav className="w-full border-b border-slate-300 bg-background/70 backdrop-blur-md">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

                {/* Logo */}
                <Link to="/trip-circle/dashboard" className="flex items-center gap-2">
                    <TripCircleLogo size={30} />
                    <div className="leading-tight">
                        <h2 className="text-base font-semibold">TripCircle</h2>
                        <p className="text-xs text-muted-foreground">
                            Welcome, {displayName}
                        </p>
                    </div>
                </Link>

                {user && (
                    <div className="hidden sm:flex items-center gap-2">
                        <Avatar user={{ id: user.id, username: user.username, email: user.email, name: user.name }} size={36} />
                        <div className="text-sm text-muted-foreground hidden md:block">
                            {user.username || user.name || user.email}
                        </div>
                    </div>
                )}

                {/* Desktop Actions */}
                {showLinks && (
                    <div className="hidden sm:flex">
                        <NavbarActions />
                    </div>
                )}

                {/* Hamburger */}
                {showLinks && (
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="sm:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                )}
            </div>

            {/* Mobile Dropdown */}
            {mobileOpen && showLinks && (
                <div className="sm:hidden border-t border-slate-200 bg-background p-4 animate-in fade-in slide-in-from-top-2">
                    <NavbarActions mobile onItemClick={() => setMobileOpen(false)} />
                </div>
            )}
        </nav>
    );
}
