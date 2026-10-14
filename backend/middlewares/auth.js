const jwt = require('jsonwebtoken');
const SECRET_KEY = 'eduresearch_super_secret_key_change_in_production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Truy cập bị từ chối. Không tìm thấy token.' });
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token không hợp lệ.' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Yêu cầu quyền Quản trị viên.' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin, SECRET_KEY };
