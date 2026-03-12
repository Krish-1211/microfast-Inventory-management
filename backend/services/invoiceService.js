const pool = require('../config/db');
const InvoiceModel = require('../models/invoiceModel');
const InvoiceItemModel = require('../models/invoiceItemModel');
const ProductModel = require('../models/productModel');

class InvoiceService {
    static async createOrder({ customer, items }) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            console.log('Using client transaction for order creation');

            // 1. Find or Create Client
            let clientId;
            const clientRes = await client.query('SELECT id FROM clients WHERE email = $1', [customer.email]);

            if (clientRes.rows.length > 0) {
                clientId = clientRes.rows[0].id;
            } else {
                const newClientRes = await client.query(
                    'INSERT INTO clients (name, email, phone, company, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                    [customer.name, customer.email, customer.phone, customer.company || 'Individual', 'active']
                );
                clientId = newClientRes.rows[0].id;
            }

            // 2. Generate Invoice Number (Simple Auto-increment logic or Random for now to avoid collision in simple demo)
            // A better way is to query max id or use a sequence, but let's stick to a timestamp based one for simplicity
            const invoiceNumber = `ORD-${Date.now()}`;

            // 3. Calculate Transasction (Reuse logic logic?)
            // We can't easily reuse createInvoice because it manages its own transaction/connection. 
            // Better to duplicate the item logic here or refactor createInvoice to accept a client connection.
            // Let's duplicate strictly for this "Public Order" flow to keep it isolated.

            let total_amount = 0;
            const processedItems = items.map(item => {
                // item.price should ideally come from DB to prevent tampering, but we'll trust frontend for this demo
                // OR fetch product price here. Let's fetch to be safe.
                return { ...item }; // We will fetch price in the loop below
            });

            // Re-fetch prices
            for (let i = 0; i < processedItems.length; i++) {
                const pRes = await client.query('SELECT price FROM products WHERE id = $1', [processedItems[i].productId]);
                if (pRes.rows.length > 0) {
                    processedItems[i].price = parseFloat(pRes.rows[0].price);
                } else {
                    processedItems[i].price = 0;
                }
                const itemTotal = (processedItems[i].price || 0) * processedItems[i].quantity;
                total_amount += itemTotal;
            }

            const query = `
                INSERT INTO invoices (invoice_number, client_id, total_amount, status, due_date, lpo_no, exempt)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            // Default due date: 7 days from now
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);

            const values = [invoiceNumber, clientId, total_amount, 'pending', dueDate, null, false];

            const invoiceResult = await client.query(query, values);
            const invoice = invoiceResult.rows[0];

            for (const item of processedItems) {
                await client.query(
                    'INSERT INTO invoice_items (invoice_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                    [invoice.id, item.productId, item.quantity, item.price]
                );
                // Deduct stock
                await client.query(
                    'UPDATE products SET stock = stock - $1 WHERE id = $2',
                    [item.quantity, item.productId]
                );
            }

            await client.query('COMMIT');
            return invoice;

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async createInvoice({ clientId, items, invoiceNumber, status, dueDate, taxes, lpo_no, exempt }) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            let subtotal = 0;
            const processedItems = items.map(item => {
                const itemTotal = (item.price || 0) * item.quantity;
                subtotal += itemTotal;
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                };
            });

            const validTaxes = Array.isArray(taxes) ? taxes : [];
            let totalTaxAmount = 0;
            validTaxes.forEach(t => {
                const r = parseFloat(t.rate) || 0;
                totalTaxAmount += subtotal * (r / 100);
            });
            const total_amount = subtotal + totalTaxAmount;

            const taxesJson = JSON.stringify(validTaxes.map(t => ({ name: t.name || 'Tax', rate: parseFloat(t.rate) || 0 })));

            const query = `
                INSERT INTO invoices (invoice_number, client_id, total_amount, status, due_date, taxes, lpo_no, exempt)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;
            const values = [invoiceNumber, clientId, total_amount, status || 'pending', dueDate || null, taxesJson, lpo_no || null, exempt || false];

