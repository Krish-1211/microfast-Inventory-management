const pool = require('../config/db');

class UserModel {
    static async findByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async create({ email, password_hash, role = 'client' }) {
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
            [email, password_hash, role]
        );
        return result.rows[0];
    }
}

module.exports = UserModel;
