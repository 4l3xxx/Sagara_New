const { Client } = require('pg');
const client = new Client('postgres://postgres:alex12345@localhost:5432/namadb');
client.connect()
    .then(() => client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
    .then(res => { console.log(res.rows); client.end(); })
    .catch(console.error);
