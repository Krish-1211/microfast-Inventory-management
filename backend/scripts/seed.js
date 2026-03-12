const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Mock Data (Expanded)
const products = [
    { id: "p1", name: "Wireless Keyboard", price: 89.99, stock: 124, status: "in_stock", category: "Electronics" },
    { id: "p2", name: "USB-C Hub (7-in-1)", price: 49.99, stock: 8, status: "low_stock", category: "Electronics" },
    { id: "p3", name: "Ergonomic Mouse", price: 65.00, stock: 0, status: "out_of_stock", category: "Electronics" },
    { id: "p4", name: "Standing Desk Mat", price: 38.50, stock: 54, status: "in_stock", category: "Office" },
    { id: "p5", name: "Monitor Arm", price: 120.00, stock: 31, status: "in_stock", category: "Office" },
    { id: "p6", name: "Notebook (A5, 3-pack)", price: 15.99, stock: 5, status: "low_stock", category: "Stationery" },
    { id: "p7", name: "Webcam HD 1080p", price: 79.00, stock: 0, status: "out_of_stock", category: "Electronics" },
    { id: "p8", name: "Cable Management Kit", price: 22.00, stock: 200, status: "in_stock", category: "Office" },
];

const clients = [
    { id: "c1", name: "Alice Johnson", email: "alice@techcorp.io", phone: "+1 555-0101", company: "TechCorp", status: "active" },
    { id: "c2", name: "Bob Martinez", email: "bob@designstudio.com", phone: "+1 555-0102", company: "Design Studio", status: "active" },
    { id: "c3", name: "Clara Wu", email: "clara@startupx.co", phone: "+1 555-0103", company: "StartupX", status: "inactive" },
    { id: "c4", name: "David Kim", email: "david@enterprise.net", phone: "+1 555-0104", company: "Enterprise Ltd.", status: "active" },
    { id: "c5", name: "Eva Rossi", email: "eva@freelance.me", phone: "+1 555-0105", company: "Freelance", status: "active" },
];

const invoices = [
    {
        id: "inv1", invoiceNumber: "MFD-2026-001", clientId: "c1",
        dueDate: "2026-04-15",
        items: [{ productId: "p1", quantity: 2, price: 89.99 }],
        total: 179.98, status: "paid",
    },
    {
        id: "inv2", invoiceNumber: "MFD-2026-002", clientId: "c4",
        dueDate: "2026-04-20",
        items: [
            { productId: "p5", quantity: 3, price: 120.00 },
            { productId: "p4", quantity: 3, price: 38.50 },
        ],
        total: 475.50, status: "pending",
    },
    {
        id: "inv3", invoiceNumber: "MFD-2026-003", clientId: "c2",
        dueDate: "2026-03-01",
        items: [{ productId: "p2", quantity: 5, price: 49.99 }],
        total: 249.95, status: "overdue",
    },
    {
        id: "inv4", invoiceNumber: "MFD-2026-004", clientId: "c5",
        dueDate: "2026-05-01",
        items: [{ productId: "p8", quantity: 10, price: 22.00 }],
        total: 220.00, status: "draft",
    },
    {
        id: "inv5", invoiceNumber: "MFD-2026-005", clientId: "c1",
        dueDate: "2026-05-10",
        items: [{ productId: "p6", quantity: 4, price: 15.99 }],
        total: 63.96, status: "paid",
    },
];

const seed = async () => {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Clear Data
            console.log('Clearing old data...');
            await client.query('TRUNCATE TABLE invoice_items, invoices, products, clients, users RESTART IDENTITY CASCADE');

            // 2. Insert Users
            console.log('Inserting Users...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Microfast123', salt);

            // Admin
            await client.query(
                `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)`,
                ['admin@microfastdistribution.com', hashedPassword, 'admin']
            );

            // Client (Alice)
            await client.query(
                `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)`,
                ['alice@techcorp.io', hashedPassword, 'client']
            );

            // 3. Insert Clients & Map IDs
            console.log('Inserting Clients...');
            const clientMap = {}; // oldId -> newUuid
            for (const c of clients) {
                const res = await client.query(
                    `INSERT INTO clients (name, email, phone, company, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [c.name, c.email, c.phone, c.company, c.status]
                );
                clientMap[c.id] = res.rows[0].id;
            }

            // 4. Insert Products & Map IDs
            console.log('Inserting Products...');
            const productMap = {}; // oldId -> newUuid
            for (const p of products) {
                const res = await client.query(
                    `INSERT INTO products (name, price, stock, category, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [p.name, p.price, p.stock, p.category, p.status]
                );
                productMap[p.id] = res.rows[0].id;
            }

            // 5. Insert Invoices & Items
            console.log('Inserting Invoices...');
            for (const inv of invoices) {
                const newClientId = clientMap[inv.clientId];
                if (!newClientId) {
                    console.warn(`Client ${inv.clientId} not found for invoice ${inv.id}`);
                    continue;
                }

                const res = await client.query(
                    `INSERT INTO invoices (invoice_number, client_id, total_amount, status, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [inv.invoiceNumber, newClientId, inv.total, inv.status, inv.dueDate]
                );
                const newInvoiceId = res.rows[0].id;

                for (const item of inv.items) {
                    const newProductId = productMap[item.productId];
                    if (!newProductId) {
                        console.warn(`Product ${item.productId} not found for invoice ${inv.id}`);
                        continue;
                    }

                    await client.query(
                        `INSERT INTO invoice_items (invoice_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
                        [newInvoiceId, newProductId, item.quantity, item.price]
                    );
                }
            }

            await client.query('COMMIT');
            console.log('Seeding completed successfully!');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await pool.end();
    }
};

seed();
