export type ProductStatus = "In Stock" | "Low Stock" | "Out of Stock" | "in_stock" | "low_stock" | "out_of_stock";
export type ClientStatus = "Active" | "Inactive" | "active" | "inactive";
export type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Draft" | "paid" | "pending" | "overdue" | "draft";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: ProductStatus;
  category: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ClientStatus;
  totalInvoices: number;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  amount: number;
  status: InvoiceStatus;
}

export const products: Product[] = [
  { id: "p1", name: "Wireless Keyboard", price: 89.99, stock: 124, status: "In Stock", category: "Electronics" },
  { id: "p2", name: "USB-C Hub (7-in-1)", price: 49.99, stock: 8, status: "Low Stock", category: "Electronics" },
  { id: "p3", name: "Ergonomic Mouse", price: 65.00, stock: 0, status: "Out of Stock", category: "Electronics" },
  { id: "p4", name: "Standing Desk Mat", price: 38.50, stock: 54, status: "In Stock", category: "Office" },
  { id: "p5", name: "Monitor Arm", price: 120.00, stock: 31, status: "In Stock", category: "Office" },
  { id: "p6", name: "Notebook (A5, 3-pack)", price: 15.99, stock: 5, status: "Low Stock", category: "Stationery" },
  { id: "p7", name: "Webcam HD 1080p", price: 79.00, stock: 0, status: "Out of Stock", category: "Electronics" },
  { id: "p8", name: "Cable Management Kit", price: 22.00, stock: 200, status: "In Stock", category: "Office" },
];

export const clients: Client[] = [
  { id: "c1", name: "Alice Johnson", email: "alice@techcorp.io", phone: "+1 555-0101", company: "TechCorp", status: "Active", totalInvoices: 12 },
  { id: "c2", name: "Bob Martinez", email: "bob@designstudio.com", phone: "+1 555-0102", company: "Design Studio", status: "Active", totalInvoices: 7 },
  { id: "c3", name: "Clara Wu", email: "clara@startupx.co", phone: "+1 555-0103", company: "StartupX", status: "Inactive", totalInvoices: 3 },
  { id: "c4", name: "David Kim", email: "david@enterprise.net", phone: "+1 555-0104", company: "Enterprise Ltd.", status: "Active", totalInvoices: 21 },
  { id: "c5", name: "Eva Rossi", email: "eva@freelance.me", phone: "+1 555-0105", company: "Freelance", status: "Active", totalInvoices: 5 },
];

export const invoices: Invoice[] = [
  {
    id: "inv1", invoiceNumber: "MFD-2026-001", clientId: "c1", clientName: "Alice Johnson",
    date: "2026-03-01", dueDate: "2026-04-01",
    items: [{ productId: "p1", productName: "Wireless Keyboard", quantity: 2, unitPrice: 89.99 }],
    amount: 179.98, status: "Paid",
  },
  {
    id: "inv2", invoiceNumber: "MFD-2026-002", clientId: "c4", clientName: "David Kim",
    date: "2026-03-05", dueDate: "2026-04-05",
    items: [
      { productId: "p5", productName: "Monitor Arm", quantity: 3, unitPrice: 120.00 },
      { productId: "p4", productName: "Standing Desk Mat", quantity: 3, unitPrice: 38.50 },
    ],
    amount: 475.50, status: "Pending",
  },
  {
    id: "inv3", invoiceNumber: "MFD-2026-003", clientId: "c2", clientName: "Bob Martinez",
    date: "2026-02-01", dueDate: "2026-03-01",
    items: [{ productId: "p2", productName: "USB-C Hub (7-in-1)", quantity: 5, unitPrice: 49.99 }],
    amount: 249.95, status: "Overdue",
  },
  {
    id: "inv4", invoiceNumber: "MFD-2026-004", clientId: "c5", clientName: "Eva Rossi",
    date: "2026-03-10", dueDate: "2026-04-10",
    items: [{ productId: "p8", productName: "Cable Management Kit", quantity: 10, unitPrice: 22.00 }],
    amount: 220.00, status: "Draft",
  },
  {
    id: "inv5", invoiceNumber: "MFD-2026-005", clientId: "c1", clientName: "Alice Johnson",
    date: "2026-03-11", dueDate: "2026-04-11",
    items: [{ productId: "p6", productName: "Notebook (A5, 3-pack)", quantity: 4, unitPrice: 15.99 }],
    amount: 63.96, status: "Paid",
  },
];

export const recentActivity = [
  { id: 1, action: "Invoice Created", detail: "MFD-2026-005 for Alice Johnson", time: "2 hours ago", type: "invoice" },
  { id: 2, action: "Product Updated", detail: "Stock updated for USB-C Hub", time: "4 hours ago", type: "product" },
  { id: 3, action: "New Client Added", detail: "Eva Rossi — Freelance", time: "Yesterday", type: "client" },
  { id: 4, action: "Payment Received", detail: "MFD-2026-001 · $179.98", time: "Yesterday", type: "payment" },
  { id: 5, action: "Invoice Overdue", detail: "MFD-2026-003 · Bob Martinez", time: "Jan 1", type: "overdue" },
];

export const stats = {
  totalProducts: products.length,
  totalClients: clients.length,
  totalInvoices: invoices.length,
  revenue: invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0),
  pending: invoices.filter(i => i.status === "Pending").reduce((sum, i) => sum + i.amount, 0),
};
