/**
 * scripts/setup_biometrics.js
 * Creates the admin_faces table and enables pgvector (or float array fallback).
 * Usage: node scripts/setup_biometrics.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

const client = new Client(
  process.env.DATABASE_URL || 'postgres://postgres:alex12345@localhost:5432/sagara_revamp'
);

async function setupBiometrics() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL: sagara_revamp\n');

    let hasPgVector = false;
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('✅ pgvector extension enabled!');
      hasPgVector = true;
    } catch {
      console.log('⚠️  pgvector unavailable — using double precision[] fallback.');
    }

    if (hasPgVector) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_faces (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          face_embedding vector(128) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ admin_faces table created (pgvector format).');
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_faces (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          face_embedding double precision[] NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ admin_faces table created (float array format).');

      await client.query(`
        CREATE OR REPLACE FUNCTION public.euclidean_distance(a double precision[], b double precision[])
        RETURNS double precision AS $$
        DECLARE dist double precision := 0; i integer;
        BEGIN
          IF array_length(a,1) IS NULL OR array_length(b,1) IS NULL OR array_length(a,1) != array_length(b,1) THEN RETURN 999.0; END IF;
          FOR i IN 1..array_length(a,1) LOOP dist := dist + power(a[i] - b[i], 2); END LOOP;
          RETURN sqrt(dist);
        END;
        $$ LANGUAGE plpgsql IMMUTABLE;
      `);
      console.log('✅ euclidean_distance SQL function created.');
    }

    const check = await client.query('SELECT COUNT(*) FROM admin_faces');
    console.log(`\nRegistered face accounts: ${check.rows[0].count}`);
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
  } finally {
    await client.end();
  }
}

setupBiometrics();
