/**
 * scripts/list_all_tables.js
 * Prints all tables in the sagara_revamp database sorted alphabetically.
 * Usage: node scripts/list_all_tables.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

const client = new Client(
  process.env.DATABASE_URL || 'postgres://postgres:alex12345@localhost:5432/sagara_revamp'
);

async function listAllTables() {
  try {
    await client.connect();
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('\nAll tables in sagara_revamp:');
    res.rows.forEach(r => console.log(` - ${r.table_name}`));
  } catch (err) {
    console.error('❌ Failed to list tables:', err.message);
  } finally {
    await client.end();
  }
}

listAllTables();
