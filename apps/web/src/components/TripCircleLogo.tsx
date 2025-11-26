type TripCircleLogoProps = {
    size?: number;
    color?: string;
};

export default function TripCircleLogo({
    size = 32,
    color = "#2563EB",
}: TripCircleLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
        >
            <path
                d="M18 50 A20 20 0 1 1 46 18"
                stroke={color}
                strokeWidth={2.4}
                strokeLinecap="round"
                fill="none"
            />
            <circle cx="18" cy="50" r="3" fill={color} />
            <g transform="translate(32 30) rotate(-25) translate(-32 -30)">
                <rect x="30" y="12" width="4" height="20" rx={1.3} fill={color} />
                <path d="M32 6 L37 12 H27 Z" fill={color} />
                <path d="M20 20 L44 20 L38 27 H26 Z" fill={color} />
                <path d="M28 32 L36 32 L34 40 H30 Z" fill={color} />
            </g>
        </svg>
    );
}
