import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, SlidersHorizontal, PackageOpen, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { useInvoices, fetchInvoiceById } from "@/hooks/useData";
import { generateInvoicePdf } from "@/lib/pdfUtils";

const Orders: React.FC = () => {
    const navigate = useNavigate();
    const { data: invoicesData } = useInvoices();
    // Orders are identified by the 'ORD-' prefix
    const orders = (invoicesData || []).filter((inv: any) => inv.invoiceNumber?.startsWith('ORD-'));

    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");

    const filtered = orders.filter((order: any) => {
        const matchSearch =
            order.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
            order.clientName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === "All" || order.status.toLowerCase() === filterStatus.toLowerCase();
        return matchSearch && matchStatus;
    });

    const handleDownload = async (orderId: string) => {
        try {
            const fullOrder = await fetchInvoiceById(orderId);
            if (!fullOrder) {
                toast.error("Order not found.");
                return;
            }
            generateInvoicePdf(fullOrder);
            toast.success("Order PDF downloaded successfully!");
        } catch (error) {
            console.error("Failed to download order:", error);
            toast.error("Failed to download order. Please try again.");
        }
    };

    return (
        <div className="p-4 sm:p-8 animate-fade-in">
            <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title">Orders</h1>
                    <p className="page-subtitle">View and manage internal product orders and requests.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex flex-1 items-center space-x-2 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by Order # or client..."
                            className="pl-9 h-9 border-border bg-card shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[140px] h-9 border-border bg-card text-foreground shadow-sm group hover:border-sidebar-ring mx-auto flex">
                            <div className="flex items-center gap-2 flex-grow min-w-0">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                                <span className="truncate w-full text-left">{filterStatus}</span>
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <span className="text-xs text-muted-foreground sm:hidden">{filtered.length} orders</span>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table min-w-[800px] lg:min-w-0">
                        <thead>
                            <tr>
                                <th>Order #</th>
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
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-muted-foreground">
                                        <PackageOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        No orders found.
                                    </td>
                                </tr>
                            )}
                            {filtered.map(order => (
                                <tr
                                    key={order.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors group"
                                    onClick={() => navigate(`/invoices/${order.id}`)}
                                >
                                    <td className="font-medium text-primary group-hover:underline">{order.invoiceNumber}</td>
                                    <td className="text-foreground">{order.clientName}</td>
                                    <td className="text-muted-foreground">{new Date(order.date).toLocaleDateString()}</td>
                                    <td className="text-muted-foreground">{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '-'}</td>
                                    <td className="font-semibold">${order.amount.toFixed(2)}</td>
                                    <td><StatusBadge status={order.status} /></td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                onClick={() => navigate(`/invoices/${order.id}/edit`)}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                onClick={() => handleDownload(order.id)}
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </Button>
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

export default Orders;
