/**
 * syncEngine.ts
 * 
 * Handles bidirectional sync between local IndexedDB and the cloud API.
 * - Pull: Fetches latest data from cloud → stores in local DB
 * - Push: Sends pending local changes to cloud → marks as synced
 * - Auto-triggers on app load and when network comes back online
 */
import { db } from './localDb';
import api from './api';
import { toast } from 'sonner';

let isSyncing = false;

// ─── PULL (Cloud → Local) ────────────────────────────────────────────────────

async function pullClients() {
    const res = await api.get('/clients');
    await db.clients.bulkPut(
        res.data.map((c: any) => ({
            ...c,
            _sync: 'synced' as const,
            _local_updated_at: Date.now(),
        }))
    );
}

async function pullProducts() {
    const res = await api.get('/products');
    await db.products.bulkPut(
        res.data.map((p: any) => ({
            ...p,
            price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
            _sync: 'synced' as const,
            _local_updated_at: Date.now(),
        }))
    );
}

async function pullInvoices() {
    const res = await api.get('/invoices');
    await db.invoices.bulkPut(
        res.data.map((inv: any) => ({
            ...inv,
            total_amount: parseFloat(inv.total_amount),
            _sync: 'synced' as const,
            _local_updated_at: Date.now(),
        }))
    );
}

export async function pullAllData() {
    try {
        await Promise.all([pullClients(), pullProducts(), pullInvoices()]);
        localStorage.setItem('last_sync', new Date().toISOString());
        console.log('[Sync] Pull complete at', new Date().toISOString());
    } catch (err) {
        console.warn('[Sync] Pull failed (probably offline):', err);
    }
}

// ─── PUSH (Local → Cloud) ────────────────────────────────────────────────────

async function pushPendingRequests() {
    const pending = await db.pendingRequests.orderBy('created_at').toArray();
    if (pending.length === 0) return;

    let successCount = 0;
    let failCount = 0;

    for (const req of pending) {
        try {
            if (req.method === 'POST') await api.post(req.url, req.body);
            else if (req.method === 'PUT') await api.put(req.url, req.body);
            else if (req.method === 'DELETE') await api.delete(req.url);

            await db.pendingRequests.delete(req.id!);
            successCount++;
        } catch (err: any) {
            // If it's a network error, stop and try next time
            if (!err.response) {
                console.warn('[Sync] Network unavailable, stopping push.');
                break;
            }
            // If server error – log and skip (don't retry server errors)
            console.error('[Sync] Server rejected request:', err.response?.data);
            await db.pendingRequests.delete(req.id!);
            failCount++;
        }
    }

    if (successCount > 0) {
        console.log(`[Sync] Pushed ${successCount} pending operation(s) to cloud.`);
        // Re-pull fresh data after pushing
        await pullAllData();
    }
}

// ─── FULL SYNC ───────────────────────────────────────────────────────────────

export async function syncNow(quiet = false) {
    if (isSyncing) return;
    if (!navigator.onLine) {
        console.log('[Sync] Offline – skipping sync.');
        return;
    }

    isSyncing = true;
    try {
        await pushPendingRequests();
        await pullAllData();
        if (!quiet) toast.success('✅ Data synced with cloud');
    } catch (err) {
        console.warn('[Sync] Sync cycle error:', err);
    } finally {
        isSyncing = false;
    }
}

// ─── QUEUE OFFLINE MUTATIONS ─────────────────────────────────────────────────

export async function queueRequest(
    method: 'POST' | 'PUT' | 'DELETE',
    url: string,
    body: any,
    entity_type: 'client' | 'product' | 'invoice',
    entity_id: string
) {
    await db.pendingRequests.add({
        method,
        url,
        body,
        entity_type,
        entity_id,
        created_at: Date.now(),
    });
    console.log(`[Sync] Queued ${method} ${url} for later sync.`);
}

// ─── NETWORK LISTENER ────────────────────────────────────────────────────────

export function startNetworkListener() {
    window.addEventListener('online', async () => {
        console.log('[Sync] Network back online. Starting sync…');
        toast.info('🌐 Back online – syncing data…');
        await syncNow(true);
        toast.success('✅ All changes synced to cloud');
    });

    window.addEventListener('offline', () => {
        console.log('[Sync] Went offline. Changes will be queued locally.');
        toast.warning('📵 Offline mode – changes saved locally');
    });
}

// ─── ONLINE CHECK HELPER ─────────────────────────────────────────────────────

export const isOnline = () => navigator.onLine;
