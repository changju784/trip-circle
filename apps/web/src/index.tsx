import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.scss";
import "leaflet/dist/leaflet.css";

// Ensure the initial theme follows saved preference or system before React mounts
const applyInitialTheme = () => {
    if (typeof window === "undefined") return;
    try {
        const saved = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const shouldUseDark = saved ? saved === "dark" : prefersDark;
        document.documentElement.classList.toggle("dark", shouldUseDark);
    } catch (err) {
        console.warn("Theme init failed", err);
    }
};

applyInitialTheme();

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
