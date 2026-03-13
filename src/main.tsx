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
if (navigator.onLine) {
    // If logged in, do a full sync. If not, at least pull public products.
    if (localStorage.getItem('token')) {
        syncNow(true).catch(() => console.log("[Sync] Full initial sync failed."));
    } else {
        // Just pull products so the storefront works offline even if they never logged in
        import('./lib/syncEngine').then(m => m.pullAllData()); 
    }
}

createRoot(document.getElementById("root")!).render(<App />);
