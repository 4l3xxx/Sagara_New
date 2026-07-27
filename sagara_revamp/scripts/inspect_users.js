/**
 * scripts/inspect_users.js
 * Prints the schema and sample rows of the users table.
 * Usage: node scripts/inspect_users.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

const client = new Client(
  process.env.DATABASE_URL || 'postgres://postgres:alex12345@localhost:5432/sagara_revamp'
);

async function inspectUsers() {
  try {
    await client.connect();

    const cols = await client.query(
      'SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position',
      ['users']
    );
    console.log('Columns in users:');
    cols.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type}, Nullable: ${c.is_nullable})`));

    const countRes = await client.query('SELECT COUNT(*) FROM users');
    console.log(`\nRow count: ${countRes.rows[0].count}`);

    if (parseInt(countRes.rows[0].count) > 0) {
      const rows = await client.query('SELECT id, username, email, role FROM users LIMIT 5');
      console.log('Sample users:', rows.rows);
    }
  } catch (err) {
    console.error('❌ Failed to inspect users:', err.message);
  } finally {
    await client.end();
  }
}

inspectUsers();
