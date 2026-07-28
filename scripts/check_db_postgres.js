/**
 * scripts/check_db_postgres.js
 * Lists public tables in the default "postgres" database.
 * Usage: node scripts/check_db_postgres.js
 */
const { Client } = require('pg');

const client = new Client('postgres://postgres:alex12345@localhost:5432/postgres');

client.connect()
  .then(() => client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  ))
  .then(res => { console.log(res.rows); client.end(); })
  .catch(err => { console.error(err.message); client.end(); });
