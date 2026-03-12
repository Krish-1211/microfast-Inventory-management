const pool = require('../config/db');

class InvoiceItemModel {
    static async findByInvoiceId(invoiceId) {
        const query = `
      SELECT ii.*, p.name as product_name 
      FROM invoice_items ii 
      LEFT JOIN products p ON ii.product_id = p.id 
      WHERE ii.invoice_id = $1
    `;
        const result = await pool.query(query, [invoiceId]);
        return result.rows;
    }

    static async create(client, { invoice_id, product_id, quantity, price }) {
        // Allows passing a transaction client
        const db = client || pool;
        const result = await db.query(
            'INSERT INTO invoice_items (invoice_id, product_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *',
            [invoice_id, product_id, quantity, price]
        );
        return result.rows[0];
    }
}

module.exports = InvoiceItemModel;
