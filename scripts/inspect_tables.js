/**
 * scripts/inspect_tables.js
 * Inspects schema and sample rows for portfolio_items and blog_posts tables.
 * Usage: node scripts/inspect_tables.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

const client = new Client(
  process.env.DATABASE_URL || 'postgres://postgres:alex12345@localhost:5432/sagara_revamp'
);

async function inspect() {
  try {
    await client.connect();
    console.log('✅ Connected to sagara_revamp\n');

    const tables = ['portfolio_items', 'blog_posts'];
    for (const table of tables) {
      console.log(`\n${'='.repeat(45)}`);
      console.log(`TABLE: ${table}`);
      console.log('='.repeat(45));

      const cols = await client.query(
        'SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position',
        [table]
      );
      console.log('Columns:');
      cols.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type}, Nullable: ${c.is_nullable})`));

      const countRes = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`Row count: ${countRes.rows[0].count}`);

      if (parseInt(countRes.rows[0].count) > 0) {
        const rows = await client.query(`SELECT * FROM ${table} LIMIT 1`);
        console.log('Sample row:', JSON.stringify(rows.rows[0], null, 2));
      }
    }
  } catch (err) {
    console.error('❌ Inspection failed:', err.message);
  } finally {
    await client.end();
  }
}

inspect();
