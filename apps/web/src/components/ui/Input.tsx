export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={`
        w-full px-4 py-2 rounded-lg
        bg-input-background
        border border-border
        focus:ring-2 focus:ring-ring
        outline-none
        ${className}
      `}
        />
    );
}
