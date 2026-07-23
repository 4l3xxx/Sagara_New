/**
 * scripts/check_dbs.js
 * Lists all non-template databases on the Postgres server.
 * Usage: node scripts/check_dbs.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

const client = new Client(
  process.env.DATABASE_URL?.replace(/\/[^/]+$/, '/postgres') ||
  'postgres://postgres:alex12345@localhost:5432/postgres'
);

client.connect()
  .then(() => client.query(
    'SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname'
  ))
  .then(res => {
    console.log('\nAvailable databases:');
    res.rows.forEach(r => console.log(` - ${r.datname}`));
    client.end();
  })
  .catch(err => { console.error(err.message); client.end(); });
