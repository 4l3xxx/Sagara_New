/**
 * scripts/check_db.js
 * Lists all public tables in the sagara_revamp database.
 * Usage: node scripts/check_db.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

const client = new Client(
  process.env.DATABASE_URL || 'postgres://postgres:alex12345@localhost:5432/sagara_revamp'
);

client.connect()
  .then(() => client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  ))
  .then(res => {
    console.log('\nTables in sagara_revamp:');
    res.rows.forEach(r => console.log(` - ${r.table_name}`));
    client.end();
  })
  .catch(err => { console.error(err.message); client.end(); });
