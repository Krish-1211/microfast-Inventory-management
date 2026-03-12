import React, { useState } from "react";
import { Package, User, Search, Phone, Mail, Building, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProducts, useCreatePublicOrder } from "@/hooks/useData";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { getProductImage } from "@/lib/utils";
import ProductRecommendations from "@/components/ProductRecommendations";

interface CartItem {
    product: any;
    quantity: number;
}

const PublicStore: React.FC = () => {
    const navigate = useNavigate();
    const { data: productsData, isLoading } = useProducts();
    const createOrder = useCreatePublicOrder();
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");

    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [customerData, setCustomerData] = useState({ name: "", email: "", phone: "" });

    const products = productsData || [];

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
        toast.success(`${product.name} added to cart!`);
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === id) {
                const newQ = item.quantity + delta;
                return newQ > 0 ? { ...item, quantity: newQ } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.product.id !== id));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const handleCheckout = () => {
        if (!customerData.name || !customerData.email) {
            toast.error("Please provide Name and Email.");
            return;
        }
        if (cart.length === 0) return;

        createOrder.mutate({
            customer: customerData,
            items: cart.map(c => ({ productId: c.product.id, quantity: c.quantity }))
        }, {
            onSuccess: () => {
                toast.success("Order submitted successfully!");
                setCart([]);
                setIsCartOpen(false);
                setCustomerData({ name: "", email: "", phone: "" });
            },
            onError: () => {
                toast.error("Failed to submit order. Please try again.");
            }
        });
    };

    // Extract unique categories
    const categories = ["All", ...Array.from(new Set(products.map((p: any) => p.category)))];

    const filteredProducts = products.filter((product: any) => {
        const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === "All" || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-muted/30 font-sans animate-fade-in flex flex-col">
            {/* Header */}
            <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="Microfast Logo"
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-none uppercase">Microfast Distribution</h1>
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Professional Inventory Catalog</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="relative">
                                    <ShoppingCart className="w-5 h-5" />
                                    {cart.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                            {cart.reduce((sum, item) => sum + item.quantity, 0)}
                                        </span>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="flex flex-col h-full w-full sm:max-w-md">
                                <SheetHeader>
                                    <SheetTitle>Your Cart</SheetTitle>
                                </SheetHeader>
                                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
                                    {cart.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-10">
                                            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>Your cart is empty.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {cart.map((item) => (
                                                <div key={item.product.id} className="flex gap-3 border-b border-border pb-4">
                                                    <img src={getProductImage(item.product)} alt={item.product.name} className="w-16 h-16 object-cover rounded-md border border-border" />
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-semibold leading-tight mb-1">{item.product.name}</h4>
                                                        <p className="text-sm font-medium text-primary">${item.product.price.toFixed(2)}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Button variant="outline" size="icon" className="w-6 h-6" onClick={() => updateQuantity(item.product.id, -1)}>
                                                                <Minus className="w-3 h-3" />
                                                            </Button>
                                                            <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                                                            <Button variant="outline" size="icon" className="w-6 h-6" onClick={() => updateQuantity(item.product.id, 1)}>
                                                                <Plus className="w-3 h-3" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="w-6 h-6 ml-auto text-muted-foreground hover:text-danger" onClick={() => removeFromCart(item.product.id)}>
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Recommendations Section */}
                                            {cart.length > 0 && (
                                                <ProductRecommendations
                                                    productId={cart[cart.length - 1].product.id}
                                                    onAdd={addToCart}
                                                    title="Frequently bought together"
                                                />
                                            )}

                                            <div className="pt-2 border-t border-border mt-6">
                                                <h3 className="text-sm font-bold mb-3">Your Details</h3>
                                                <div className="space-y-3">
                                                    <div>
                                                        <Label className="text-xs">Full Name *</Label>
                                                        <Input className="h-8 text-sm mt-1" value={customerData.name} onChange={e => setCustomerData({ ...customerData, name: e.target.value })} placeholder="John Doe" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Email *</Label>
                                                        <Input className="h-8 text-sm mt-1" type="email" value={customerData.email} onChange={e => setCustomerData({ ...customerData, email: e.target.value })} placeholder="john@example.com" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Phone</Label>
                                                        <Input className="h-8 text-sm mt-1" value={customerData.phone} onChange={e => setCustomerData({ ...customerData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {cart.length > 0 && (
                                    <div className="pt-4 border-t border-border bg-background">
                                        <div className="flex justify-between font-bold mb-4">
                                            <span>Total</span>
                                            <span>${cartTotal.toFixed(2)}</span>
                                        </div>
                                        <Button className="w-full" onClick={handleCheckout} disabled={createOrder.isPending}>
                                            {createOrder.isPending ? "Submitting..." : "Submit Order"}
                                        </Button>
                                    </div>
                                )}
                            </SheetContent>
                        </Sheet>
                        <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                            <User className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Admin Login</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full">
                {/* Hero / Info Section */}
                <div className="bg-card border border-border rounded-xl p-5 sm:p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Product Catalog</h2>
                        <p className="text-sm sm:text-base text-muted-foreground mt-1">
                            Browse our current inventory and stock levels.
                        </p>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mt-4 text-xs sm:text-sm text-foreground/80">
                            <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                <span>+1 (555) MICROFAST</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                <span>orders@microfastdistribution.com</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                <span>Main Warehouse, Microfast complex</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-xs sm:text-sm text-muted-foreground">Select items below and use the <br className="hidden sm:block" /> cart to submit an order quickly.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative w-full sm:flex-1 sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search products..."
                            className="pl-9"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((c: any) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading catalog...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-xl border border-border border-dashed">
                        <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-muted-foreground">No products found fitting your criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product: any) => (
                            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center relative border-b border-border overflow-hidden group">
                                    <img
                                        src={getProductImage(product)}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{product.category}</p>
                                            <CardTitle className="text-base font-semibold line-clamp-1" title={product.name}>{product.name}</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <Button
                                                size="sm"
                                                className="h-8 shadow-sm transition-all"
                                                onClick={() => addToCart(product)}
                                            >
                                                Add to Cart
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-card border-t border-border py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} MICROFAST DISTRIBUTION COMPANY LIMITED. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicStore;
