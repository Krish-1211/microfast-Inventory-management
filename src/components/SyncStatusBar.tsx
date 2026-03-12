import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/localDb";
import { syncNow } from "@/lib/syncEngine";
import { Wifi, WifiOff, RefreshCw, CloudOff, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

const SyncStatusBar: React.FC = () => {
    const [online, setOnline] = useState(navigator.onLine);
    const [syncing, setSyncing] = useState(false);
    const lastSync = localStorage.getItem("last_sync");

    const pendingCount = useLiveQuery(() => db.pendingRequests.count(), []);

    useEffect(() => {
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const handleManualSync = async () => {
        if (!online) {
            toast.error("Cannot sync while offline");
            return;
        }
        setSyncing(true);
        await syncNow(false);
        setSyncing(false);
    };

    return (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${online
                    ? pendingCount && pendingCount > 0
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
        >
            {online ? (
                <>
                    {pendingCount && pendingCount > 0 ? (
                        <>
                            <Clock className="w-3 h-3" />
                            <span>{pendingCount} pending sync</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Synced</span>
                        </>
                    )}
                    <button
                        onClick={handleManualSync}
                        disabled={syncing}
                        className="ml-1 hover:text-white transition-colors disabled:opacity-50"
                        title="Sync now"
                    >
                        <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                    </button>
                </>
            ) : (
                <>
                    <WifiOff className="w-3 h-3" />
                    <span>Offline</span>
                    {pendingCount && pendingCount > 0 && (
                        <span className="ml-0.5">· {pendingCount} queued</span>
                    )}
                </>
            )}
        </div>
    );
};

export default SyncStatusBar;
