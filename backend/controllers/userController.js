const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { validatePassword } = require('../middlewares/validatePassword');

// Lấy danh sách người dùng
exports.getUsers = (req, res) => {
  db.all(`SELECT id, name, email, role, unit, created_at FROM users ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Tạo người dùng mới
exports.createUser = (req, res) => {
  const { name, email, password, role = 'viewer', unit = '' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Họ tên, email và mật khẩu là bắt buộc.' });
  }

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.message });

  db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ error: 'Email này đã tồn tại trong hệ thống.' });

    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(password, salt);

    const sql = `INSERT INTO users (name, email, password, role, unit) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [name, email, hash, role, unit], function(insertErr) {
      if (insertErr) return res.status(500).json({ error: insertErr.message });
      res.status(201).json({
        id: this.lastID,
        name,
        email,
        role,
        unit,
        created_at: new Date().toISOString()
      });
    });
  });
};

// Cập nhật người dùng
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { name, email, role, unit, password } = req.body;

  db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

    const updatedName = name || user.name;
    const updatedEmail = email || user.email;
    const updatedRole = role || user.role;
    const updatedUnit = unit !== undefined ? unit : user.unit;

    let updatedPassword = user.password;
    if (password && password.trim() !== '') {
      const salt = bcrypt.genSaltSync(12);
      updatedPassword = bcrypt.hashSync(password, salt);
    }

    const sql = `UPDATE users SET name = ?, email = ?, role = ?, unit = ?, password = ? WHERE id = ?`;
    db.run(sql, [updatedName, updatedEmail, updatedRole, updatedUnit, updatedPassword, id], function(updateErr) {
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      res.json({
        id: parseInt(id),
        name: updatedName,
        email: updatedEmail,
        role: updatedRole,
        unit: updatedUnit,
        created_at: user.created_at
      });
    });
  });
};

// Xóa người dùng
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Không thể tự xóa tài khoản đang đăng nhập.' });
  }

  db.run(`DELETE FROM users WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Không tìm thấy tài khoản để xóa.' });
    res.json({ message: 'Xóa tài khoản thành công.' });
  });
};

// Cập nhật thông tin hồ sơ của chính người dùng hiện tại
exports.updateProfile = (req, res) => {
  const userId = req.user.id;
  const { name, unit } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Họ tên không được để trống.' });
  }

  const sql = `UPDATE users SET name = ?, unit = ? WHERE id = ?`;
  db.run(sql, [name.trim(), unit !== undefined ? unit.trim() : '', userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get(`SELECT id, name, email, role, unit, created_at FROM users WHERE id = ?`, [userId], (getErr, user) => {
      if (getErr) return res.status(500).json({ error: getErr.message });
      res.json({ message: 'Cập nhật hồ sơ thành công.', user });
    });
  });
};

// Đổi mật khẩu cá nhân
exports.changePassword = (req, res) => {
  const userId = req.user.id;
  const currentPassword = req.body.currentPassword || req.body.oldPassword;
  const { newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ mật khẩu hiện tại và mật khẩu mới.' });
  }

  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.message });

  db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản.' });

    const isValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác.' });
    }

    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(newPassword, salt);

    // Tăng token_version để vô hiệu hóa toàn bộ phiên đăng nhập cũ trên các thiết bị khác (H5)
    db.run(`UPDATE users SET password = ?, token_version = COALESCE(token_version, 0) + 1 WHERE id = ?`, [hash, userId], function(updateErr) {
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      res.json({ message: 'Đổi mật khẩu thành công! Các phiên đăng nhập trên thiết bị khác đã được thu hồi an toàn.' });
    });
  });
};
