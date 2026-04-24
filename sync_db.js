
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function sync() {
    const client = new Client({
        connectionString: "postgres://postgres:alex12345@localhost:5432/sagara_revamp"
    });

    try {
        await client.connect();
        console.log('Connected to Postgres');

        const res = await client.query('SELECT * FROM consultation_requests');
        const dbData = res.rows.map(row => ({
            id: row.id,
            full_name: row.full_name,
            business_email: row.business_email,
            service_type: row.service_type,
            message: row.message,
            nlp_category: row.nlp_category || 'Corporate',
            lead_score: row.lead_score || 0.85,
            status: row.status || 'New',
            created_at: row.created_at || new Date().toISOString()
        }));

        const filePath = path.join(__dirname, 'data', 'consultations.json');
        fs.writeFileSync(filePath, JSON.stringify(dbData, null, 2));
        
        console.log(`Successfully synced ${dbData.length} records to ${filePath}`);
    } catch (err) {
        console.error('Error syncing data:', err);
    } finally {
        await client.end();
    }
}

sync();
