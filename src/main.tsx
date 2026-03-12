import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { syncNow, startNetworkListener, pullAllData } from "./lib/syncEngine";
import { registerSW } from "virtual:pwa-register";

// Register service worker with auto-update
const updateSW = registerSW({
    onNeedRefresh() {
        // New content available – auto-update silently
        updateSW(true);
    },
    onOfflineReady() {
        console.log("[PWA] App ready for offline use.");
    },
});

// Start network listener (online/offline) for auto-sync
startNetworkListener();

// Initial sync: pull cloud data into local DB on startup
// This runs silently in background – app works even if it fails (offline)
if (navigator.onLine) {
    pullAllData().catch(() => {
        console.log("[Sync] Initial pull failed, will use cached local data.");
    });
}

createRoot(document.getElementById("root")!).render(<App />);
