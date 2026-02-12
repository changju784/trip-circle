import { Button } from "../ui/Button";
import { Sun, Moon, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hook/use-auth";
import { useDarkMode } from "./hooks/use-dark-mode";
import { BackendUser } from "@/lib/auth/use-backend-auth";

interface NavbarActionsProps {
    mobile?: boolean;
    user?: BackendUser | null;
    onItemClick?: () => void;
}

export function NavbarActions({ mobile = false, user, onItemClick }: NavbarActionsProps) {
    const navigate = useNavigate();
    const { logOut } = useAuth();
    const { isDark, setIsDark } = useDarkMode();

    const handleLogout = async () => {
        try {
            await logOut();
            navigate("/trip-circle/auth");
            onItemClick?.();
        } catch (err) {
            console.error("Logout error", err);
        }
    };

    const handleAuthAction = () => {
        if (user) {
            navigate("/trip-circle/profile");
        } else {
            navigate("/trip-circle/auth");
        }
        onItemClick?.();
    };

    const toggleTheme = () => setIsDark(!isDark);

    const size = mobile ? "sm" : "sm";
    const fullWidth = mobile ? "w-full" : "";

    return (
        <div className={`flex ${mobile ? "flex-col space-y-3" : "items-center gap-3"}`}>

            {/* Dark Mode Toggle */}
            <Button
                variant="ghost"
                size={mobile ? "default" : "icon"}
                className={`${fullWidth} flex items-center justify-center`}
                onClick={toggleTheme}
            >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                {mobile && <span className="ml-2">{isDark ? "Light Mode" : "Dark Mode"}</span>}
            </Button>

            {/* Primary Action: Profile or Sign In */}
            <Button
                variant="secondary"
                size={size}
                className={`${fullWidth} rounded-full flex items-center justify-start gap-3 px-6 hover:bg-secondary/80 transition-all font-semibold`}
                onClick={handleAuthAction}
            >
                <User size={18} className="text-blue-500" />
                <span>{user ? "Profile" : "Sign In"}</span>
            </Button>

            {user && (
                <Button
                    variant="ghost"
                    size={size}
                    className={`${fullWidth} rounded-full flex items-center justify-start gap-3 px-6 hover:bg-destructive/10 hover:text-destructive transition-all font-semibold`}
                    onClick={handleLogout}
                >
                    <LogOut size={18} className="text-muted-foreground group-hover:text-destructive" />
                    <span>Logout</span>
                </Button>
            )}
        </div>
    );
}