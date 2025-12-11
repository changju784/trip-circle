import { useCallback, useEffect, useState } from "react";

export function useDarkMode() {
    const savedPref = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const mediaPref = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : false;

    const [userPreference, setUserPreference] = useState<"dark" | "light" | null>(
        savedPref === "dark" || savedPref === "light" ? (savedPref as "dark" | "light") : null
    );
    const [isDark, setIsDark] = useState(() => {
        if (userPreference) return userPreference === "dark";
        return document.documentElement.classList.contains("dark") || mediaPref;
    });

    // Apply theme + persist explicit user choice
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        if (userPreference) {
            localStorage.setItem("theme", userPreference);
        }
    }, [isDark, userPreference]);

    // Keep in sync with system preference when no explicit user choice exists
    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        if (userPreference) return;

        const handler = (event: MediaQueryListEvent) => setIsDark(event.matches);
        setIsDark(media.matches);
        media.addEventListener("change", handler);
        return () => media.removeEventListener("change", handler);
    }, [userPreference]);

    const setTheme = useCallback((value: boolean) => {
        setIsDark(value);
        setUserPreference(value ? "dark" : "light");
    }, []);

    return { isDark, setIsDark: setTheme };
}
