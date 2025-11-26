export default function TripCircleLogo({ size = 32 }: any) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-primary"
        >
            <path
                d="M2 12l20-8-8 20-2-6-6-2z"
                fill="currentColor"
            />
        </svg>
    );
}
