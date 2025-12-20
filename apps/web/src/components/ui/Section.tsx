import { ReactNode } from "react";

interface SectionProps {
    title?: string;
    icon?: ReactNode;
    children: ReactNode;
    rightElement?: ReactNode;
    className?: string;
}

export function Section({ title, icon, children, rightElement, className = "" }: SectionProps) {
    return (
        <section className={`w-full mt-8 ${className}`}>
            {(title || rightElement) && (
                <div className="flex items-center justify-between mb-4">
                    {title && (
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            {icon}
                            {title}
                        </h2>
                    )}
                    {rightElement}
                </div>
            )}
            {children}
        </section>
    );
}