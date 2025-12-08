export default function Footer() {
    return (
        <footer className="w-full bg-transparent py-6 mt-auto">
            <div className="text-center text-sm text-muted-foreground">
                <p>
                    &copy; {new Date().getFullYear()} All copyrights to TripCircle team
                </p>
            </div>
        </footer>
    );
}