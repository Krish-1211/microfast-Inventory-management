import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Pencil, Trash2, X, Mail, Phone, Building,
  ChevronDown, ChevronUp, FileText, ExternalLink, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useClientInvoices } from "@/hooks/useData";
import { format } from "date-fns";

const emptyClient: any = {
  name: "", email: "", phone: "", company: "", status: "active", tin: "", vrn: ""
};

// Sub-component: renders the expanded invoice list for a client
const ClientInvoicePanel: React.FC<{ clientId: string }> = ({ clientId }) => {
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useClientInvoices(clientId);

  if (isLoading) {
    return (
      <tr>
        <td colSpan={8} className="px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading documents…
          </div>
        </td>
      </tr>
    );
  }

  const docs = invoices || [];

  return (
    <tr>
      <td colSpan={8} className="p-0">
        <div className="bg-muted/10 border-t border-b border-border/50 px-6 py-4 animate-in slide-in-from-top-1 duration-200">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            📄 Documents & Invoices for this Client
          </p>
          {docs.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> No documents found for this client.
              <button
                onClick={() => navigate("/invoices/new")}
                className="ml-2 text-primary underline text-xs font-medium hover:no-underline"
              >
                + Create Invoice
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {docs.map((inv: any) => (
                <button
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {inv.invoice_number}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {inv.created_at
                          ? format(new Date(inv.created_at), "dd MMM yyyy")
                          : "—"}
                        {" · "}
                        <span className="capitalize">{inv.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-primary">
                      ${parseFloat(inv.total_amount || 0).toFixed(2)}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick action buttons */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => navigate("/invoices/new")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors font-medium"
            >
              <Plus className="w-3 h-3" /> New Invoice
            </button>
            <button
              onClick={() => navigate("/proforma-invoice")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors font-medium"
            >
              <Plus className="w-3 h-3" /> Proforma Invoice
            </button>
            <button
              onClick={() => navigate("/delivery-note")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors font-medium"
            >
              <Plus className="w-3 h-3" /> Delivery Note
            </button>
            <button
              onClick={() => navigate("/job-card")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors font-medium"
            >
              <Plus className="w-3 h-3" /> Job Card
            </button>
            <button
              onClick={() => navigate("/purchase-order")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors font-medium"
            >
              <Plus className="w-3 h-3" /> Purchase Order
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

const Clients: React.FC = () => {
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { data: clientsData } = useClients();
  const clients = clientsData || [];

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(emptyClient);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const filtered = clients.filter((c: any) => {
    const matchSearch =
      String(c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      String(c.email || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setEditing(null); setForm(emptyClient); setModalOpen(true); };
  const openEdit = (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, company: c.company, status: c.status, tin: c.tin || "", vrn: c.vrn || "" });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSave = () => {
    if (editing) {
      updateClient.mutate({ id: editing.id, ...form });
    } else {
      createClient.mutate(form);
    }
    closeModal();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this client?")) deleteClient.mutate(id);
  };

  const toggleExpand = (clientId: string) => {
    setExpandedClient(prev => prev === clientId ? null : clientId);
  };

  return (
    <div className="p-4 sm:p-8 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Click any client to view their documents and invoices.</p>
        </div>
        <Button size="sm" onClick={openAdd} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1" /> Add Client
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search clients…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">{filtered.length} clients</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[900px] lg:min-w-0">
            <thead>
              <tr>
                <th></th>
                <th>Client Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tax IDs</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No clients found.</td></tr>
              )}
              {filtered.map(c => {
                const isExpanded = expandedClient === c.id;
                return (
                  <React.Fragment key={c.id}>
                    <tr
                      className={`cursor-pointer transition-colors ${isExpanded ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"}`}
                      onClick={() => toggleExpand(c.id)}
                    >
                      {/* Expand toggle */}
                      <td className="w-10 pl-4">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-md transition-all ${isExpanded ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                          {isExpanded
                            ? <ChevronUp className="w-3.5 h-3.5" />
                            : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${isExpanded ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                            {String(c.name || "C").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{c.name}</p>
                            {isExpanded && <p className="text-[10px] text-primary font-medium">Click to collapse</p>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Building className="w-3.5 h-3.5" />{c.company}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />{c.email}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />{c.phone}
                        </div>
                      </td>
                      <td>
                        <div className="text-[10px] text-muted-foreground uppercase flex flex-col">
                          <span>TIN: {c.tin || '-'}</span>
                          <span>VRN: {c.vrn || '-'}</span>
                        </div>
                      </td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>
                        <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => openEdit(c, e)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={e => handleDelete(c.id, e)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Panel */}
                    {isExpanded && <ClientInvoicePanel clientId={c.id} />}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md p-6 animate-in slide-in-from-bottom sm:slide-in-from-none duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">{editing ? "Edit Client" : "Add Client"}</h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input className="mt-1.5" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="Alice Johnson" />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input className="mt-1.5" value={form.company} onChange={e => setForm((f: any) => ({ ...f, company: e.target.value }))} placeholder="TechCorp" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input className="mt-1.5" type="email" value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} placeholder="alice@example.com" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input className="mt-1.5" value={form.phone} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} placeholder="+1 555-0100" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>TIN Number</Label>
                  <Input className="mt-1.5" value={form.tin} onChange={e => setForm((f: any) => ({ ...f, tin: e.target.value }))} placeholder="123-456-789" />
                </div>
                <div>
                  <Label>VRN Number</Label>
                  <Input className="mt-1.5" value={form.vrn} onChange={e => setForm((f: any) => ({ ...f, vrn: e.target.value }))} placeholder="40-012345-X" />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-6 justify-end">
              <Button variant="outline" onClick={closeModal} className="w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
              <Button onClick={handleSave} className="w-full sm:w-auto order-1 sm:order-2">{editing ? "Save Changes" : "Add Client"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
