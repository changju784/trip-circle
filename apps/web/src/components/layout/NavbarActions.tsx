import { Button } from "../ui/Button";
import { Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hook/use-auth";
import { useDarkMode } from "./hooks/use-dark-mode";

interface NavbarActionsProps {
    mobile?: boolean;
    onItemClick?: () => void;
}

export function NavbarActions({ mobile = false, onItemClick }: NavbarActionsProps) {
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

    const handleProfile = () => {
        navigate("/trip-circle/profile");
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

            {/* Profile */}
            <Button
                variant="secondary"
                size={size}
                className={fullWidth}
                onClick={handleProfile}
            >
                👤 Profile
            </Button>

            {/* Logout */}
            <Button
                variant="secondary"
                size={size}
                className={fullWidth}
                onClick={handleLogout}
            >
                🚪 Logout
            </Button>
        </div>
    );
}
