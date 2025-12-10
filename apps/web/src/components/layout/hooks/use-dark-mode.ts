import { useEffect, useState } from "react";

export function useDarkMode() {
    const [isDark, setIsDark] = useState(() =>
        document.documentElement.classList.contains("dark")
    );

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDark]);

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        if (saved === "dark") setIsDark(true);
    }, []);

    return { isDark, setIsDark };
}
