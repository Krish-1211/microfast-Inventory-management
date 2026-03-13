import { useState, useEffect } from 'react';

// Capture event globally as soon as script loads
let globalDeferredPrompt: any = null;
const pwaEventListeners = new Set<(event: any) => void>();

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        globalDeferredPrompt = e;
        pwaEventListeners.forEach(listener => listener(e));
        console.log('[PWA] Global beforeinstallprompt captured');
    });
}

export function usePWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(globalDeferredPrompt);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const checkInstalled = () => {
            const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                              (window.navigator as any).standalone === true;
            setIsInstalled(standalone);
        };

        checkInstalled();

        const onEvent = (e: any) => setDeferredPrompt(e);
        pwaEventListeners.add(onEvent);

        const installedHandler = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            globalDeferredPrompt = null;
        };

        window.addEventListener('appinstalled', installedHandler);

        return () => {
            pwaEventListeners.delete(onEvent);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const install = async () => {
        const promptEvent = deferredPrompt || globalDeferredPrompt;
        if (!promptEvent) return false;

        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            globalDeferredPrompt = null;
            return true;
        }
        
        return false;
    };

    return { deferredPrompt: deferredPrompt || globalDeferredPrompt, isInstalled, install };
}
