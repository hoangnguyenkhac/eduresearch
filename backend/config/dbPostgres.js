/**
 * PostgreSQL Database Module for Supabase
 * Uses pg Pool with connection string from DATABASE_URL
 */
const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const isRemoteDb = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemoteDb || isProduction ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.PG_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[PG POOL ERROR]', err.message, err.stack);
});

// Thiết lập datestyle 'ISO, DMY' cho mỗi connection để tránh lỗi 'date/time field value out of range'
pool.on('connect', (client) => {
  client.query("SET datestyle TO 'ISO, DMY';").catch(() => {});
});

// Kiểm tra kết nối DB ngay khi khởi động và tự động đồng bộ schema trên Supabase
if (process.env.DATABASE_URL) {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('❌ [DATABASE CONNECTION ERROR]:', err.message);
    } else {
      console.log('✅ [DATABASE CONNECTED]: Successfully connected to PostgreSQL (Supabase)!');
      // Tự động kiểm tra và thêm các cột mới cho surveys và responses nếu chưa có
      client.query(`
        ALTER TABLE surveys ADD COLUMN IF NOT EXISTS audience TEXT;
        ALTER TABLE surveys ADD COLUMN IF NOT EXISTS subtitle TEXT;
        ALTER TABLE surveys ADD COLUMN IF NOT EXISTS institution TEXT DEFAULT 'Cơ sở giáo dục đại học';
        ALTER TABLE responses ADD COLUMN IF NOT EXISTS institution TEXT;
        UPDATE surveys SET responses_count = (SELECT COUNT(*) FROM responses WHERE responses.survey_id = surveys.id);
      `, (migErr) => {
        release();
        if (migErr) {
          console.warn('[PG SCHEMA SYNC WARNING]:', migErr.message);
        } else {
          console.log('✅ [PG SCHEMA & RESPONSES_COUNT SYNC]: Supabase tables and response counts up to date.');
        }
      });
    }
  });
} else {
  console.error('❌ [DATABASE WARNING]: DATABASE_URL is not defined in environment variables!');
}

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