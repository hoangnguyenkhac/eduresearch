const bcrypt = require('bcryptjs');
const { validatePassword } = require('../middlewares/validatePassword');
const { query } = require('../config/dbPostgres');

// Lấy danh sách người dùng
exports.getUsers = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, email, role, unit, created_at FROM users ORDER BY id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET USERS ERROR]', err);
    res.status(500).json({ error: 'Lỗi truy xuất danh sách người dùng.' });
  }
};

// Tạo người dùng mới (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'viewer', unit = '' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Họ tên, email và mật khẩu là bắt buộc.' });
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.message });

    const cleanEmail = email.toLowerCase().trim();
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [cleanEmail]);
    if (existing.rows.length) {
      return res.status(400).json({ error: 'Email này đã tồn tại trong hệ thống.' });
    }

    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(password, salt);

    const { rows } = await query(
      `INSERT INTO users (name, email, password, role, unit) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
      [name.trim(), cleanEmail, hash, role, unit ? unit.trim() : '']
    );

    res.status(201).json({
      id: rows[0].id,
      name: name.trim(),
      email: cleanEmail,
      role,
      unit: unit ? unit.trim() : '',
      created_at: rows[0].created_at
    });
  } catch (err) {
    console.error('[CREATE USER ERROR]', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi tạo người dùng.' });
  }
};

// Cập nhật người dùng (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, unit, password } = req.body;

    const { rows } = await query(`SELECT * FROM users WHERE id = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    const user = rows[0];

    const updatedName = name || user.name;
    const updatedEmail = email ? email.toLowerCase().trim() : user.email;
    const updatedRole = role || user.role;
    const updatedUnit = unit !== undefined ? (unit || '') : user.unit;

    // Kiểm tra email trùng nếu đổi email
    if (updatedEmail !== user.email) {
      const existing = await query(`SELECT id FROM users WHERE email = $1 AND id != $2`, [updatedEmail, id]);
      if (existing.rows.length) {
        return res.status(400).json({ error: 'Email này đã được sử dụng.' });
      }
    }

    let updatedPassword = user.password;
    if (password && password.trim() !== '') {
      const pwCheck = validatePassword(password);
      if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.message });
      const salt = bcrypt.genSaltSync(12);
      updatedPassword = bcrypt.hashSync(password, salt);
    }

    const { rows: updated } = await query(
      `UPDATE users SET name = $1, email = $2, role = $3, unit = $4, password = $5, updated_at = NOW() WHERE id = $6 RETURNING id, name, email, role, unit, created_at`,
      [updatedName, updatedEmail, updatedRole, updatedUnit, updatedPassword, id]
    );

    res.json(updated[0]);
  } catch (err) {
    console.error('[UPDATE USER ERROR]', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật người dùng.' });
  }
};

// Xóa người dùng (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Không thể tự xóa tài khoản đang đăng nhập.' });
    }

    const { rowCount } = await query(`DELETE FROM users WHERE id = $1`, [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Không tìm thấy tài khoản để xóa.' });

    res.json({ message: 'Xóa tài khoản thành công.' });
  } catch (err) {
    console.error('[DELETE USER ERROR]', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa người dùng.' });
  }
};

// Cập nhật thông tin hồ sơ của chính người dùng hiện tại
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, unit } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Họ tên không được để trống.' });
    }

    const { rows } = await query(
      `UPDATE users SET name = $1, unit = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, email, role, unit, created_at`,
      [name.trim(), unit !== undefined ? unit.trim() : '', userId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });

    res.json({ message: 'Cập nhật hồ sơ thành công.', user: rows[0] });
  } catch (err) {
    console.error('[UPDATE PROFILE ERROR]', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật hồ sơ.' });
  }
};

// Đổi mật khẩu cá nhân
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentPassword = req.body.currentPassword || req.body.oldPassword;
    const { newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ mật khẩu hiện tại và mật khẩu mới.' });
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.message });

    const { rows } = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản.' });
    const user = rows[0];

    const isValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác.' });
    }

    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(newPassword, salt);

    // Tăng token_version để vô hiệu hóa toàn bộ phiên đăng nhập cũ trên các thiết bị khác (H5)
    await query(
      `UPDATE users SET password = $1, token_version = COALESCE(token_version, 0) + 1, updated_at = NOW() WHERE id = $2`,
      [hash, userId]
    );

    res.json({ message: 'Đổi mật khẩu thành công! Các phiên đăng nhập trên thiết bị khác đã được thu hồi an toàn.' });
  } catch (err) {
    console.error('[CHANGE PASSWORD ERROR]', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi đổi mật khẩu.' });
  }
};