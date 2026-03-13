import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import api from '@/lib/api';
import { db } from '@/lib/localDb';
import { isOnline, queueRequest, syncNow } from '@/lib/syncEngine';
import { toast } from 'sonner';

// Simple UUID generator
const newId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export const fetchInvoiceById = async (id: string) => {
    const invoice = await db.invoices.get(id);
    if (!invoice) return null;
    const items = await db.invoiceItems.where('invoice_id').equals(id).toArray();
    return { ...invoice, items };
};

export const fetchProductById = async (id: string) => {
    return await db.products.get(id);
};

export const fetchClientById = async (id: string) => {
    return await db.clients.get(id);
};

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

export const useProducts = () => {
    const products = useLiveQuery(() => db.products.orderBy('name').toArray(), []);
    return {
        data: products || [],
        isLoading: products === undefined,
        isSuccess: products !== undefined
    };
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return {
        mutate: async (productData: any) => {
            const id = newId();
            const now = Date.now();
            const dataWithId = {
                ...productData,
                id,
                created_at: new Date().toISOString(),
                _sync: isOnline() ? 'synced' : 'pending_create',
                _local_updated_at: now
            };

            await db.products.add(dataWithId);

            if (isOnline()) {
                try {
                    await api.post('/products', productData);
                    await syncNow(true);
                } catch {
                    await db.products.update(id, { _sync: 'pending_create' });
                    await queueRequest('POST', '/products', productData, 'product', id);
                }
            } else {
                await queueRequest('POST', '/products', productData, 'product', id);
                toast.info('📵 Product saved locally – will sync when online');
            }
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    };
};

export const useUpdateProduct = () => {
    return {
        mutate: async ({ id, ...data }: any) => {
            await db.products.update(id, {
                ...data,
                _sync: isOnline() ? 'synced' : 'pending_update',
                _local_updated_at: Date.now(),
            });

            if (isOnline()) {
                try {
                    await api.put(`/products/${id}`, data);
                    await syncNow(true);
                } catch {
                    await db.products.update(id, { _sync: 'pending_update' });
                    await queueRequest('PUT', `/products/${id}`, data, 'product', id);
                }
            } else {
                await queueRequest('PUT', `/products/${id}`, data, 'product', id);
            }
        }
    };
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return {
        mutate: async (id: string) => {
            await db.products.update(id, { _sync: 'pending_delete', _local_updated_at: Date.now() });

            if (isOnline()) {
                try {
                    await api.delete(`/products/${id}`);
                    await db.products.delete(id);
                    await syncNow(true);
                } catch {
                    await queueRequest('DELETE', `/products/${id}`, null, 'product', id);
                }
            } else {
                await queueRequest('DELETE', `/products/${id}`, null, 'product', id);
                toast.info('📵 Deletion queued – will sync when online');
            }
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    };
};

export const useProductRecommendations = (productId: string | null, limit: number = 4) => {
    return useQuery({
        queryKey: ['product-recommendations', productId, limit],
        queryFn: async () => {
            if (!productId) return [];
            try {
                const response = await api.get<any[]>(`/products/${productId}/recommendations?limit=${limit}`);
                return response.data.map(p => ({
                    ...p,
                    price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
                }));
            } catch {
                // Offline fallback: find products in same category from local DB
                const currentProduct = await db.products.get(productId!);
                if (!currentProduct) return [];
                const related = await db.products
                    .where('category')
                    .equals(currentProduct.category || '')
                    .limit(limit + 1)
                    .toArray();
                return related.filter(p => p.id !== productId).slice(0, limit);
            }
        },
        enabled: !!productId,
    });
};

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

export const useClients = () => {
    const clients = useLiveQuery(() => db.clients.orderBy('name').toArray(), []);
    return {
        data: clients || [],
        isLoading: clients === undefined,
        isSuccess: clients !== undefined
    };
};

export const useCreateClient = () => {
    const queryClient = useQueryClient();
    return {
        mutate: async (clientData: any) => {
            const id = newId();
            const now = Date.now();
            await db.clients.add({
                ...clientData,
                id,
                created_at: new Date().toISOString(),
                _sync: isOnline() ? 'synced' : 'pending_create',
                _local_updated_at: now,
                totalInvoices: 0
            });

            if (isOnline()) {
                try {
                    await api.post('/clients', clientData);
                    await syncNow(true);
                } catch {
                    await db.clients.update(id, { _sync: 'pending_create' });
                    await queueRequest('POST', '/clients', clientData, 'client', id);
                }
            } else {
                await queueRequest('POST', '/clients', clientData, 'client', id);
                toast.info('📵 Client saved locally – will sync when online');
            }
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    };
};

export const useUpdateClient = () => {
    return {
        mutate: async ({ id, ...data }: any) => {
            await db.clients.update(id, {
                ...data,
                _sync: isOnline() ? 'synced' : 'pending_update',
                _local_updated_at: Date.now(),
            });

            if (isOnline()) {
                try {
                    await api.put(`/clients/${id}`, data);
                    await syncNow(true);
                } catch {
                    await db.clients.update(id, { _sync: 'pending_update' });
                    await queueRequest('PUT', `/clients/${id}`, data, 'client', id);
                }
            } else {
                await queueRequest('PUT', `/clients/${id}`, data, 'client', id);
            }
        }
    };
};

export const useDeleteClient = () => {
    const queryClient = useQueryClient();
    return {
        mutate: async (id: string) => {
            await db.clients.update(id, { _sync: 'pending_delete', _local_updated_at: Date.now() });

            if (isOnline()) {
                try {
                    await api.delete(`/clients/${id}`);
                    await db.clients.delete(id);
                    await syncNow(true);
                } catch {
                    await queueRequest('DELETE', `/clients/${id}`, null, 'client', id);
                }
            } else {
                await queueRequest('DELETE', `/clients/${id}`, null, 'client', id);
                toast.info('📵 Client deletion queued');
            }
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    };
};

export const useClientInvoices = (clientId: string | null) => {
    const invoices = useLiveQuery(
        () => clientId ? db.invoices.where('client_id').equals(clientId).toArray() : [],
        [clientId]
    );
    return { data: invoices || [], isLoading: invoices === undefined };
};

// ─── INVOICES ─────────────────────────────────────────────────────────────────

export const useInvoices = () => {
    const invoices = useLiveQuery(() => db.invoices.orderBy('created_at').reverse().toArray(), []);
    return {
        data: (invoices || []).map(inv => ({
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            clientId: inv.client_id,
            clientName: inv.client_name,
            date: inv.created_at,
            dueDate: inv.due_date || inv.created_at,
            amount: inv.total_amount,
            status: inv.status,
            _sync: inv._sync
        })),
        isLoading: invoices === undefined
    };
};

export const useCreateInvoice = () => {
    const queryClient = useQueryClient();
    return {
        mutate: async (invoiceData: any) => {
            const id = newId();
            const now = Date.now();

            // Extract items if any (though usually passed as part of invoiceData)
            const { items, ...header } = invoiceData;

            await db.invoices.add({
                ...header,
                id,
                created_at: new Date().toISOString(),
                _sync: isOnline() ? 'synced' : 'pending_create',
                _local_updated_at: now,
            });

            if (isOnline()) {
                try {
                    await api.post('/invoices', invoiceData);
                    await syncNow(true);
                } catch {
                    await db.invoices.update(id, { _sync: 'pending_create' });
                    await queueRequest('POST', '/invoices', invoiceData, 'invoice', id);
                }
            } else {
                await queueRequest('POST', '/invoices', invoiceData, 'invoice', id);
                toast.info('📵 Invoice saved locally');
            }
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    };
};

export const useDeleteInvoice = () => {
    const queryClient = useQueryClient();
    return {
        mutate: async (id: string) => {
            await db.invoices.update(id, { _sync: 'pending_delete', _local_updated_at: Date.now() });

            if (isOnline()) {
                try {
                    await api.delete(`/invoices/${id}`);
                    await db.invoices.delete(id);
                    await syncNow(true);
                } catch {
                    await queueRequest('DELETE', `/invoices/${id}`, null, 'invoice', id);
                }
            } else {
                await queueRequest('DELETE', `/invoices/${id}`, null, 'invoice', id);
            }
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    };
};

export const useUpdateInvoice = () => {
    return {
        mutate: async ({ id, ...data }: any) => {
            await db.invoices.update(id, {
                ...data,
                _sync: isOnline() ? 'synced' : 'pending_update',
                _local_updated_at: Date.now(),
            });

            if (isOnline()) {
                try {
                    await api.put(`/invoices/${id}`, data);
                    await syncNow(true);
                } catch {
                    await db.invoices.update(id, { _sync: 'pending_update' });
                    await queueRequest('PUT', `/invoices/${id}`, data, 'invoice', id);
                }
            } else {
                await queueRequest('PUT', `/invoices/${id}`, data, 'invoice', id);
            }
        }
    };
};

export const useInvoice = (id: string | null) => {
    const invoice = useLiveQuery(() => id ? db.invoices.get(id) : null, [id]);
    const items = useLiveQuery(() => id ? db.invoiceItems.where('invoice_id').equals(id).toArray() : [], [id]);

    return {
        data: invoice ? { ...invoice, items } : null,
        isLoading: invoice === undefined
    };
};

export const useStats = () => {
    const productsCount = useLiveQuery(() => db.products.count(), []);
    const clientsCount = useLiveQuery(() => db.clients.count(), []);
    const invoices = useLiveQuery(() => db.invoices.toArray(), []);

    const isLoading = productsCount === undefined || clientsCount === undefined || invoices === undefined;

    if (isLoading) return { isLoading: true };

    const revenue = invoices!.filter(i => i.status.toLowerCase() === 'paid').reduce((sum, i) => sum + i.total_amount, 0);
    const pending = invoices!.filter(i => i.status.toLowerCase() === 'pending').reduce((sum, i) => sum + i.total_amount, 0);

    return {
        data: {
            totalProducts: productsCount,
            totalClients: clientsCount,
            totalInvoices: invoices!.length,
            revenue,
            pending,
            recentActivity: [] // Could be derived from _local_updated_at if needed
        },
        isLoading: false
    };
};

export const useMyInvoices = () => {
    // Client portal invoices - for now just reuse useInvoices but filtered by some client logic if we had one
    // In a real app, this would be a specific API call, but we can return local invoices as a fallback.
    return useInvoices();
};

export const useUser = () => {
    return useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const response = await api.get('/auth/me');
                return response.data;
            } catch {
                return JSON.parse(localStorage.getItem('user') || 'null');
            }
        },
        retry: false,
    });
};

export const useCreatePublicOrder = () => {
    return useMutation({
        mutationFn: async (orderData: { customer: any, items: any[] }) => {
            if (isOnline()) {
                return api.post('/invoices/public', orderData);
            } else {
                // For public orders offline, we could save as a special pending invoice
                // But let's just use the sync engine queue
                const tempId = newId();
                await queueRequest('POST', '/invoices/public', orderData, 'invoice', tempId);
                toast.success('📵 Order saved locally – will submit when online');
                return { data: { success: true, offline: true } };
            }
        },
    });
};
