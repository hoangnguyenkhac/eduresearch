const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./database.sqlite');

const name = 'Admin Tối Cao';
const email = 'admin@eduresearch.com';
const password = process.env.ADMIN_PASSWORD || 'admin'; // default password or env
const role = 'admin';
const unit = 'Ban Giám Đốc';

const salt = bcrypt.genSaltSync(12);
const hash = bcrypt.hashSync(password, salt);

db.run(`INSERT INTO users (name, email, password, role, unit) VALUES (?, ?, ?, ?, ?)`, 
  [name, email, hash, role, unit], 
  function(err) {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('Tạo tài khoản thành công!');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    }
    db.close();
  });
