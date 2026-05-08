import 'dotenv/config';
import { readFile } from 'fs/promises';
import pg from 'pg';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import path from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ecommerce_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Run seed SQL
    const seedSql = await readFile(path.join(__dirname, 'seed.sql'), 'utf-8');
    await client.query(seedSql);
    console.log('Seed SQL executed');

    // Hash and insert admin password properly
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@store.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminName = 'Store Admin';
    const hash = await bcrypt.hash(adminPassword, 12);

    // Upsert admin
    await client.query(`
      INSERT INTO admins (name, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET password_hash = $3
    `, [adminName, adminEmail, hash]);
    console.log('Admin account created/updated');

    // Also create a test user
    const userHash = await bcrypt.hash('User123!', 12);
    await client.query(`
      INSERT INTO users (name, email, password_hash, phone)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Test User', 'user@test.com', userHash, '+1234567890']);
    console.log('Test user created');

    console.log('\nSeed completed successfully!');
    console.log('Admin: admin@store.com / Admin123!');
    console.log('User: user@test.com / User123!');

  } catch (err) {
    console.error('Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
