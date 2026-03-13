import React, { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

import { usePWA } from "@/hooks/usePWA";

const InstallPWA: React.FC = () => {
    const { deferredPrompt, isInstalled, install } = usePWA();
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        if (isInstalled) return;

        // Check if user dismissed before
        // const dismissed = localStorage.getItem("pwa_install_dismissed");
        // if (dismissed) return;

        if (deferredPrompt) {
            const timer = setTimeout(() => setShowBanner(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [isInstalled, deferredPrompt]);

    const handleInstall = async () => {
        const success = await install();
        if (success) setShowBanner(false);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem("pwa_install_dismissed", "true");
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-center gap-4 max-w-sm mx-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Install Microfast</p>
                    <p className="text-xs text-muted-foreground">Use offline – works without internet</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" onClick={handleInstall} className="h-8 text-xs">
                        <Download className="w-3 h-3 mr-1" /> Install
                    </Button>
                    <button
                        onClick={handleDismiss}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;
