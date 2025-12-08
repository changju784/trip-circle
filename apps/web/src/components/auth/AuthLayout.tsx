export default function AuthLayout({ children }: any) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {children}
        </div>
    );
}