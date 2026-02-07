export function UserBadge({ badge }: { badge: { id: string, name: string, icon: string, dateEarned: string } }) {
    return (
        <div className="flex flex-col items-center justify-center p-2 bg-secondary/10 rounded-lg border border-secondary/20 tooltip-container group relative">
            <div className="text-2xl mb-1">{badge.icon}</div>
            <div className="text-xs font-medium text-center truncate w-full">{badge.name}</div>

            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                Earned: {new Date(badge.dateEarned).toLocaleDateString()}
            </div>
        </div>
    );
}
