const request = require('supertest');
const express = require('express');
const cors = require('cors');

// 1. Mock Database
jest.mock('../config/db', () => ({
    query: jest.fn(),
    connect: jest.fn()
}));

// 2. Mock Auth Middleware
jest.mock('../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = { id: 'test_user_id', email: 'test@example.com', role: 'admin' };
        next();
    },
    admin: (req, res, next) => {
        if (req.user.role === 'admin') next();
        else res.status(403).json({ message: 'Not authorized' });
    }
}));

const db = require('../config/db');

// Import App Routes
const productRoutes = require('../routes/productRoutes');

const app = express();
app.use(express.json());
app.use('/products', productRoutes);

describe('Product API (Mocked Auth & DB)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /products - retrieves all products', async () => {
        const mockProducts = [
            { id: 1, name: 'Product A', price: 100 },
            { id: 2, name: 'Product B', price: 200 }
        ];
        db.query.mockResolvedValue({ rows: mockProducts });

        const res = await request(app).get('/products');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockProducts);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM products'));
    });

    it('POST /products - creates a product (admin)', async () => {
        const newProduct = { name: 'New Prod', price: 50, stock: 10 };
        db.query.mockResolvedValue({ rows: [{ id: 3, ...newProduct, status: 'active' }] });

        const res = await request(app)
            .post('/products')
            .send(newProduct);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id', 3);
        expect(res.body.name).toBe('New Prod');
    });

    it('DELETE /products/:id - deletes a product', async () => {
        db.query.mockResolvedValue({ rows: [{ id: 1 }] }); // Returns deleted row

        const res = await request(app).delete('/products/1');

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Product removed');
    });
});
