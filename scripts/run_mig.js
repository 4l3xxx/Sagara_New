/**
 * scripts/run_mig.js
 * Drops and re-runs migration 003 (CMS features: blog_posts, activity_log).
 * Usage: node scripts/run_mig.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');
const fs   = require('fs');
const path = require('path');

const client = new Client(
  process.env.DATABASE_URL || 'postgres://postgres:alex12345@localhost:5432/sagara_revamp'
);

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to DB');

    await client.query('DROP TABLE IF EXISTS blog_posts CASCADE;');
    await client.query('DROP TABLE IF EXISTS activity_log CASCADE;');
    console.log('Tables dropped.');

    const sqlPath = path.join(__dirname, '../sagara-backend/migrations/003_add_cms_features.up.sql');
    const sql     = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    console.log('✅ Migration 003 (CMS Features) applied successfully!');

  } catch (e) {
    console.error('❌ Migration failed:', e.message);
  } finally {
    await client.end();
  }
}

runMigration();
