import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Store,
  Wrench,
  FileStack,
  Truck,
  ShoppingBag,
  Download,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Products", icon: Package, to: "/products" },
  { label: "Orders", icon: ShoppingCart, to: "/orders" },
  { label: "Clients", icon: Users, to: "/clients" },
  { label: "Invoices", icon: FileText, to: "/invoices" },
  { label: "Job Card", icon: Wrench, to: "/job-card" },
  { label: "Proforma Invoice", icon: FileStack, to: "/proforma-invoice" },
  { label: "Delivery Note", icon: Truck, to: "/delivery-note" },
  { label: "Purchase Order", icon: ShoppingBag, to: "/purchase-order" },
];

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

import { usePWA } from "@/hooks/usePWA";

const InstallSidebarButton: React.FC = () => {
  const { deferredPrompt, isInstalled, install } = usePWA();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleInstall = async () => {
    await install();
  };

  // Hide if already installed
  if (isInstalled) return null;

  // Render the button, but maybe style it as "disabled" or "loading" if prompt not yet available
  const isReady = !!deferredPrompt;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={handleInstall}
        tooltip={isReady ? "Install App" : "Preparing Installation..."}
        className={cn(
          "text-primary hover:bg-primary/10 border border-primary/20 transition-all",
          !isReady && "opacity-50 cursor-wait"
        )}
      >
        <Download className={cn("w-4 h-4", !isReady && "animate-pulse")} />
        <span>Install App</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const AppSidebar: React.FC = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border h-20 flex items-center px-4 overflow-hidden bg-sidebar/30">
        <div className={cn(
          "flex items-center gap-3 w-full transition-all duration-300",
          collapsed && "justify-center px-0"
        )}>
          <div className="flex-shrink-0">
            <img
              src="/logo.png"
              alt="Microfast Logo"
              className={cn(
                "object-contain transition-all duration-300 drop-shadow-md",
                collapsed ? "w-8 h-8" : "w-10 h-10"
              )}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && collapsed) {
                  parent.innerHTML = '<span class="text-xl font-bold text-primary">M</span>';
                }
              }}
            />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 transition-opacity duration-300">
              <p className="text-sm font-bold text-sidebar-foreground truncate tracking-tight">
                Microfast
              </p>
              <p className="text-[10px] text-sidebar-foreground uppercase truncate font-semibold tracking-wider opacity-80">
                Distribution Co. Ltd
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map(({ label, icon: Icon, to }) => {
                const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={label}
                    >
                      <NavLink to={to}>
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border space-y-1">
        <SidebarMenu>
          {/* Install App button — vanishes when installed */}
          <InstallSidebarButton />

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to Store">
              <NavLink to="/">
                <Store className="w-4 h-4" />
                <span>Back to Store</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
