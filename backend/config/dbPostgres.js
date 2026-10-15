/**
 * PostgreSQL Database Module for Supabase
 * Uses pg Pool with connection string from DATABASE_URL
 */
const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.PG_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PG POOL ERROR]', err.message, err.stack);
});

/**
 * Execute a query with parameters
 * @param {string} text - SQL with $1, $2 placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<{rows: Array, rowCount: number, fields: Array}>}
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (!isProduction) {
      console.log('[PG QUERY]', { 
        text: text.substring(0, 120), 
        duration, 
        rows: res.rowCount 
      });
    }
    return res;
  } catch (err) {
    console.error('[PG QUERY ERROR]', { text: text.substring(0, 120), params, error: err.message });
    throw err;
  }
}

/**
 * Get a client from pool for transactions
 * @returns {Promise<PoolClient>}
 */
async function getClient() {
  return pool.connect();
}

/**
 * Execute multiple queries in a transaction
 * @param {Function} callback - async (client) => { ... }
 * @returns {Promise<any>}
 */
async function transaction(callback) {
  const client = await getClient();
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

/**
 * Graceful shutdown
 */
async function closePool() {
  await pool.end();
  console.log('[PG POOL] Closed');
}

process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

module.exports = { pool, query, getClient, transaction, closePool };