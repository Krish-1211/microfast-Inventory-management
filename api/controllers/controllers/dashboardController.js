const pool = require('../config/db');

const getStats = async (req, res) => {
    try {
        const invoiceCount = await pool.query('SELECT COUNT(*) FROM invoices');
        const productCount = await pool.query('SELECT COUNT(*) FROM products');
        const clientCount = await pool.query('SELECT COUNT(*) FROM clients');
        const revenue = await pool.query("SELECT SUM(total_amount) FROM invoices WHERE status = 'paid'");
        const pending = await pool.query("SELECT SUM(total_amount) FROM invoices WHERE status = 'pending'");

        const recentInvoices = await pool.query("SELECT id, invoice_number, created_at FROM invoices ORDER BY created_at DESC LIMIT 5");
        const recentProducts = await pool.query("SELECT id, name, created_at FROM products ORDER BY created_at DESC LIMIT 5");
        const recentClients = await pool.query("SELECT id, name, created_at FROM clients ORDER BY created_at DESC LIMIT 5");

        const activity = [
            ...recentInvoices.rows.map(i => ({
                id: `inv-${i.id}`,
                type: 'invoice',
                desc: `Invoice #${i.invoice_number} created`,
                time: i.created_at
            })),
            ...recentProducts.rows.map(p => ({
                id: `prod-${p.id}`,
                type: 'product',
                desc: `Product "${p.name}" added`,
                time: p.created_at
            })),
            ...recentClients.rows.map(c => ({
                id: `client-${c.id}`,
                type: 'client',
                desc: `New client ${c.name}`,
                time: c.created_at
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

        res.json({
            totalInvoices: parseInt(invoiceCount.rows[0].count),
            totalProducts: parseInt(productCount.rows[0].count),
            totalClients: parseInt(clientCount.rows[0].count),
            totalRevenue: parseFloat(revenue.rows[0].sum || 0),
            totalPending: parseFloat(pending.rows[0].sum || 0),
            recentActivity: activity
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStats,
};
