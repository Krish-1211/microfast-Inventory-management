import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import SyncStatusBar from "@/components/SyncStatusBar";
import InstallPWA from "@/components/InstallPWA";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { isAuthenticated } from "@/lib/auth";

const AppLayout: React.FC = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <header className="flex h-16 items-center gap-4 border-b bg-card px-4 shrink-0">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1 flex items-center">
              <img
                src="/logo.png"
                alt="Microfast Logo"
                className="w-8 h-8 object-contain ml-1 md:hidden"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            {/* Network / Sync status always visible in header */}
            <SyncStatusBar />
          </header>

          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* PWA install banner */}
      <InstallPWA />
    </SidebarProvider>
  );
};

export default AppLayout;
