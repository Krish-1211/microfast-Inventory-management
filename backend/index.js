const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const productRoutes = require('./routes/productRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const clientPortalRoutes = require('./routes/clientPortalRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

app.use(cors()); // Allow all origins in production for easier deployment
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});


// Routes with /api prefix
const router = express.Router();
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/products', productRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/my-invoices', clientPortalRoutes);
router.use('/dashboard', dashboardRoutes);

app.use('/api', router);

// Keep root routes for backward compatibility or testing
app.use('/auth', authRoutes);
app.use('/clients', clientRoutes);
app.use('/products', productRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/my-invoices', clientPortalRoutes);
app.use('/dashboard', dashboardRoutes);


app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(500).json({ 
            status: 'error', 
            message: err.message,
            env_check: {
                has_db_url: !!(process.env.DATABASE_URL || process.env.database_URL),
                node_env: process.env.NODE_ENV
            }
        });
    }
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
}

module.exports = app;

