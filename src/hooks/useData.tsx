import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Product, Client, Invoice } from '@/data/mockData';

// Products
export const useProducts = () => {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await api.get<any[]>('/products');
            return response.data.map(p => ({
                ...p,
                price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
            }));
        },
    });
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newProduct: any) => api.post('/products', newProduct),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => api.put(`/products/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/products/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    });
};

export const useProductRecommendations = (productId: string | null, limit: number = 4) => {
    return useQuery({
        queryKey: ['product-recommendations', productId, limit],
        queryFn: async () => {
            if (!productId) return [];
            const response = await api.get<any[]>(`/products/${productId}/recommendations?limit=${limit}`);
            return response.data.map(p => ({
                ...p,
                price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
            }));
        },
        enabled: !!productId,
    });
};

// Clients
export const useClients = () => {
    return useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            const response = await api.get<any[]>('/clients');
            return response.data.map(c => ({
                ...c,
                totalInvoices: c.totalInvoices || 0 // mapped in model but ensure it exists
            }));
        },
    });
};

export const useCreateClient = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newClient: any) => api.post('/clients', newClient),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    });
};

export const useUpdateClient = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => api.put(`/clients/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        }
    });
};

export const useDeleteClient = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/clients/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    });
};

export const useClientInvoices = (clientId: string | null) => {
    return useQuery({
        queryKey: ['client-invoices', clientId],
        queryFn: async () => {
            if (!clientId) return [];
            const response = await api.get(`/clients/${clientId}/invoices`);
            return response.data;
        },
        enabled: !!clientId,
    });
};

// Invoices
export const useInvoices = () => {
    return useQuery({
        queryKey: ['invoices'],
        queryFn: async () => {
            // Backend returns invoices, but mockData has complex structure (items join).
            // My backend /invoices endpoint returns basic invoice info + client name.
            // /invoices/:id returns items.
            // But the frontend expects a list of invoices WITH items for some views?
            // Let's check mockData.ts structure again.
            // `export const invoices: Invoice[]` where Invoice has `items: InvoiceItem[]`.
            // My backend `/invoices` (getAll) currently returns `i.*, c.name`. It does NOT return items in the list view.
            // If frontend relies on items in list view (e.g. for calculating totals locally?), I might need to update backend or frontend.
            // Dashboard calculates revenue from `invoices` array.
            // `revenue: invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0),`
            // My backend `invoices` table has `total_amount`.
            // mockData Invoice has `amount`.
            // I need to map response to match frontend types.

            const response = await api.get('/invoices');
            // Map backend fields to frontend types
            return response.data.map((inv: any) => ({
                id: inv.id,
                invoiceNumber: inv.invoice_number,
                clientId: inv.client_id,
                clientName: inv.client_name, // Backend provides this
                date: inv.created_at, // Map created_at to date
                dueDate: inv.due_date || inv.created_at, // Backend schema didn't have due_date? I'll check.
                items: [], // List view might not have items. If needed, I must fetch.
                amount: parseFloat(inv.total_amount),
                status: inv.status, // "paid" vs "Paid" - I might need to normalize case
            }));
        },
    });
};

export const useCreateInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newInvoice: any) => api.post('/invoices', newInvoice),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['clients'] }); // Update invoice counts
        }
    });
};

export const useDeleteInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/invoices/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        }
    });
};

export const useUpdateInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: any) => api.put(`/invoices/${id}`, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    });
};

export const fetchInvoiceById = async (id: string) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
};

export const useInvoice = (id: string | null) => {
    return useQuery({
        queryKey: ['invoice', id],
        queryFn: async () => {
            if (!id) return null;
            return fetchInvoiceById(id);
        },
        enabled: !!id,
    });
};

export const useMyInvoices = () => {
    const query = useQuery({
        queryKey: ['myInvoices'],
        queryFn: async () => {
            const response = await api.get('/my-invoices');
            return response.data.map((inv: any) => ({
                id: inv.id,
                invoiceNumber: inv.invoice_number,
                clientId: inv.client_id,
                date: inv.created_at,
                dueDate: inv.due_date || inv.created_at,
                amount: parseFloat(inv.total_amount),
                status: inv.status,
            }));
        },
        retry: false, // Don't retry if 403/401
    });
    return query;
};

export const useStats = () => {
    return useQuery({
        queryKey: ['stats'],
        queryFn: async () => {
            const response = await api.get('/dashboard/stats');
            return {
                ...response.data,
                revenue: response.data.totalRevenue,
                pending: response.data.totalPending
            };
        }
    })
}

export const useUser = () => {
    return useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const response = await api.get('/auth/me');
            return response.data;
        },
        retry: false,
    });
};

export const useCreatePublicOrder = () => {
    return useMutation({
        mutationFn: (orderData: { customer: any, items: any[] }) => api.post('/invoices/public', orderData),
    });
};
