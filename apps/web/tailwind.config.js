/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],

    theme: {
        extend: {
            fontFamily: {
                sans: ["Nunito", "sans-serif"],
            },

            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",

                card: "var(--card)",
                "card-foreground": "var(--card-foreground)",

                popover: "var(--popover)",
                "popover-foreground": "var(--popover-foreground)",

                primary: "var(--primary)",
                "primary-foreground": "var(--primary-foreground)",

                secondary: "var(--secondary)",
                "secondary-foreground": "var(--secondary-foreground)",

                muted: "var(--muted)",
                "muted-foreground": "var(--muted-foreground)",

                accent: "var(--accent)",
                "accent-foreground": "var(--accent-foreground)",

                destructive: "var(--destructive)",
                "destructive-foreground": "var(--destructive-foreground)",

                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
            },

            borderRadius: {
                sm: "var(--radius-sm)",
                md: "var(--radius-md)",
                lg: "var(--radius-lg)",
                xl: "var(--radius-xl)",
            },
        },
    },

    plugins: [],
};