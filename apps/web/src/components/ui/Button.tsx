type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "primary" | "muted";
};

export function Button({ children, variant = "default", className = "", ...props }: Props) {
    const variants = {
        default: "bg-accent text-foreground hover:bg-accent/80",
        primary: "bg-primary text-primary-foreground hover:bg-primary/80",
        muted: "bg-muted text-muted-foreground hover:bg-muted/80",
    };

    return (
        <button
            {...props}
            className={`px-4 py-2 rounded-xl font-medium transition
        ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}
