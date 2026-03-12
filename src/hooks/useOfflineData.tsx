/**
 * useOfflineData.tsx
 * 
 * Offline-first data hooks using Dexie (IndexedDB).
 * When online: data comes from useData.tsx (React Query → API).
 * When offline: data comes from local IndexedDB via Dexie.
 * 
 * All mutations first write locally, then sync to cloud.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/localDb';
import { isOnline, queueRequest, syncNow } from '@/lib/syncEngine';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';


// Simple UUID generator (no external dep needed)
const newId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

export function useOfflineClients() {
    const clients = useLiveQuery(() => db.clients.orderBy('name').toArray(), []);
    return { data: clients || [], isLoading: clients === undefined };
}

export function useOfflineCreateClient() {
    const queryClient = useQueryClient();

    const mutate = async (clientData: any) => {
        const id = newId();
        const now = Date.now();

        // Write to local DB immediately
        await db.clients.add({
            ...clientData,
            id,
            created_at: new Date().toISOString(),
            _sync: isOnline() ? 'synced' : 'pending_create',
            _local_updated_at: now,
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

        queryClient.invalidateQueries({ queryKey: ['clients'] });
    };

    return { mutate };
}

export function useOfflineUpdateClient() {
    const queryClient = useQueryClient();

    const mutate = async ({ id, ...data }: any) => {
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
            toast.info('📵 Client updated locally – will sync when online');
        }

        queryClient.invalidateQueries({ queryKey: ['clients'] });
    };

    return { mutate };
}

export function useOfflineDeleteClient() {
    const queryClient = useQueryClient();

    const mutate = async (id: string) => {
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
            toast.info('📵 Client deletion queued – will sync when online');
        }

        queryClient.invalidateQueries({ queryKey: ['clients'] });
    };

    return { mutate };
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

export function useOfflineProducts() {
    const products = useLiveQuery(() => db.products.orderBy('name').toArray(), []);
    return { data: products || [], isLoading: products === undefined };
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────

export function useOfflineInvoices() {
    const invoices = useLiveQuery(() =>
        db.invoices.orderBy('created_at').reverse().toArray(), []
    );
    return { data: invoices || [], isLoading: invoices === undefined };
}

export function useOfflineClientInvoices(clientId: string | null) {
    const invoices = useLiveQuery(
        () => clientId ? db.invoices.where('client_id').equals(clientId).toArray() : [],
        [clientId]
    );
    return { data: invoices || [], isLoading: invoices === undefined };
}
