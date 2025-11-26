export default function FormContainer({ title, subtitle, children }: any) {
    return (
        <div className="space-y-6">
            {(title || subtitle) && (
                <div className="text-center space-y-1">
                    {title && <h2 className="text-xl font-semibold">{title}</h2>}
                    {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                {children}
            </div>
        </div>
    );
}
