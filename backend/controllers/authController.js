const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/db');
const { SECRET_KEY } = require('../middlewares/auth');
const { validatePassword } = require('../middlewares/validatePassword');

exports.register = async (req, res) => {
  try {
    const { name, email, password, unit } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đủ thông tin.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Định dạng email không hợp lệ.' });
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.message });

    // SECURITY FIX (C3): Public registration cannot grant admin or elevated roles.
    const role = 'viewer';
    const cleanEmail = email.toLowerCase().trim();

    const existing = await query(`SELECT id FROM users WHERE email = $1`, [cleanEmail]);
    if (existing.rows.length) {
      return res.status(400).json({ error: 'Email đã tồn tại trên hệ thống.' });
    }

    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(password, salt);

    const result = await query(
      `INSERT INTO users (name, email, password, role, unit) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name.trim(), cleanEmail, hash, role, unit ? unit.trim() : '']
    );

    res.status(201).json({ message: 'Tạo tài khoản thành công với quyền Người xem (viewer).' });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi tạo tài khoản.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email và mật khẩu.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const { rows } = await query(`SELECT * FROM users WHERE email = $1`, [cleanEmail]);
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
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

    res.json({ 
      token, 
      user: { id: user.id, email: user.email, role: user.role, name: user.name, unit: user.unit } 
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng nhập.' });
  }
};

exports.getMe = (req, res) => {
  res.json({ user: req.user });
};

// 1. Quên mật khẩu: Sinh token bảo mật ngẫu nhiên lưu CSDL (H6)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Vui lòng cung cấp địa chỉ email.' });

    const cleanEmail = email.toLowerCase().trim();
    const { rows } = await query(`SELECT id, email, name FROM users WHERE email = $1`, [cleanEmail]);
    const user = rows[0];

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
    await query(`UPDATE password_resets SET used = 1 WHERE user_id = $1 AND used = 0`, [user.id]);
    
    await query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at, used) VALUES ($1, $2, $3, 0)`,
      [user.id, tokenHash, expiresAt]
    );

    const clientOrigin = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',')[0].trim() 
      : 'http://localhost:5173';
    const resetUrl = `${clientOrigin}/reset-password?token=${rawToken}`;

    console.log(`[PASSWORD RESET LOG] Link khôi phục cho ${user.email}: ${resetUrl}`);

    res.json({
      message: standardMsg,
      resetToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
      resetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined
    });
  } catch (err) {
    console.error('[FORGOT PASSWORD ERROR]', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi xử lý yêu cầu.' });
  }
};

// 2. Đặt lại mật khẩu mới thông qua Token xác thực (H6)
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mã khôi phục (token) và mật khẩu mới.' });
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.message });

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const { rows } = await query(
      `SELECT * FROM password_resets WHERE token_hash = $1 AND used = 0 ORDER BY id DESC LIMIT 1`,
      [tokenHash]
    );
    const resetRecord = rows[0];

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
    await query(
      `UPDATE users SET password = $1, token_version = COALESCE(token_version, 0) + 1 WHERE id = $2`,
      [hash, resetRecord.user_id]
    );

    // Đánh dấu token này đã được sử dụng
    await query(`UPDATE password_resets SET used = 1 WHERE id = $1`, [resetRecord.id]);

    res.json({ message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.' });
  } catch (err) {
    console.error('[RESET PASSWORD ERROR]', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi đặt lại mật khẩu.' });
  }
};