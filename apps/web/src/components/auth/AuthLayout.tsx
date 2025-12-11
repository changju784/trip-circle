export default function AuthLayout({ children }: any) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 text-foreground">
            {children}
        </div>
    );
}
