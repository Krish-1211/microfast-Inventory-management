const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_name VARCHAR(100), ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2);`);
        console.log('Migration successful');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

run();
