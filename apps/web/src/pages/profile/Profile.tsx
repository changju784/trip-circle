import React from "react";
import { useAuth } from "@/auth/hook/use-auth";
import Navbar from "@/components/layout/Navbar";
import { BackToDashboardButton } from "@/pages/dashboard/BackToDashboardButton";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div style={{ minHeight: "100vh", background: "#eaf6ff" }}>
            <Navbar />
            <main className="max-w-screen-md mx-auto p-6">
                <BackToDashboardButton />
                <div className="bg-card p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-medium mb-2">Profile</h2>
                    <p className="text-sm text-muted-foreground mb-4">Basic account information</p>

                    <div className="space-y-3">
                        <div>
                            <div className="text-xs text-muted-foreground">Name</div>
                            <div className="font-medium">{user.displayName || "-"}</div>
                        </div>

                        <div>
                            <div className="text-xs text-muted-foreground">Email</div>
                            <div className="font-medium">{user.email || "-"}</div>
                        </div>

                        <div>
                            <div className="text-xs text-muted-foreground">UID</div>
                            <div className="font-medium break-all">{user.uid}</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
