import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Printer, Share2, Trash2, Mail, Building2, Calendar, CreditCard, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { useInvoice, useDeleteInvoice } from "@/hooks/useData";
import { generateInvoicePdf } from "@/lib/pdfUtils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const InvoiceDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: invoice, isLoading, error } = useInvoice(id || null);
    const deleteInvoice = useDeleteInvoice();

    if (isLoading) {
        return (
            <div className="p-4 sm:p-8 space-y-8 animate-pulse">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold">Invoice not found</h2>
                <Button variant="link" onClick={() => navigate("/invoices")}>Back to Invoices</Button>
            </div>
        );
    }

    const handleDownload = (docType: string) => {
        generateInvoicePdf(invoice, docType);
        toast.success(`Downloading ${docType}...`);
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this invoice?")) {
            deleteInvoice.mutate(invoice.id, {
                onSuccess: () => {
                    toast.success("Invoice deleted");
                    navigate("/invoices");
                }
            });
        }
    };

    const subtotal = invoice.items.reduce((sum: number, item: any) => sum + (item.quantity * parseFloat(item.price)), 0);
    const taxes = typeof invoice.taxes === 'string' ? JSON.parse(invoice.taxes) : (invoice.taxes || []);
    const taxAmount = taxes.reduce((sum: number, t: any) => sum + subtotal * (t.rate / 100), 0);

    return (
        <div className="p-4 sm:p-8 animate-fade-in max-w-5xl mx-auto">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{invoice.invoice_number}</h1>
                            <StatusBadge status={invoice.status} />
                        </div>
                        <p className="text-muted-foreground text-sm">Issued to {invoice.client_name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/${id}/edit`)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden sm:flex">
                        <Printer className="w-4 h-4 mr-2" /> Print
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload("Job Card")}>Job Card</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload("Proforma Invoice")}>Proforma Invoice</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload("Delivery Note")}>Delivery Note</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload("Purchase Order")}>Purchase Order</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload("Tax Invoice")}>Tax Invoice</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" className="text-danger hover:bg-danger/10" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
                        <div className="p-6 border-b border-border bg-muted/30">
                            <h2 className="font-semibold">Items</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-muted-foreground border-b border-border bg-muted/10">
                                    <th className="text-left p-4 font-medium">Description</th>
                                    <th className="text-center p-4 font-medium">Quantity</th>
                                    <th className="text-right p-4 font-medium">Price</th>
                                    <th className="text-right p-4 font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {invoice.items.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-muted/5 transition-colors">
                                        <td className="p-4 font-medium">{item.product_name}</td>
                                        <td className="p-4 text-center">{item.quantity}</td>
                                        <td className="p-4 text-right">${parseFloat(item.price).toFixed(2)}</td>
                                        <td className="p-4 text-right font-semibold">${(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="p-6 border-t border-border bg-muted/10">
                            <div className="ml-auto max-w-xs space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                                </div>
                                {taxes.map((t: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{t.name} ({t.rate}%)</span>
                                        <span className="font-medium">${(subtotal * (t.rate / 100)).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-3 border-t border-border">
                                    <span className="font-bold text-base">Total Total</span>
                                    <span className="text-2xl font-black text-primary">${parseFloat(invoice.total_amount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {invoice.notes && (
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-primary" />
                                Notes & Terms
                            </h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {invoice.notes}
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Client Info */}
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Client Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Client Name</p>
                                <p className="font-semibold text-foreground">{invoice.client_name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Email Address</p>
                                <p className="text-sm">{invoice.client_email}</p>
                            </div>
                            {(invoice.client_tin || invoice.client_vrn) && (
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/10">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">TIN</p>
                                        <p className="text-xs font-medium">{invoice.client_tin || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">VRN</p>
                                        <p className="text-xs font-medium">{invoice.client_vrn || '-'}</p>
                                    </div>
                                </div>
                            )}
                            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => navigate(`/clients`)}>
                                View All Clients
                            </Button>
                        </div>
                    </div>

                    {/* Timeline Info */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                Dates & Info
                            </h3>
                            {invoice.exempt && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-bold uppercase tracking-tighter">Tax Exempt</span>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Created On</p>
                                    <p className="text-sm font-medium">{new Date(invoice.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                </div>
                                {invoice.lpo_no && (
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">LPO No.</p>
                                        <p className="text-xs font-bold text-primary">{invoice.lpo_no}</p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Due Date</p>
                                <p className="text-sm font-bold text-danger">
                                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'No due date'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-primary" />
                            Payment Method
                        </h3>
                        <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground border border-border/50">
                            Bank Transfer, Credit Card, or Internal Credits.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetails;
