import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClients, useProducts, useCreateInvoice, useInvoice, useUpdateInvoice } from "@/hooks/useData";
import ProductRecommendations from "@/components/ProductRecommendations";
import { toast } from "sonner";
import { formatTZS } from "@/lib/currency";

interface LineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface TaxItem {
  id: string;
  name: string;
  rate: number;
}

const emptyItem = (): LineItem => ({
  id: `row${Date.now()}`,
  productId: "",
  productName: "",
  quantity: 1,
  unitPrice: 0,
});

const emptyTax = (): TaxItem => ({
  id: `tax${Date.now()}`,
  name: "",
  rate: 0,
});

const InvoiceGenerator: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { data: clientsData } = useClients();
  const { data: productsData } = useProducts();
  const { data: invoiceData, isLoading: isLoadingInvoice } = useInvoice(id || null);
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const clients = clientsData || [];
  const products = productsData || [];

  const [selectedClient, setSelectedClient] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [notes, setNotes] = useState("");
  const [taxes, setTaxes] = useState<TaxItem[]>([
    { id: 'vat-default', name: 'VAT', rate: 18 }
  ]);
  const [lpoNo, setLpoNo] = useState("");
  const [exempt, setExempt] = useState(false);

  useEffect(() => {
    if (isEdit && invoiceData) {
      setSelectedClient(invoiceData.client_id || "");
      setInvoiceNumber(invoiceData.invoice_number || "");
      setLpoNo(invoiceData.lpo_no || "");
      setExempt(invoiceData.exempt || false);
      if (invoiceData.created_at) setInvoiceDate(new Date(invoiceData.created_at).toISOString().slice(0, 10));
      if (invoiceData.due_date) setDueDate(new Date(invoiceData.due_date).toISOString().slice(0, 10));
      setNotes(invoiceData.notes || "");

      if (invoiceData.items && invoiceData.items.length > 0) {
        setItems(invoiceData.items.map((it: any) => ({
          id: it.id,
          productId: it.product_id,
          productName: it.product_name,
          quantity: it.quantity,
          unitPrice: parseFloat(it.price)
        })));
      }

      if (invoiceData.taxes) {
        const parsedTaxes = typeof invoiceData.taxes === 'string' ? JSON.parse(invoiceData.taxes) : invoiceData.taxes;
        setTaxes(parsedTaxes.map((t: any, idx: number) => ({
          id: `tax-${idx}`,
          name: t.name,
          rate: t.rate
        })));
      }
    }
  }, [isEdit, invoiceData]);

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (field === "productId") {
        const prod = products.find((p: any) => p.id === value);
        return { ...item, productId: value as string, productName: prod?.name ?? "", unitPrice: typeof prod?.price === 'string' ? parseFloat(prod.price) : (prod?.price ?? 0) };
      }
      return { ...item, [field]: value };
    }));
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const addTax = () => setTaxes(prev => [...prev, emptyTax()]);
  const removeTax = (id: string) => setTaxes(prev => prev.filter(t => t.id !== id));
  const updateTax = (id: string, field: keyof TaxItem, value: string | number) => {
    setTaxes(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSave = (status: "draft" | "pending" | "paid") => {
    if (!selectedClient) return toast.error("Please select a client");
    if (items.some(i => !i.productId)) return toast.error("Please select products for all items");

    const payload = {
      clientId: selectedClient,
      invoiceNumber: isEdit ? invoiceNumber : (invoiceNumber || `INV-${Date.now()}`),
      dueDate: dueDate || null,
      status,
      notes,
      lpo_no: lpoNo,
      exempt: exempt,
      taxes: taxes.map(t => ({ name: t.name, rate: t.rate })),
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.unitPrice }))
    };

    if (isEdit) {
      updateInvoice.mutate({ id, ...payload }, {
        onSuccess: () => {
          toast.success("Invoice updated successfully");
          navigate(`/invoices/${id}`);
        }
      });
    } else {
      createInvoice.mutate(payload, {
        onSuccess: () => {
          toast.success("Invoice created successfully");
          navigate("/invoices");
        }
      });
    }
  };

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const totalTaxAmount = taxes.reduce((sum, t) => sum + subtotal * (t.rate / 100), 0);
  const total = subtotal + totalTaxAmount;

  if (isEdit && isLoadingInvoice) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 animate-fade-in max-w-5xl">
      <div className="page-header flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">{isEdit ? "Edit Invoice" : "New Invoice"}</h1>
          <p className="page-subtitle">{isEdit ? `Modifying ${invoiceNumber}` : "Fill in the details to generate a new invoice."}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Invoice meta */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Invoice Number</Label>
              <Input
                className="mt-1.5"
                placeholder="INV-001"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div>
              <Label>Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name} — {c.company}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Invoice Date</Label>
              <Input type="date" className="mt-1.5" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" className="mt-1.5" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>LPO Number</Label>
              <Input
                className="mt-1.5"
                placeholder="LPO-789"
                value={lpoNo}
                onChange={e => setLpoNo(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pt-8">
              <input
                type="checkbox"
                id="exempt"
                checked={exempt}
                onChange={e => setExempt(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="exempt" className="cursor-pointer">Exempt from Tax</Label>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Line Items</h2>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[700px] lg:min-w-0">
              <thead>
                <tr>
                  <th className="w-[40%]">Product</th>
                  <th className="w-[15%]">Qty</th>
                  <th className="w-[20%]">Unit Price</th>
                  <th className="w-[15%] text-right">Subtotal</th>
                  <th className="w-[10%]"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <Select value={item.productId} onValueChange={v => updateItem(item.id, "productId", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select product…" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td>
                      <Input
                        type="number" min={1} value={item.quantity}
                        onChange={e => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                        className="h-8 w-full text-sm"
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span className="text-xs">TZS</span>
                        <Input
                          type="number" min={0} value={item.unitPrice}
                          onChange={e => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="h-8 w-full text-sm"
                        />
                      </div>
                    </td>
                    <td className="font-medium text-right">{formatTZS(item.quantity * item.unitPrice)}</td>
                    <td className="text-center">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-danger transition-colors p-1"
                        disabled={items.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-border px-4 sm:px-6 py-4">
            <div className="ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground pb-2">
                <span>Subtotal</span>
                <span>{formatTZS(subtotal)}</span>
              </div>

              {taxes.map(tax => (
                <div key={tax.id} className="flex justify-between items-center text-muted-foreground gap-2 py-1">
                  <div className="flex items-center gap-2">
                    <Input
                      value={tax.name}
                      onChange={e => updateTax(tax.id, "name", e.target.value)}
                      placeholder="Tax Name"
                      className="h-7 w-24 text-xs"
                    />
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" min={0}
                        value={tax.rate}
                        onChange={e => updateTax(tax.id, "rate", parseFloat(e.target.value) || 0)}
                        className="h-7 w-16 text-xs px-2"
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <span>{formatTZS(subtotal * (tax.rate / 100))}</span>
                    <button onClick={() => removeTax(tax.id)} className="text-muted-foreground hover:text-danger ml-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Button variant="ghost" size="sm" onClick={addTax} className="h-7 text-xs px-2 -ml-2 text-muted-foreground hover:text-primary">
                  <Plus className="w-3 h-3 mr-1" /> Add Tax
                </Button>
              </div>

              <div className="flex justify-between font-semibold text-foreground border-t border-border mt-2 pt-2">
                <span>Total</span>
                <span className="text-primary">{formatTZS(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary & Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-sm">
              <Label>Notes / Terms</Label>
              <textarea
                className="mt-1.5 w-full h-24 px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Payment terms, special instructions, thank-you note…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            {items.some(i => i.productId) && (
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-sm">
                <ProductRecommendations
                  productId={items.filter(i => i.productId).slice(-1)[0].productId}
                  title="Customers also bought this"
                  onAdd={(prod) => {
                    const existingEmpty = items.findIndex(i => !i.productId);
                    if (existingEmpty !== -1) {
                      updateItem(items[existingEmpty].id, "productId", prod.id);
                    } else {
                      const newId = `row${Date.now()}`;
                      setItems(prev => [...prev, {
                        id: newId,
                        productId: prod.id,
                        productName: prod.name,
                        quantity: 1,
                        unitPrice: typeof prod.price === 'string' ? parseFloat(prod.price) : prod.price
                      }]);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <Button variant="outline" onClick={() => navigate("/invoices")} className="w-full sm:w-auto order-4 sm:order-1">Cancel</Button>
          <Button variant="outline" onClick={() => handleSave("draft")} className="w-full sm:w-auto order-3 sm:order-2">Save as Draft</Button>
          <Button variant="outline" onClick={() => handleSave("paid")} className="w-full sm:w-auto order-2 sm:order-3">Save as Paid</Button>
          <Button onClick={() => handleSave("pending")} className="w-full sm:w-auto order-1 sm:order-4 group">
            <Save className="w-4 h-4 mr-2 hidden group-hover:block animate-in fade-in zoom-in duration-200" />
            {isEdit ? "Update Invoice" : "Generate Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
