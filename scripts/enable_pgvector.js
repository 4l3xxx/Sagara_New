/**
 * scripts/enable_pgvector.js
 * Enables the pgvector extension in the sagara_revamp database.
 * Usage: node scripts/enable_pgvector.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

const client = new Client(
  process.env.DATABASE_URL || 'postgres://postgres:alex12345@localhost:5432/sagara_revamp'
);

async function enableVector() {
  try {
    await client.connect();
    console.log('✅ Connected to DB');

    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ pgvector extension enabled!');

    const res = await client.query('SELECT extname FROM pg_extension;');
    console.log('Enabled extensions:', res.rows.map(r => r.extname).join(', '));
  } catch (err) {
    console.error('❌ Failed to enable pgvector:', err.message);
  } finally {
    await client.end();
  }
}

enableVector();