            const invoiceResult = await client.query(query, values);
            const invoice = invoiceResult.rows[0];

            for (const item of processedItems) {
                await client.query(
                    'INSERT INTO invoice_items (invoice_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                    [invoice.id, item.productId, item.quantity, item.price]
                );
                // Deduct stock for non-draft invoices
                if (status !== 'draft') {
                    await client.query(
                        'UPDATE products SET stock = stock - $1 WHERE id = $2',
                        [item.quantity, item.productId]
                    );
                }
            }

            await client.query('COMMIT');
            return invoice;

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async updateInvoice(id, { clientId, items, invoiceNumber, status, dueDate, taxes, lpo_no, exempt }) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Fetch old items for stock reconciliation
            const oldItemsRes = await client.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [id]);
            const oldInvoiceRes = await client.query('SELECT status FROM invoices WHERE id = $1', [id]);
            const oldInvoice = oldInvoiceRes.rows[0];

            if (!oldInvoice) throw new Error('Invoice not found');

            // 2. Reverse stock impact of old items (only if old status was NOT draft)
            if (oldInvoice.status !== 'draft' && oldInvoice.status !== 'Draft') {
                for (const item of oldItemsRes.rows) {
                    await client.query(
                        'UPDATE products SET stock = stock + $1 WHERE id = $2',
                        [item.quantity, item.product_id]
                    );
                }
            }

            // 3. Delete old items
            await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

            // 4. Calculate new totals
            let subtotal = 0;
            const processedItems = items.map(item => {
                const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
                subtotal += itemTotal;
                return {
                    productId: item.productId,
                    quantity: parseInt(item.quantity) || 0,
                    price: parseFloat(item.price) || 0
                };
            });

            const validTaxes = Array.isArray(taxes) ? taxes : [];
            let totalTaxAmount = 0;
            validTaxes.forEach(t => {
                const r = parseFloat(t.rate) || 0;
                totalTaxAmount += subtotal * (r / 100);
            });
            const total_amount = subtotal + totalTaxAmount;
            const taxesJson = JSON.stringify(validTaxes.map(t => ({ name: t.name || 'Tax', rate: parseFloat(t.rate) || 0 })));

            // 5. Update Invoice
            const updateQuery = `
                UPDATE invoices 
                SET client_id = $1, invoice_number = $2, total_amount = $3, status = $4, due_date = $5, taxes = $6, lpo_no = $7, exempt = $8, updated_at = NOW()
                WHERE id = $9
                RETURNING *
            `;
            const updateValues = [clientId, invoiceNumber, total_amount, status, dueDate || null, taxesJson, lpo_no || null, exempt || false, id];
            const invoiceResult = await client.query(updateQuery, updateValues);
            const invoice = invoiceResult.rows[0];

            // 6. Insert new items & Apply stock impact (only if new status is NOT draft)
            for (const item of processedItems) {
                await client.query(
                    'INSERT INTO invoice_items (invoice_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                    [id, item.productId, item.quantity, item.price]
                );

                if (status !== 'draft' && status !== 'Draft') {
                    await client.query(
                        'UPDATE products SET stock = stock - $1 WHERE id = $2',
                        [item.quantity, item.productId]
                    );
                }
            }

            await client.query('COMMIT');
            return invoice;

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async getInvoiceById(id) {
        const invoice = await InvoiceModel.findById(id);
        if (!invoice) return null;

        const items = await pool.query(`
      SELECT ii.*, p.name as product_name 
      FROM invoice_items ii
      JOIN products p ON ii.product_id = p.id
      WHERE ii.invoice_id = $1
    `, [id]);

        return { ...invoice, items: items.rows };
    }

    static async getAllInvoices() {
        return await InvoiceModel.findAll();
    }

    static async getClientInvoices(clientId) {
        return await InvoiceModel.findByClientId(clientId);
    }
}

module.exports = InvoiceService;
