import pg from 'pg';

const { Pool } = pg;

// Neon (and most cloud PG providers) supply DATABASE_URL.
// Local dev falls back to individual DB_* vars.
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 5432,
      database: process.env.DB_NAME     || 'ecommerce_db',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

/**
 * Run a single query against the pool.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Run multiple queries inside a single transaction.
 * The callback receives a client bound to the transaction.
 * Commits on success, rolls back on any thrown error.
 * @param {function} callback - async (client) => result
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
