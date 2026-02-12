
import { Client } from 'pg';

const client = new Client({
    connectionString: 'postgresql://prodkb:prodkb_password@localhost:5434/prodkb?schema=public',
});

client.connect()
    .then(() => {
        console.log('Connected successfully to 5434');
        return client.end();
    })
    .catch(err => {
        console.error('Connection error', err);
        process.exit(1);
    });
