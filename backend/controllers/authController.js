const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { SECRET_KEY } = require('../middlewares/auth');

exports.register = (req, res) => {
  const { name, email, password, role, unit } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Vui lòng cung cấp đủ thông tin.' });

  db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, row) => {
    if (err) return res.status(500).json({ error: 'Lỗi server' });
    if (row) return res.status(400).json({ error: 'Email đã tồn tại' });
    
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    
    db.run(`INSERT INTO users (name, email, password, role, unit) VALUES (?, ?, ?, ?, ?)`, 
      [name, email, hash, role || 'viewer', unit], 
      function(err) {
        if (err) return res.status(500).json({ error: 'Không thể tạo tài khoản.' });
        res.status(201).json({ message: 'Tạo tài khoản thành công' });
      });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name, unit: user.unit }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, unit: user.unit } });
  });
};

exports.getMe = (req, res) => {
  res.json({ user: req.user });
};

exports.forgotPassword = (req, res) => {
  res.json({ message: 'Một liên kết đặt lại mật khẩu đã được gửi đến email của bạn.' });
};
