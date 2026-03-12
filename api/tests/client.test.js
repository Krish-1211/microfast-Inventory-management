const request = require('supertest');
const express = require('express');

// 1. Mock DB
jest.mock('../config/db');

// 2. Mock Auth Middleware
jest.mock('../middleware/authMiddleware', () => ({
    protect: jest.fn((req, res, next) => {
        req.user = { id: 99, email: 'admin@test.com', role: 'admin' };
        next();
    }),
    admin: jest.fn((req, res, next) => {
        if (req.user && req.user.role === 'admin') next();
        else res.status(403).json({ message: 'Not authorized as an admin' });
    })
}));

const db = require('../config/db');
const clientRoutes = require('../routes/clientRoutes');

const app = express();
app.use(express.json());
app.use('/clients', clientRoutes);

describe('Client API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /clients - Admin retrieves all clients', async () => {
        const mockClients = [{ id: 1, name: 'Client A' }, { id: 2, name: 'Client B' }];
        db.query.mockResolvedValueOnce({ rows: mockClients });

        const res = await request(app).get('/clients');

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(2);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM clients'));
    });

    it('POST /clients - Admin creates a client', async () => {
        const newClient = { name: 'Client New', email: 'new@client.com', status: 'active' };
        db.query.mockResolvedValueOnce({ rows: [{ id: 3, ...newClient }] });

        const res = await request(app).post('/clients').send(newClient);

        expect(res.statusCode).toBe(201);
        expect(res.body.email).toBe('new@client.com');
    });
});
