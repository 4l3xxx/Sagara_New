'use strict';
const { Pool } = require('pg');

const connectionString = (
  process.env.DATABASE_URL ||
  'postgres://postgres:alex12345@localhost:5432/sagara_revamp'
).replace('sslmode=no-verify', 'sslmode=disable');

const pool = new Pool({ connectionString });

pool.on('error', (err) => {
  console.error('[DB] Unexpected idle-client error:', err.message);
});

module.exports = pool;
