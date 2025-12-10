import { Outlet } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/ui/Footer";

export default function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Navbar />

            {/* Outlet renders the child route (Dashboard, Profile, etc.) */}
            <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}