export default function FormContainer({ title, subtitle, children }: any) {
    return (
        <div className="min-h-screen bg-background flex justify-center items-center px-4">
            <div className="w-full max-w-md space-y-8">

                {(title || subtitle) && (
                    <div className="text-center space-y-2">
                        {title && <h2>{title}</h2>}
                        {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
                    </div>
                )}

                <div className="bg-card rounded-xl shadow-sm border p-8 space-y-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
