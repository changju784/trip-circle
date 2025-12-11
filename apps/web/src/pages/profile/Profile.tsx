import { useAuth } from "@/auth/hook/use-auth";
import { BackToDashboardButton } from "@/pages/dashboard/BackToDashboardButton";
import { Avatar } from "@/components/ui/Avatar";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="min-h-screen">
            <main className="max-w-screen-md mx-auto p-6">
                <BackToDashboardButton />
                <div className="bg-card p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-4 mb-4">
                        <Avatar user={{ id: user.id, username: user.username, email: user.email, name: user.name }} size={72} />
                        <div>
                            <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">Profile</h2>
                            <p className="text-sm text-muted-foreground">Basic account information</p>
                        </div>
                    </div>

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
