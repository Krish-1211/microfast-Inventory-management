const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS taxes JSONB DEFAULT '[]'::jsonb;`);
        console.log('Migration successful');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

run();
