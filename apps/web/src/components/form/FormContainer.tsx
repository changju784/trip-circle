export default function FormContainer({ title, subtitle, children }: any) {
    return (
        <div className="space-y-6">
            {(title || subtitle) && (
                <div className="text-center space-y-1">
                    {title && <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>}
                    {subtitle && <p className="text-muted-foreground text-sm dark:text-gray-300">{subtitle}</p>}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                {children}
            </div>
        </div>
    );
}
