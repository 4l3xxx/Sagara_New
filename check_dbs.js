const { Client } = require('pg');
const client = new Client('postgres://postgres:alex12345@localhost:5432/postgres');
client.connect()
    .then(() => client.query("SELECT datname FROM pg_database WHERE datistemplate = false"))
    .then(res => { console.log(res.rows); client.end(); })
    .catch(console.error);
