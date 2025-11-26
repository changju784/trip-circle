import TripCircleLogo from "../TripCircleLogo";
import { Button } from "../ui/Button";

export default function Navbar() {
    return (
        <nav className="w-full border-b border-border bg-background">
            <div className="max-w-screen-xl mx-auto px-6 py-4 flex justify-between items-center">

                <div className="flex items-center gap-2">
                    <TripCircleLogo size={32} />
                    <h1 className="font-medium text-lg">TripCircle</h1>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="muted">Profile</Button>
                    <Button variant="muted">Logout</Button>
                </div>

            </div>
        </nav>
    );
}
