import 'dotenv/config';
import { readFile } from 'fs/promises';
import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const clientConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     process.env.DB_PORT     || 5432,
        database: process.env.DB_NAME     || 'ecommerce_db',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD,
      };
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    const schema = await readFile(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schema);
    console.log('Schema applied successfully');

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
