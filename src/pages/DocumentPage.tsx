import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClients, useProducts } from "@/hooks/useData";
import { generateInvoicePdf } from "@/lib/pdfUtils";
import { toast } from "sonner";
import { format } from "date-fns";

interface LineItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    unit: string;
}

const emptyItem = (): LineItem => ({
    id: `row${Date.now()}`,
    productId: "",
    productName: "",
    quantity: 1,
    unitPrice: 0,
    unit: "Pcs",
});

interface DocumentPageProps {
    documentType: "Job Card" | "Proforma Invoice" | "Delivery Note" | "Purchase Order";
    icon: React.ReactNode;
    description: string;
    color: string;
}

const DocumentPage: React.FC<DocumentPageProps> = ({ documentType, icon, description, color }) => {
    const navigate = useNavigate();
    const { data: clientsData } = useClients();
    const { data: productsData } = useProducts();

    const clients = clientsData || [];
    const products = productsData || [];

    const [selectedClient, setSelectedClient] = useState("");
    const [docNumber, setDocNumber] = useState(
        `${documentType.replace(/ /g, "").toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`
    );
    const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
    const [dueDate, setDueDate] = useState("");
    const [items, setItems] = useState<LineItem[]>([emptyItem()]);
    const [notes, setNotes] = useState("");
    const [lpoNo, setLpoNo] = useState("");
    const [exempt, setExempt] = useState(false);

    const handleProductSelect = (itemId: string, productId: string) => {
        const product = products.find((p: any) => p.id === productId);
        if (product) {
            setItems(prev =>
                prev.map(it =>
                    it.id === itemId
                        ? { ...it, productId, productName: product.name, unitPrice: parseFloat(product.price) }
                        : it
                )
            );
        }
    };

    const handleItemChange = (id: string, field: keyof LineItem, value: any) => {
        setItems(prev => prev.map(it => (it.id === id ? { ...it, [field]: value } : it)));
    };

    const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const vat = exempt ? 0 : subtotal * 0.18;
    const grandTotal = subtotal + vat;

    const selectedClientObj = clients.find((c: any) => c.id === selectedClient);

    const handleGenerate = () => {
        if (!selectedClient) {
            toast.error("Please select a client.");
            return;
        }
        const payload = {
            invoice_number: docNumber,
            created_at: docDate,
            due_date: dueDate,
            lpo_no: lpoNo,
            exempt,
            client_name: selectedClientObj?.name || "",
            client_company: selectedClientObj?.company || "",
            client_phone: selectedClientObj?.phone || "",
            client_email: selectedClientObj?.email || "",
            client_tin: selectedClientObj?.tin || "",
            client_vrn: selectedClientObj?.vrn || "",
            notes,
            items: items.map((it, idx) => ({
                product_name: it.productName || "Item " + (idx + 1),
                quantity: it.quantity,
                price: it.unitPrice,
                unit: it.unit,
            })),
        };
        generateInvoicePdf(payload, documentType);
        toast.success(`${documentType} generated successfully!`);
    };

    const docColors: Record<string, string> = {
        "Job Card": "from-violet-500/15 to-violet-900/5 border-violet-500/30 text-violet-300",
        "Proforma Invoice": "from-blue-500/15 to-blue-900/5 border-blue-500/30 text-blue-300",
        "Delivery Note": "from-emerald-500/15 to-emerald-900/5 border-emerald-500/30 text-emerald-300",
        "Purchase Order": "from-amber-500/15 to-amber-900/5 border-amber-500/30 text-amber-300",
    };
    const bannerColor = docColors[documentType] || "";

    return (
        <div className="p-4 sm:p-8 animate-fade-in max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{documentType}</h1>
                    <p className="text-muted-foreground text-sm">{description}</p>
                </div>
            </div>

            {/* Type Banner */}
            <div className={`mb-6 p-4 rounded-xl border bg-gradient-to-r ${bannerColor} flex items-center gap-3`}>
                <div className="text-2xl">{icon}</div>
                <div>
                    <p className="font-semibold">{documentType}</p>
                    <p className="text-xs opacity-80">Fill in the details below and click Generate to download the PDF</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Document Details */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
                        <h2 className="font-semibold mb-4">Document Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Document Number</Label>
                                <Input value={docNumber} onChange={e => setDocNumber(e.target.value)} className="mt-1" />
                            </div>
                            <div>
                                <Label>Date</Label>
                                <Input type="date" value={docDate} onChange={e => setDocDate(e.target.value)} className="mt-1" />
                            </div>
                            {(documentType === "Proforma Invoice" || documentType === "Purchase Order") && (
                                <div>
                                    <Label>Due Date</Label>
                                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1" />
                                </div>
                            )}
                            <div>
                                <Label>LPO Number</Label>
                                <Input value={lpoNo} placeholder="Optional" onChange={e => setLpoNo(e.target.value)} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Client */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
                        <h2 className="font-semibold mb-4">Client</h2>
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select client…" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name} {c.company ? `— ${c.company}` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Items Table */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <h2 className="font-semibold">Line Items</h2>
                            <Button size="sm" variant="outline" onClick={() => setItems(prev => [...prev, emptyItem()])}>
                                <Plus className="w-4 h-4 mr-1" /> Add Item
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/30 border-b border-border">
                                    <tr>
                                        <th className="text-left p-3 font-medium text-muted-foreground">#</th>
                                        <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
                                        <th className="text-center p-3 font-medium text-muted-foreground w-20">Qty</th>
                                        <th className="text-center p-3 font-medium text-muted-foreground w-20">Unit</th>
                                        <th className="text-right p-3 font-medium text-muted-foreground w-28">Unit Price</th>
                                        <th className="text-right p-3 font-medium text-muted-foreground w-28">Amount</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {items.map((item, idx) => (
                                        <tr key={item.id}>
                                            <td className="p-3 text-muted-foreground">{idx + 1}</td>
                                            <td className="p-3">
                                                <Select
                                                    value={item.productId}
                                                    onValueChange={val => handleProductSelect(item.id, val)}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Select product…" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map((p: any) => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="p-3">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={item.quantity}
                                                    onChange={e => handleItemChange(item.id, "quantity", parseInt(e.target.value) || 1)}
                                                    className="h-8 text-center text-xs"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <Input
                                                    value={item.unit}
                                                    onChange={e => handleItemChange(item.id, "unit", e.target.value)}
                                                    className="h-8 text-center text-xs"
                                                    placeholder="Pcs"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step={0.01}
                                                    value={item.unitPrice}
                                                    onChange={e => handleItemChange(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                                    className="h-8 text-right text-xs"
                                                />
                                            </td>
                                            <td className="p-3 text-right font-medium">
                                                ${(item.quantity * item.unitPrice).toFixed(2)}
                                            </td>
                                            <td className="p-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    onClick={() => setItems(prev => prev.filter(it => it.id !== item.id))}
                                                    disabled={items.length === 1}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Totals */}
                        <div className="p-6 border-t border-border bg-muted/10">
                            <div className="ml-auto max-w-xs space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">VAT (18%)</span>
                                    <span className="font-medium">{exempt ? "Exempt" : `$${vat.toFixed(2)}`}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-border">
                                    <span className="font-bold">Total</span>
                                    <span className="text-xl font-black text-primary">${grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
                        <Label>Notes / Remarks</Label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            className="mt-2 w-full border border-input rounded-md p-3 text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Any additional notes..."
                        />
                    </div>
                </div>

                {/* Sidebar Panel */}
                <div className="space-y-4">
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sticky top-6">
                        <h3 className="font-semibold mb-4">Options</h3>

                        <div className="flex items-center justify-between mb-6">
                            <Label className="text-sm">Tax Exempt</Label>
                            <button
                                onClick={() => setExempt(e => !e)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${exempt ? "bg-primary" : "bg-muted"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${exempt ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>

                        {selectedClientObj && (
                            <div className="mb-6 p-3 bg-muted/30 rounded-lg text-xs space-y-1">
                                <p className="font-semibold text-foreground">{selectedClientObj.name}</p>
                                <p className="text-muted-foreground">{selectedClientObj.company}</p>
                                {selectedClientObj.tin && <p className="text-muted-foreground">TIN: {selectedClientObj.tin}</p>}
                                {selectedClientObj.vrn && <p className="text-muted-foreground">VRN: {selectedClientObj.vrn}</p>}
                                <p className="text-muted-foreground">{selectedClientObj.email}</p>
                            </div>
                        )}

                        <Button
                            className="w-full"
                            onClick={handleGenerate}
                            disabled={!selectedClient || items.every(it => !it.productId)}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Generate & Download
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentPage;
