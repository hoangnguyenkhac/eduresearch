const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { OFFICIAL_SURVEYS } = require('../data/questionnaires');

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
      audience TEXT,
      subtitle TEXT,
      created_at TEXT NOT NULL
    )`);

    // Migration nếu cột chưa có
    db.run(`ALTER TABLE surveys ADD COLUMN questions TEXT`, () => {});
    db.run(`ALTER TABLE surveys ADD COLUMN hypotheses TEXT`, () => {});
    db.run(`ALTER TABLE surveys ADD COLUMN audience TEXT`, () => {});
    db.run(`ALTER TABLE surveys ADD COLUMN subtitle TEXT`, () => {});

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
    seedOfficialSurveys();
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

function seedOfficialSurveys() {
  const now = new Date();
  const createdAt = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

  OFFICIAL_SURVEYS.forEach((survey) => {
    db.get(
      `SELECT id FROM surveys WHERE audience = ? OR title = ?`,
      [survey.audience, survey.title],
      (err, row) => {
        if (err) {
          console.error('Lỗi kiểm tra khảo sát mẫu:', err.message);
          return;
        }
        if (row) {
          db.run(
            `UPDATE surveys SET title = ?, questions_count = ?, status = ?, scale = ?, target = ?, variables = ?, questions = ?, hypotheses = ?, audience = ?, subtitle = ? WHERE id = ?`,
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
              row.id
            ],
            (updateErr) => {
              if (updateErr) {
                console.error('Lỗi cập nhật phiếu khảo sát:', updateErr.message);
              } else {
                console.log(`Đã cập nhật phiếu khảo sát: ${survey.title}`);
              }
            }
          );
          return;
        }

        db.run(
          `INSERT INTO surveys (title, questions_count, status, scale, responses_count, target, variables, questions, hypotheses, created_at, audience, subtitle)
           VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
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
            survey.subtitle
          ],
          (insertErr) => {
            if (insertErr) {
              console.error('Lỗi thêm phiếu khảo sát:', insertErr.message);
            } else {
              console.log(`Đã thêm phiếu khảo sát: ${survey.title}`);
            }
          }
        );
      }
    );
  });
}

module.exports = db;

