import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Bell, CreditCard, Shield, ChevronRight } from "lucide-react";

const sections = [
  { id: "business", label: "Business Info", icon: Building2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
];

const SettingsPage: React.FC = () => {
  const [active, setActive] = useState("business");
  const [currency, setCurrency] = useState("USD");
  const [taxRate, setTaxRate] = useState("10");

  return (
    <div className="p-4 sm:p-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and application preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left nav */}
        <div className="w-full lg:w-52 shrink-0 overflow-x-auto">
          <div className="bg-card border border-border rounded-lg shadow-sm flex lg:flex-col overflow-hidden">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex-1 lg:flex-none flex items-center justify-between px-4 py-3 text-sm transition-colors border-r lg:border-r-0 lg:border-b border-border last:border-r-0 lg:last:border-b-0 whitespace-nowrap ${active === s.id
                  ? "bg-primary-light text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <div className="flex items-center gap-2.5 mx-auto lg:mx-0">
                  <s.icon className="w-4 h-4" />
                  <span>{s.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 hidden lg:block" />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {active === "business" && (
            <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-sm font-semibold mb-5">Business Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Business Name</Label>
                    <Input className="mt-1.5" defaultValue="MICROFAST DISTRIBUTION COMPANY LIMITED" />
                  </div>
                  <div>
                    <Label>Business Email</Label>
                    <Input className="mt-1.5" defaultValue="admin@microfastdistribution.com" />
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input className="mt-1.5" defaultValue="Main Warehouse, Microfast complex" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD — US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR — Euro</SelectItem>
                        <SelectItem value="GBP">GBP — British Pound</SelectItem>
                        <SelectItem value="CAD">CAD — Canadian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Default Tax Rate (%)</Label>
                    <Input className="mt-1.5" type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Invoice Prefix</Label>
                  <Input className="mt-1.5" defaultValue="MFD-2026-" />
                </div>
                <div className="pt-2">
                  <Button className="w-full sm:w-auto">Save Changes</Button>
                </div>
              </div>
            </div>
          )}

          {active === "profile" && (
            <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-sm font-semibold mb-5">Profile</h2>
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center text-2xl font-semibold">A</div>
                <div className="text-center sm:text-left">
                  <p className="font-medium">Admin User</p>
                  <p className="text-sm text-muted-foreground">admin@microfastdistribution.com</p>
                  <Button variant="outline" size="sm" className="mt-2 text-xs">Change Photo</Button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>First Name</Label><Input className="mt-1.5" defaultValue="Admin" /></div>
                  <div><Label>Last Name</Label><Input className="mt-1.5" defaultValue="User" /></div>
                </div>
                <div><Label>Email</Label><Input className="mt-1.5" defaultValue="admin@microfastdistribution.com" /></div>
                <div className="pt-2"><Button className="w-full sm:w-auto">Save Profile</Button></div>
              </div>
            </div>
          )}

          {active === "notifications" && (
            <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-sm font-semibold mb-5">Notification Preferences</h2>
              <div className="space-y-4">
                {["Invoice Created", "Payment Received", "Invoice Overdue", "New Client Registered", "Low Stock Alert"].map(item => (
                  <div key={item} className="flex items-center justify-between py-3 border-b border-border last:border-b-0 gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">Receive email notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-muted peer-checked:bg-primary rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-card after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "billing" && (
            <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-sm font-semibold mb-5">Billing & Plan</h2>
              <div className="rounded-lg border border-primary/30 bg-primary-light p-4 mb-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-primary">Pro Plan</p>
                    <p className="text-xs text-muted-foreground mt-0.5">$29/month · Renews Feb 18, 2027</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">Manage Plan</Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-3">Payment Method</p>
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm">Visa ending in 4242</p>
                    <p className="text-xs text-muted-foreground">Expires 12/27</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">Update</Button>
                </div>
              </div>
            </div>
          )}

          {active === "security" && (
            <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-sm font-semibold mb-5">Security</h2>
              <div className="space-y-4">
                <div>
                  <Label>Current Password</Label>
                  <Input className="mt-1.5" type="password" placeholder="••••••••" />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input className="mt-1.5" type="password" placeholder="••••••••" />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input className="mt-1.5" type="password" placeholder="••••••••" />
                </div>
                <div className="pt-2"><Button className="w-full sm:w-auto">Update Password</Button></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
