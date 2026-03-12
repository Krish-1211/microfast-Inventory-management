import React from 'react';
import { useProductRecommendations } from '@/hooks/useData';
import { getProductImage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProductRecommendationsProps {
    productId: string;
    onAdd: (product: any) => void;
    title?: string;
}

const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({ productId, onAdd, title = "Customers also bought" }) => {
    const { data: recommendations, isLoading, error } = useProductRecommendations(productId);

    if (!productId) return null;

    return (
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold tracking-tight">{title}</h3>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-8 bg-muted/10 rounded-lg border border-dashed border-border">
                    <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                    <span className="text-xs text-muted-foreground font-medium">Finding smart suggestions...</span>
                </div>
            ) : error ? (
                <div className="p-4 bg-danger/5 text-danger text-[10px] rounded-lg border border-danger/20">
                    Failed to load suggestions.
                </div>
            ) : !recommendations || recommendations.length === 0 ? (
                <div className="p-4 bg-muted/5 text-muted-foreground text-[11px] rounded-lg border border-dashed border-border text-center">
                    No related products found yet.
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {recommendations.map((product) => {
                        const isOutOfStock = product.status?.toLowerCase().includes('out_of_stock') || product.stock === 0;

                        return (
                            <Card key={product.id} className={`overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 bg-background ${isOutOfStock ? 'opacity-70' : 'hover:shadow-md'}`}>
                                <div className="aspect-square bg-muted/30 overflow-hidden relative border-b border-border/50">
                                    <img
                                        src={getProductImage(product)}
                                        alt={product.name}
                                        className={`w-full h-full object-cover transition-transform duration-500 ${!isOutOfStock && 'hover:scale-110'}`}
                                    />
                                    {isOutOfStock ? (
                                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-[1px]">
                                            <span className="text-[9px] font-bold uppercase tracking-tighter bg-muted text-muted-foreground px-2 py-1 rounded-sm border border-border">
                                                Sold Out
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="absolute top-1 right-1">
                                            <div className="bg-primary/90 text-primary-foreground text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md">
                                                <Sparkles className="w-2 h-2" />
                                                BEST MATCH
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-2 space-y-2">
                                    <div>
                                        <h4 className="text-[11px] font-semibold line-clamp-1 leading-tight text-foreground/90">{product.name}</h4>
                                        <p className="text-xs font-bold text-primary">${product.price.toFixed(2)}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={isOutOfStock ? "outline" : "secondary"}
                                        className={`w-full h-7 text-[10px] gap-1 px-1 transition-all ${!isOutOfStock && 'hover:bg-primary hover:text-primary-foreground'}`}
                                        onClick={() => !isOutOfStock && onAdd(product)}
                                        disabled={isOutOfStock}
                                    >
                                        {isOutOfStock ? 'Notify Me' : (
                                            <>
                                                <Plus className="w-3 h-3" />
                                                Add Item
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProductRecommendations;
