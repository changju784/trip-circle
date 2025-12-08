const SPLASH_ACCESS_KEY = process.env.REACT_APP_SPLASH_ACCESS_KEY;

export async function fetchSplashImage(query: string): Promise<string | null> {
    if (!SPLASH_ACCESS_KEY) {
        console.warn("Missing REACT_APP_SPLASH_ACCESS_KEY");
        return null;
    }

    try {
        const url = new URL("https://api.unsplash.com/search/photos");
        url.searchParams.set("query", query);
        url.searchParams.set("per_page", "1");

        const res = await fetch(url.toString(), {
            headers: {
                Authorization: `Client-ID ${SPLASH_ACCESS_KEY}`,
            },
        });

        if (!res.ok) return null;

        const json = await res.json();
        return json.results?.[0]?.urls?.regular ?? null;
    } catch (err) {
        console.error("Splash fetch error:", err);
        return null;
    }
}
