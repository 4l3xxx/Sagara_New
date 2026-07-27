/**
 * scripts/check_db_namadb.js
 * Lists tables in the "namadb" database (debug/legacy).
 * Usage: node scripts/check_db_namadb.js
 */
const { Client } = require('pg');

const client = new Client('postgres://postgres:alex12345@localhost:5432/namadb');

client.connect()
  .then(() => client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  ))
  .then(res => { console.log(res.rows); client.end(); })
  .catch(err => { console.error(err.message); client.end(); });
