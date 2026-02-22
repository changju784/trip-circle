import { BackToDashboardButton } from "@/pages/dashboard/BackToDashboardButton";

export default function AuthLayout({ children }: any) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 text-foreground">
            <div className="w-full max-w-[420px]">
                <BackToDashboardButton />

                {children}
            </div>
        </div>
    );
}