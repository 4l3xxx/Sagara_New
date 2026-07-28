/**
 * scripts/check_sagara_revamp.js
 * Verifies connection to sagara_revamp DB and prints table + column info.
 * Usage: node scripts/check_sagara_revamp.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

const client = new Client(
  process.env.DATABASE_URL || 'postgres://postgres:alex12345@localhost:5432/sagara_revamp'
);

async function check() {
  try {
    await client.connect();
    console.log('✅ Connected to database: sagara_revamp\n');

    const tablesRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('--- Tables in public schema ---');
    tablesRes.rows.forEach(r => console.log(` - ${r.table_name}`));

    console.log('\n--- Columns in "jobs" table ---');
    const colsRes = await client.query(
      "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'jobs' ORDER BY ordinal_position"
    );
    colsRes.rows.forEach(c => console.log(`  * ${c.column_name} (${c.data_type}, Nullable: ${c.is_nullable})`));

  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await client.end();
  }
}

check();
