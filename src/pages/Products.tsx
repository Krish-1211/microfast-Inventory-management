import React, { useState } from "react";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useData";
import { Product, ProductStatus } from "@/data/mockData";
import { getProductImage } from "@/lib/utils";

const statusOptions: ProductStatus[] = ["in_stock", "low_stock", "out_of_stock"]; // Match backend ENUM/strings
const categories = ["Electronics", "Office", "Stationery", "Other"];

const emptyProduct: Omit<Product, "id"> = {
  name: "", price: 0, stock: 0, status: "in_stock", category: "Electronics",
};

const Products: React.FC = () => {
  const { data: productsData } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const products = productsData || [];

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setEditing(null); setForm(emptyProduct); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ name: p.name, price: typeof p.price === 'string' ? parseFloat(p.price) : p.price, stock: p.stock, status: p.status, category: p.category }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSave = () => {
    if (editing) {
      updateProduct.mutate({ id: editing.id, ...form });
    } else {
      createProduct.mutate(form);
    }
    closeModal();
  };

  const handleDelete = (id: string) => deleteProduct.mutate(id);

  return (
    <div className="p-4 sm:p-8 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalog and inventory.</p>
        </div>
        <Button size="sm" onClick={openAdd} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">{filtered.length} products</span>
        </div>
        <span className="text-xs text-muted-foreground sm:hidden">{filtered.length} products</span>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[700px] lg:min-w-0">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No products found.</td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id}>
                  <td className="font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <img src={getProductImage(p)} alt={p.name} className="w-10 h-10 rounded-md object-cover border border-border" />
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="text-muted-foreground">{p.category}</td>
                  <td className="font-medium">${p.price.toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:text-danger" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md p-6 animate-in slide-in-from-bottom sm:slide-in-from-none duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">{editing ? "Edit Product" : "Add Product"}</h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Product Name</Label>
                <Input className="mt-1.5" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Wireless Keyboard" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price ($)</Label>
                  <Input className="mt-1.5" type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input className="mt-1.5" type="number" min={0} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ProductStatus }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-6 justify-end">
              <Button variant="outline" onClick={closeModal} className="w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
              <Button onClick={handleSave} className="w-full sm:w-auto order-1 sm:order-2">{editing ? "Save Changes" : "Add Product"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
