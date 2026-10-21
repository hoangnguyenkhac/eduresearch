/**
 * Database Adapter - Auto-selects PostgreSQL (Supabase) or SQLite based on env
 * Production: Uses DATABASE_URL → PostgreSQL (Supabase)
 * Development: Falls back to SQLite for zero-config local dev
 */

const usePostgres = !!process.env.DATABASE_URL;

let db;

if (usePostgres) {
  console.log('[DB] Using PostgreSQL (Supabase)');
  const dbPostgres = require('./dbPostgres');

  function toPgQuery(sql, params) {
    if (!params) params = [];
    let paramIdx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIdx++}`);
    return { pgSql, params };
  }

  db = {
    ...dbPostgres,
    get: (sql, params, cb) => {
      if (typeof params === 'function') { cb = params; params = []; }
      const { pgSql } = toPgQuery(sql, params);
      dbPostgres.query(pgSql, params)
        .then(res => cb(null, res.rows[0]))
        .catch(err => cb(err));
    },
    all: (sql, params, cb) => {
      if (typeof params === 'function') { cb = params; params = []; }
      const { pgSql } = toPgQuery(sql, params);
      dbPostgres.query(pgSql, params)
        .then(res => cb(null, res.rows))
        .catch(err => cb(err));
    },
    run: function(sql, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      const { pgSql } = toPgQuery(sql, params);
      dbPostgres.query(pgSql, params)
        .then(res => {
          const fakeThis = { changes: res.rowCount, lastID: res.rows?.[0]?.id };
          if (cb) cb.call(fakeThis, null);
        })
        .catch(err => {
          if (cb) cb(err);
        });
    }
  };
} else {
  console.log('[DB] Using SQLite (local development)');
  const sqlite3 = require('sqlite3').verbose();
  const bcrypt = require('bcryptjs');
  const path = require('path');
  const { OFFICIAL_SURVEYS } = require('../data/questionnaires');
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
        audience TEXT,
        subtitle TEXT,
        institution TEXT,
        created_at TEXT NOT NULL
      )`);

      // Migrations for surveys
      sqliteDb.run(`ALTER TABLE surveys ADD COLUMN questions TEXT`, () => {});
      sqliteDb.run(`ALTER TABLE surveys ADD COLUMN hypotheses TEXT`, () => {});
      sqliteDb.run(`ALTER TABLE surveys ADD COLUMN audience TEXT`, () => {});
      sqliteDb.run(`ALTER TABLE surveys ADD COLUMN subtitle TEXT`, () => {});
      sqliteDb.run(`ALTER TABLE surveys ADD COLUMN institution TEXT`, () => {});

      // Responses Table
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        survey_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        unit TEXT NOT NULL,
        institution TEXT,
        gender TEXT NOT NULL,
        time_taken TEXT NOT NULL,
        status TEXT NOT NULL,
        answers TEXT,
        date TEXT NOT NULL
      )`);
      sqliteDb.run(`ALTER TABLE responses ADD COLUMN answers TEXT`, () => {});
      sqliteDb.run(`ALTER TABLE responses ADD COLUMN institution TEXT`, () => {});

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
      seedOfficialSurveys();
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

  function seedOfficialSurveys() {
    const now = new Date();
    const createdAt = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    OFFICIAL_SURVEYS.forEach((survey) => {
      sqliteDb.get(
        `SELECT id FROM surveys WHERE audience = ? OR title = ?`,
        [survey.audience, survey.title],
        (err, row) => {
          if (err) return;
          if (row) {
            sqliteDb.run(
              `UPDATE surveys SET title = ?, questions_count = ?, status = ?, scale = ?, target = ?, variables = ?, questions = ?, hypotheses = ?, audience = ?, subtitle = ?, institution = ? WHERE id = ?`,
              [
                survey.title,
                survey.questions.length,
                survey.status,
                survey.scale,
                survey.target,
                survey.variables,
                JSON.stringify(survey.questions),
                JSON.stringify(survey.hypotheses),
                survey.audience,
                survey.subtitle,
                survey.institution || 'Cơ sở giáo dục đại học',
                row.id
              ]
            );
            return;
          }

          sqliteDb.run(
            `INSERT INTO surveys (title, questions_count, status, scale, responses_count, target, variables, questions, hypotheses, created_at, audience, subtitle, institution)
             VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              survey.title,
              survey.questions.length,
              survey.status,
              survey.scale,
              survey.target,
              survey.variables,
              JSON.stringify(survey.questions),
              JSON.stringify(survey.hypotheses),
              createdAt,
              survey.audience,
              survey.subtitle,
              survey.institution || 'Cơ sở giáo dục đại học'
            ]
          );
        }
      );
    });

    setTimeout(() => {
      try {
        const { seedAllSurveysIfEmpty } = require('../services/seedResponsesService');
        seedAllSurveysIfEmpty();
      } catch (e) {
        console.error('Lỗi khi nạp seed survey responses:', e);
      }
    }, 1000);
  }

  // Wrapper để API tương thích với dbPostgres và SQLite callbacks
  db = {
    // Callback-based API
    get: (sql, params, cb) => {
      if (typeof params === 'function') { cb = params; params = []; }
      sqliteDb.get(sql, params, cb);
    },
    all: (sql, params, cb) => {
      if (typeof params === 'function') { cb = params; params = []; }
      sqliteDb.all(sql, params, cb);
    },
    run: function(sql, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      sqliteDb.run(sql, params, cb);
    },

    // Promise-based API for dbPostgres compatibility
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
    
    getClient: () => Promise.resolve({
      query: (sql, params) => db.query(sql, params),
      release: () => {}
    }),
    
    transaction: async (callback) => {
      return callback({
        query: (sql, params) => db.query(sql, params)
      });
    },
    
    closePool: () => new Promise(resolve => sqliteDb.close(resolve))
  };
}

module.exports = db;