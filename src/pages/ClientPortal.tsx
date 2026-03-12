import React from "react";
import { Download, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { useUser, useMyInvoices, fetchInvoiceById } from "@/hooks/useData";
import { generateInvoicePdf } from "@/lib/pdfUtils";
import { toast } from "sonner";

const ClientPortal: React.FC = () => {
  const { data: user } = useUser();
  const { data: invoicesData, isLoading } = useMyInvoices();

  const clientInvoices = invoicesData || [];

  const totalPaid = clientInvoices.filter((i: any) => i.status.toLowerCase() === "paid").reduce((s: number, i: any) => s + i.amount, 0);
  const totalPending = clientInvoices.filter((i: any) => i.status.toLowerCase() === "pending").reduce((s: number, i: any) => s + i.amount, 0);

  const handleDownload = async (invoiceId: string) => {
    try {
      const fullInvoice = await fetchInvoiceById(invoiceId);
      if (!fullInvoice) {
        toast.error("Invoice not found.");
        return;
      }
      generateInvoicePdf(fullInvoice);
      toast.success("Invoice PDF downloaded successfully!");
    } catch (error) {
      console.error("Failed to download invoice:", error);
      toast.error("Failed to download invoice. Please try again.");
    }
  };

  // If loading or no client data (e.g. admin viewing), show placeholder or loading
  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  const clientName = user?.client?.name || user?.email || "Client";
  const companyName = user?.client?.company || "";

  return (
    <div className="min-h-screen bg-muted/30 animate-fade-in">
      {/* Portal header */}
      <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Microfast</p>
            <p className="text-[10px] text-muted-foreground uppercase">Client Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{clientName}</p>
            <p className="text-xs text-muted-foreground">{companyName}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center text-sm font-semibold">
            {clientName.charAt(0)}
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Welcome back, {clientName.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's a summary of your account and invoices.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="stat-card">
            <p className="text-xs text-muted-foreground font-medium">Total Invoices</p>
            <p className="text-2xl font-semibold mt-1">{clientInvoices.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-muted-foreground font-medium">Total Paid</p>
            <p className="text-2xl font-semibold mt-1 text-success">${totalPaid.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-muted-foreground font-medium">Outstanding</p>
            <p className="text-2xl font-semibold mt-1 text-warning">${totalPending.toFixed(2)}</p>
          </div>
        </div>

        {/* Invoices table */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">My Invoices</h2>
          </div>
          {clientInvoices.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No invoices yet.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {clientInvoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="font-medium text-primary">{inv.invoiceNumber}</td>
                    <td className="text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="text-muted-foreground">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                    <td className="font-semibold">${inv.amount.toFixed(2)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => handleDownload(inv.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground text-center mt-8">
          Having questions? Contact us at <span className="text-primary">support@microfastdistribution.com</span>
        </p>
      </div>
    </div>
  );
};

export default ClientPortal;
