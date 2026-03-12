const pool = require('../config/db');

class InvoiceModel {
    static async findAll() {
        const query = `
      SELECT i.*, c.name as client_name 
      FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id 
      ORDER BY i.created_at DESC
    `;
        const result = await pool.query(query);
        return result.rows;
    }

    static async findByClientId(clientId) {
        const query = `
      SELECT i.*, c.name as client_name 
      FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id 
      WHERE i.client_id = $1
      ORDER BY i.created_at DESC
    `;
        const result = await pool.query(query, [clientId]);
        return result.rows;
    }

    static async findById(id) {
        const query = `
      SELECT i.*, c.name as client_name, c.email as client_email, c.tin as client_tin, c.vrn as client_vrn
      FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id 
      WHERE i.id = $1
    `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async create(client, { invoice_number, client_id, total_amount, status = 'pending', lpo_no, exempt = false }) {
        // Allows passing a transaction client
        const db = client || pool;
        const result = await db.query(
            'INSERT INTO invoices (invoice_number, client_id, total_amount, status, lpo_no, exempt) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [invoice_number, client_id, total_amount, status, lpo_no, exempt]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

module.exports = InvoiceModel;
