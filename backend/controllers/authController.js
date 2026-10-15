const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { SECRET_KEY } = require('../middlewares/auth');
const { validatePassword } = require('../middlewares/validatePassword');

exports.register = (req, res) => {
  const { name, email, password, unit } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Vui lòng cung cấp đủ thông tin.' });

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Định dạng email không hợp lệ.' });
  }

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.message });

  // SECURITY FIX (C3): Public registration cannot grant admin or elevated roles.
  // Elevated roles (manager, admin) can ONLY be granted by existing admins via user management.
  const role = 'viewer';

  db.get(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase().trim()], (err, row) => {
    if (err) return res.status(500).json({ error: 'Lỗi máy chủ khi kiểm tra tài khoản.' });
    if (row) return res.status(400).json({ error: 'Email đã tồn tại trên hệ thống.' });
    
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(password, salt);
    
    db.run(`INSERT INTO users (name, email, password, role, unit) VALUES (?, ?, ?, ?, ?)`, 
      [name.trim(), email.toLowerCase().trim(), hash, role, unit ? unit.trim() : ''], 
      function(insertErr) {
        if (insertErr) return res.status(500).json({ error: 'Không thể tạo tài khoản.' });
        res.status(201).json({ message: 'Tạo tài khoản thành công với quyền Người xem (viewer).' });
      });
  });
};

const crypto = require('crypto');

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp email và mật khẩu.' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase().trim()], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }
    
    // Thêm tokenVersion vào payload để quản lý phiên và thu hồi từ xa (H5)
    const tokenVersion = user.token_version || 0;
    const expiresIn = process.env.JWT_EXPIRES_IN || '2h';
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, unit: user.unit, tokenVersion }, 
      SECRET_KEY, 
      { expiresIn }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, unit: user.unit } });
  });
};

exports.getMe = (req, res) => {
  res.json({ user: req.user });
};

// 1. Quên mật khẩu: Sinh token bảo mật ngẫu nhiên lưu CSDL (H6)
exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Vui lòng cung cấp địa chỉ email.' });

  const cleanEmail = email.toLowerCase().trim();
  db.get(`SELECT id, email, name FROM users WHERE email = ?`, [cleanEmail], (err, user) => {
    if (err) return res.status(500).json({ error: 'Lỗi máy chủ khi xử lý yêu cầu.' });

    // Trả về thông điệp chung tránh rà quét tài khoản (User Enumeration Defense)
    const standardMsg = 'Nếu email của bạn tồn tại trên hệ thống, hướng dẫn đặt lại mật khẩu đã được tạo.';

    if (!user) {
      return res.json({ message: standardMsg });
    }

    // Sinh token ngẫu nhiên 32 bytes (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    // Thời hạn 15 phút
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Vô hiệu hóa các mã reset chưa dùng trước đó của user
    db.run(`UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0`, [user.id], () => {
      db.run(
        `INSERT INTO password_resets (user_id, token_hash, expires_at, used) VALUES (?, ?, ?, 0)`,
        [user.id, tokenHash, expiresAt],
        function(insertErr) {
          if (insertErr) return res.status(500).json({ error: 'Không thể tạo yêu cầu đặt lại mật khẩu.' });

          const clientOrigin = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0].trim() : 'http://localhost:5173';
          const resetUrl = `${clientOrigin}/reset-password?token=${rawToken}`;

          console.log(`[PASSWORD RESET LOG] Link khôi phục cho ${user.email}: ${resetUrl}`);

          res.json({
            message: standardMsg,
            resetToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
            resetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined
          });
        }
      );
    });
  });
};

// 2. Đặt lại mật khẩu mới thông qua Token xác thực (H6)
exports.resetPassword = (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng cung cấp mã khôi phục (token) và mật khẩu mới.' });
  }

  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.message });

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  db.get(
    `SELECT * FROM password_resets WHERE token_hash = ? AND used = 0 ORDER BY id DESC LIMIT 1`,
    [tokenHash],
    (err, resetRecord) => {
      if (err) return res.status(500).json({ error: 'Lỗi máy chủ khi kiểm tra mã khôi phục.' });
      if (!resetRecord) {
        return res.status(400).json({ error: 'Mã khôi phục không hợp lệ hoặc đã được sử dụng.' });
      }

      const isExpired = new Date(resetRecord.expires_at) < new Date();
      if (isExpired) {
        return res.status(400).json({ error: 'Mã khôi phục đã hết hạn (chỉ có hiệu lực trong 15 phút).' });
      }

      const salt = bcrypt.genSaltSync(12);
      const hash = bcrypt.hashSync(newPassword, salt);

      // Cập nhật mật khẩu mới và tăng token_version để thu hồi toàn bộ phiên đăng nhập cũ
      db.run(
        `UPDATE users SET password = ?, token_version = COALESCE(token_version, 0) + 1 WHERE id = ?`,
        [hash, resetRecord.user_id],
        function(updErr) {
          if (updErr) return res.status(500).json({ error: 'Không thể cập nhật mật khẩu mới.' });

          // Đánh dấu token này đã được sử dụng trước khi trả response
          db.run(`UPDATE password_resets SET used = 1 WHERE id = ?`, [resetRecord.id], function(markErr) {
            if (markErr) return res.status(500).json({ error: 'Lỗi hoàn tất phiên đặt lại mật khẩu.' });
            res.json({ message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.' });
          });
        }
      );
    }
  );
};
