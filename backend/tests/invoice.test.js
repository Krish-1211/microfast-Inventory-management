const request = require('supertest');
const express = require('express');

// Mock db/pool
const mockQuery = jest.fn();
const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
    connect: jest.fn() // Ensure it returns itself or similar
};

jest.mock('../config/db', () => ({
    query: mockQuery,
    connect: jest.fn(() => Promise.resolve(mockClient))
}));

// Mock Auth
jest.mock('../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = { id: 1, email: 'admin@test.com', role: 'admin' };
        next();
    },
    admin: (req, res, next) => {
        if (req.user.role === 'admin') next();
        else res.status(403).json({ message: 'Not admin' });
    }
}));

const db = require('../config/db');

const app = express();
app.use(express.json());
app.use('/invoices', require('../routes/invoiceRoutes'));

describe('Invoice API (Transaction Mock)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mock returns
        db.connect.mockResolvedValue(mockClient);
    });

    it('POST /invoices - creates invoice and items transactionally', async () => {
        const payload = {
            invoice_number: 'INV-100',
            client_id: 'client-1',
            items: [
                { product_id: 'prod-1', quantity: 2 },
                { product_id: 'prod-2', quantity: 1 }
            ]
        };

        // 1. Mock finding products (looped in Service)
        // Need to mock ProductModel findById behavior when queried inside service.
        // But ProductModel calls `pool.query`.
        // So `mockQuery` or `mockClient.query` will be called.
        // Wait, InvoiceService uses `pool.connect()` to get a client for transaction.
        // Then it uses `client.query` for transaction steps?
        // Let's check InvoiceService.js:
        // `const client = await pool.connect();`
        // `await client.query('BEGIN');`
        // `const product = await ProductModel.findById(item.product_id);` -> This uses `pool.query` (static method in model).
        // Ah, ProductModel uses `pool.query`, not the transaction client! This is a potential bug if we want full isolation, but for reading it's fine.
        // So we mock `pool.query` for product lookups.

        // Mock Product 1
        mockQuery
            .mockResolvedValueOnce({ rows: [{ id: 'prod-1', name: 'P1', price: 10 }] }) // Product 1
            .mockResolvedValueOnce({ rows: [{ id: 'prod-2', name: 'P2', price: 20 }] }); // Product 2

        // Mock Transaction calls on `client`
        // 1. BEGIN
        // 2. INSERT Invoice
        // 3. INSERT Item 1
        // 4. INSERT Item 2
        // 5. COMMIT

        mockClient.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rows: [{ id: 'inv-1', total_amount: 40 }] }) // INSERT Invoice
            .mockResolvedValueOnce({}) // INSERT Item 1
            .mockResolvedValueOnce({}) // INSERT Item 2
            .mockResolvedValueOnce({}); // COMMIT

        const res = await request(app).post('/invoices').send(payload);

        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBe('inv-1');

        // Verify transaction flow
        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockClient.release).toHaveBeenCalled();
    });
});
