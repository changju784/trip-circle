import { useAuth } from "@/auth/hook/use-auth";
import { BackToDashboardButton } from "@/pages/dashboard/BackToDashboardButton";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="min-h-screen">
            <main className="max-w-screen-md mx-auto p-6">
                <BackToDashboardButton />
                <div className="bg-card p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-medium mb-2">Profile</h2>
                    <p className="text-sm text-muted-foreground mb-4">Basic account information</p>

                    <div className="space-y-3">
                        <div>
                            <div className="text-xs text-muted-foreground">Username</div>
                            <div className="font-medium">{user.username || user.name || "-"}</div>
                        </div>

                        <div>
                            <div className="text-xs text-muted-foreground">Email</div>
                            <div className="font-medium">{user.email || "-"}</div>
                        </div>

                        <div>
                            <div className="text-xs text-muted-foreground">User ID</div>
                            <div className="font-medium break-all">{user.id}</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
