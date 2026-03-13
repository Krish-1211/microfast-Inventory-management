import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, isAuthenticated } from "@/lib/auth";
import { Loader2 } from "lucide-react";

import { toast } from "sonner";

const Login = () => {
    const navigate = useNavigate();
    
    React.useEffect(() => {
        if (isAuthenticated()) {
            navigate("/dashboard");
        }
    }, [navigate]);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            await login(email, password);
            
            // If we just logged in online, show a "Preparing offline" state
            if (navigator.onLine) {
                setIsSyncing(true);
                toast.info("Preparing for offline use... Downloading database.");
                const { pullAllData } = await import("@/lib/syncEngine");
                await pullAllData();
                toast.success("Ready for offline use!");
            }
            
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.message || "Invalid email or password");
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
            <div className="w-full max-w-md bg-card border border-border p-8 rounded-lg shadow-sm">
                <div className="flex justify-center mb-6">
                    <img
                        src="/logo.png"
                        alt="Microfast Logo"
                        className="w-32 h-32 object-contain drop-shadow-md"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                                const text = document.createElement('h1');
                                text.className = 'text-3xl font-bold text-primary';
                                text.innerText = 'Microfast';
                                parent.appendChild(text);
                            }
                        }}
                    />
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-danger">{error}</p>}
                    {!navigator.onLine && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3">
                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-1">📵 Offline Mode</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                You can log in using your last used credentials while offline.
                            </p>
                        </div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {navigator.onLine ? "Sign In" : "Login Offline"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default Login;
