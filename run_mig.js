const { Client } = require('pg');
const fs = require('fs');

const client = new Client('postgres://postgres:alex12345@localhost:5432/sagara_revamp');

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to DB');
        
        // Drop the affected tables since they are empty anyway
        await client.query('DROP TABLE IF EXISTS blog_posts CASCADE;');
        await client.query('DROP TABLE IF EXISTS activity_log CASCADE;');
        
        // Rerun the migration to recreate them with the correct columns
        const sql = fs.readFileSync('sagara-backend/migrations/003_add_cms_features.up.sql', 'utf8');
        await client.query(sql);
        console.log('Migration 003 (CMS Features) updated successfully!');
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

runMigration();
