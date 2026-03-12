import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Download, SlidersHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { useInvoices, fetchInvoiceById } from "@/hooks/useData";
import { generateInvoicePdf } from "@/lib/pdfUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const InvoiceHistory: React.FC = () => {
  const navigate = useNavigate();
  const { data: invoicesData } = useInvoices();
  const invoices = (invoicesData || []).filter((inv: any) => !inv.invoiceNumber?.startsWith('ORD-'));

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filtered = invoices.filter((inv: any) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || inv.status.toLowerCase() === filterStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  const handleDownload = async (invoideId: string, docType: string) => {
    try {
      const fullInvoice = await fetchInvoiceById(invoideId);
      if (!fullInvoice) {
        toast.error("Invoice not found.");
        return;
      }
      generateInvoicePdf(fullInvoice, docType);
      toast.success(`${docType} PDF downloaded successfully!`);
    } catch (error) {
      console.error("Failed to download invoice:", error);
      toast.error("Failed to download invoice. Please try again.");
    }
  };

  return (
    <div className="p-4 sm:p-8 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">View and manage all your invoices.</p>
        </div>
        <Button size="sm" onClick={() => navigate("/invoices/new")} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1" /> New Invoice
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(["All", "Paid", "Pending", "Overdue"] as const).map(s => {
          const count = s === "All"
            ? invoices.length
            : invoices.filter((i: any) => i.status.toLowerCase() === s.toLowerCase()).length;
          const amount = s === "All"
            ? invoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0)
            : invoices.filter((i: any) => i.status.toLowerCase() === s.toLowerCase()).reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`stat-card text-left transition-all p-3 sm:p-5 ${filterStatus === s ? "ring-2 ring-primary" : "hover:border-primary/40"}`}
            >
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{s === "All" ? "All Invoices" : s}</p>
              <p className="text-base sm:text-lg font-semibold mt-0.5">{count}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">${amount.toFixed(2)}</p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search invoices…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">{filtered.length} invoices</span>
        </div>
        <span className="text-xs text-muted-foreground sm:hidden">{filtered.length} invoices</span>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[800px] lg:min-w-0">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No invoices found.</td></tr>
              )}
              {filtered.map(inv => (
                <tr
                  key={inv.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors group"
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <td className="font-medium text-primary group-hover:underline">{inv.invoiceNumber}</td>
                  <td className="text-foreground">{inv.clientName}</td>
                  <td className="text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="text-muted-foreground">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                  <td className="font-semibold">${inv.amount.toFixed(2)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(inv.id, "Job Card") }}>Job Card</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(inv.id, "Proforma Invoice") }}>Proforma Invoice</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(inv.id, "Delivery Note") }}>Delivery Note</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(inv.id, "Purchase Order") }}>Purchase Order</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(inv.id, "Tax Invoice") }}>Tax Invoice</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceHistory;
