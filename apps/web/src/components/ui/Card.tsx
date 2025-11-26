export function Card({ className = "", ...props }: any) {
    return (
        <div
            {...props}
            className={`
        bg-card text-card-foreground
        rounded-xl border border-border
        shadow-sm
        ${className}
      `}
        />
    );
}
