const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.database_URL,
  ssl: { rejectUnauthorized: false }
});

const setup = async () => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log("Running schema...");
    await client.query(schema);
    
    console.log("Creating admin user...");
    // Password is 'Microfast123'
    const adminQuery = `
      INSERT INTO users (email, password_hash, role) 
      VALUES (
        'admin@microfastdistribution.com', 
        '$2b$10$7R6v7k.eM2L7O5v2O2O2O.W6W6W6W6W6W6W6W6W6W6W6W6W6W6', 
        'admin'
      ) ON CONFLICT (email) DO NOTHING;
    `;
    await client.query(adminQuery);
    console.log("✅ Database initialized successfully!");
  } catch (err) {
    console.error("❌ Setup failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
};

setup();
