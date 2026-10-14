const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    // 1. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      unit TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. Surveys Table
    db.run(`CREATE TABLE IF NOT EXISTS surveys (
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

    // Migration nếu cột chưa có
    db.run(`ALTER TABLE surveys ADD COLUMN questions TEXT`, () => {});
    db.run(`ALTER TABLE surveys ADD COLUMN hypotheses TEXT`, () => {});

    // 3. Responses Table
    db.run(`CREATE TABLE IF NOT EXISTS responses (
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

    db.run(`ALTER TABLE responses ADD COLUMN answers TEXT`, () => {});

    // 4. Documents Table
    db.run(`CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      size TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      color TEXT NOT NULL,
      bg TEXT NOT NULL
    )`);

    db.run(`ALTER TABLE documents ADD COLUMN file_path TEXT`, () => {});
    db.run(`ALTER TABLE documents ADD COLUMN original_name TEXT`, () => {});

    seedData();
  });
}

function seedData() {
  // Chỉ tạo tài khoản Quản trị viên tối cao nếu chưa có tài khoản nào
  db.get("SELECT id FROM users WHERE email = 'admin@eduresearch.com'", (err, row) => {
    if (!row) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('admin', salt);
      db.run(
        `INSERT INTO users (name, email, password, role, unit) VALUES (?, ?, ?, ?, ?)`,
        ['Admin Tối Cao', 'admin@eduresearch.com', hash, 'admin', 'Ban Giám Đốc'],
        (insertErr) => {
          if (insertErr) {
            console.error('Lỗi tạo tài khoản admin mặc định:', insertErr.message);
          } else {
            console.log('Đã tạo tài khoản admin tối cao: admin@eduresearch.com / admin');
          }
        }
      );
    }
  });
}

module.exports = db;

