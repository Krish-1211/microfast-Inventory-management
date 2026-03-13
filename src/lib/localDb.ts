/**
 * localDb.ts
 * 
 * Offline-first local database using Dexie (IndexedDB wrapper).
 * All data is stored locally, then synced to the cloud when online.
 */
import Dexie, { Table } from 'dexie';

export type SyncStatus = 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';

export interface LocalClient {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    tin?: string;
    vrn?: string;
    status: string;
    created_at?: string;
    _sync: SyncStatus;
    _local_updated_at: number; // timestamp
}

export interface LocalProduct {
    id: string;
    name: string;
    price: number;
    stock: number;
    category?: string;
    status: string;
    created_at?: string;
    _sync: SyncStatus;
    _local_updated_at: number;
}

export interface LocalInvoice {
    id: string;
    invoice_number: string;
    client_id: string;
    client_name?: string;
    total_amount: number;
    status: string;
    due_date?: string;
    lpo_no?: string;
    exempt?: boolean;
    taxes?: string;
    created_at?: string;
    _sync: SyncStatus;
    _local_updated_at: number;
}

export interface LocalInvoiceItem {
    id: string;
    invoice_id: string;
    product_id: string;
    product_name?: string;
    quantity: number;
    price: number;
    _sync: SyncStatus;
}

export interface PendingRequest {
    id?: number; // autoincrement
    method: 'POST' | 'PUT' | 'DELETE';
    url: string;
    body?: any;
    entity_type: 'client' | 'product' | 'invoice';
    entity_id: string;
    created_at: number;
}

export interface LocalUser {
    id: string;
    email: string;
    password?: string; // stored only for offline verification
    role: string;
    token?: string;
    last_login?: number;
}

class MicrofastDB extends Dexie {
    clients!: Table<LocalClient>;
    products!: Table<LocalProduct>;
    invoices!: Table<LocalInvoice>;
    invoiceItems!: Table<LocalInvoiceItem>;
    pendingRequests!: Table<PendingRequest>;
    users!: Table<LocalUser>;

    constructor() {
        super('MicrofastOfflineDB');
        this.version(3).stores({
            clients: 'id, name, email, status, _sync, created_at',
            products: 'id, name, category, status, _sync, created_at',
            invoices: 'id, invoice_number, client_id, status, _sync, created_at',
            invoiceItems: 'id, invoice_id, product_id, _sync',
            pendingRequests: '++id, method, url, entity_type, entity_id, created_at',
            users: 'id, email',
        });
    }
}

export const db = new MicrofastDB();
