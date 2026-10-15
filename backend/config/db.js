/**
 * Database Adapter - Auto-selects PostgreSQL (Supabase) or SQLite based on env
 * Production: Uses DATABASE_URL → PostgreSQL (Supabase)
 * Development: Falls back to SQLite for zero-config local dev
 */

const usePostgres = !!process.env.DATABASE_URL;

let db;

if (usePostgres) {
  console.log('[DB] Using PostgreSQL (Supabase)');
  db = require('./dbPostgres');
} else {
  console.log('[DB] Using SQLite (local development)');
  const sqlite3 = require('sqlite3').verbose();
  const bcrypt = require('bcryptjs');
  const path = require('path');
  const dbPath = path.resolve(__dirname, '../database.sqlite');

  const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('SQLite connection error:', err.message);
    } else {
      console.log('Connected to SQLite database at:', dbPath);
      initSqliteDatabase();
    }
  });

  function initSqliteDatabase() {
    sqliteDb.serialize(() => {
      // Users Table
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        unit TEXT,
        token_version INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Surveys Table
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        questions_count INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        scale TEXT NOT NULL,
        responses_count INTEGER DEFAULT 0,
        target INTEGER NOT NULL,
        variables TEXT NOT NULL,
        questions TEXT,
        hypotheses TEXT,
        created_at TEXT NOT NULL
      )`);

      // Migrations
      sqliteDb.run(`ALTER TABLE surveys ADD COLUMN questions TEXT`, () => {});
      sqliteDb.run(`ALTER TABLE surveys ADD COLUMN hypotheses TEXT`, () => {});

      // Responses Table
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        survey_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        unit TEXT NOT NULL,
        gender TEXT NOT NULL,
        time_taken TEXT NOT NULL,
        status TEXT NOT NULL,
        answers TEXT,
        date TEXT NOT NULL
      )`);
      sqliteDb.run(`ALTER TABLE responses ADD COLUMN answers TEXT`, () => {});

      // Documents Table
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        size TEXT NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        color TEXT NOT NULL,
        bg TEXT NOT NULL,
        file_path TEXT,
        original_name TEXT
      )`);

      // token_version migration
      sqliteDb.run(`ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0`, () => {});

      // Password Resets Table
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      seedSqliteData();
    });
  }

  function seedSqliteData() {
    sqliteDb.get("SELECT id FROM users WHERE email = 'admin@eduresearch.com'", (err, row) => {
      if (!row) {
        const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin';
        if (!process.env.ADMIN_INITIAL_PASSWORD && process.env.NODE_ENV === 'production') {
          console.warn('[SECURITY WARNING] ADMIN_INITIAL_PASSWORD not provided in production!');
        }
        const salt = bcrypt.genSaltSync(12);
        const hash = bcrypt.hashSync(initialPassword, salt);
        sqliteDb.run(
          `INSERT INTO users (name, email, password, role, unit) VALUES (?, ?, ?, ?, ?)`,
          ['Admin Tối Cao', 'admin@eduresearch.com', hash, 'admin', 'Ban Giám Đốc'],
          (insertErr) => {
            if (insertErr) console.error('Lỗi tạo admin SQLite:', insertErr.message);
            else console.log('Đã tạo admin SQLite:', 'admin@eduresearch.com');
          }
        );
      }
    });
  }

  // Wrapper để API tương thích với dbPostgres (query, getClient, transaction)
  db = {
    // Compatibility: db.query(sql, params) -> Promise<{rows, rowCount}>
    query: (sql, params) => {
      return new Promise((resolve, reject) => {
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
        const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
        
        if (isSelect) {
          sqliteDb.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows, rowCount: rows.length });
          });
        } else if (isInsert && sql.includes('RETURNING')) {
          // SQLite doesn't support RETURNING in older versions, handle manually
          sqliteDb.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ rows: [{ id: this.lastID }], rowCount: this.changes });
          });
        } else {
          sqliteDb.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ rows: [], rowCount: this.changes, lastID: this.lastID });
          });
        }
      });
    },
    
    // Compatibility: db.getClient() -> not needed for SQLite
    getClient: () => Promise.resolve({
      query: (sql, params) => db.query(sql, params),
      release: () => {}
    }),
    
    // Compatibility: db.transaction(callback)
    transaction: async (callback) => {
      // SQLite doesn't have proper transaction support in this wrapper
      // Just run callback with a client-like object
      return callback({
        query: (sql, params) => db.query(sql, params)
      });
    },
    
    closePool: () => new Promise(resolve => sqliteDb.close(resolve))
  };
}

module.exports = db;