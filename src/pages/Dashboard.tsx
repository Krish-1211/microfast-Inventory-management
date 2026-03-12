import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, Users, FileText, DollarSign,
  Plus, ArrowRight, TrendingUp, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { useStats, useInvoices } from "@/hooks/useData";

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.FC<{ className?: string }>;
  sub?: string;
  accent?: boolean;
}> = ({ title, value, icon: Icon, sub, accent }) => (
  <div className="stat-card flex items-start gap-4">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent ? "bg-primary text-primary-foreground" : "bg-primary-light text-primary"}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground font-medium">{title}</p>
      <p className="text-2xl font-semibold text-foreground mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  </div>
);

const activityIcon: Record<string, string> = {
  invoice: "bg-info/10 text-info",
  product: "bg-warning/10 text-warning",
  client: "bg-success/10 text-success",
  payment: "bg-primary-light text-primary",
  overdue: "bg-danger/10 text-danger",
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: statsData } = useStats();
  const { data: invoicesData } = useInvoices();

  const stats = statsData || {
    totalProducts: 0,
    totalClients: 0,
    totalInvoices: 0,
    revenue: 0,
    pending: 0,
    recentActivity: [],
  };

  const invoices = invoicesData || [];
  const recentInvoices = invoices.slice(0, 4);

  return (
    <div className="p-4 sm:p-8 animate-fade-in">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back — here's what's happening today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/products")} className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-1" /> Add Product
          </Button>
          <Button size="sm" onClick={() => navigate("/invoices/new")} className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-1" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} sub="All SKUs" />
        <StatCard title="Total Clients" value={stats.totalClients} icon={Users} sub="Registered" />
        <StatCard title="Total Invoices" value={stats.totalInvoices} icon={FileText} sub="All time" />
        <StatCard
          title="Total Revenue"
          value={`$${stats.revenue.toFixed(2)}`}
          icon={DollarSign}
          sub={`$${stats.pending.toFixed(2)} pending`}
          accent
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Recent Invoices</span>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/invoices")}>
              View all <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[500px] lg:min-w-0">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors group"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <td className="font-medium text-primary group-hover:underline">{inv.invoiceNumber}</td>
                    <td className="text-muted-foreground">{inv.clientName}</td>
                    <td className="font-medium">${inv.amount.toFixed(2)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Recent Activity</span>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {(stats.recentActivity || []).map((item: any) => (
              <div key={item.id} className="px-5 py-3 flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs ${activityIcon[item.type] || "bg-muted text-muted-foreground"}`}>
                  ●
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.desc}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.time).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(stats.recentActivity || []).length === 0 && (
              <div className="px-5 py-3 text-sm text-muted-foreground">No recent activity.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
