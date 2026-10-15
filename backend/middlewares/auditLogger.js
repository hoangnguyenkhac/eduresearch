/**
 * Middleware & Tiện ích ghi nhật ký an ninh hệ thống (Security Audit Logging - M7)
 * Ghi vết các sự kiện: Đăng nhập sai, đổi quyền hạn, xóa dữ liệu, upload tài liệu.
 */

const fs = require('fs');
const path = require('path');

const logDir = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const auditLogFile = path.join(logDir, 'security-audit.log');

function writeAuditEntry(entry) {
  const line = `[${entry.timestamp}] [${entry.level || 'INFO'}] [${entry.event}] IP=${entry.ip || 'unknown'} User=${entry.userId || 'anonymous'} Role=${entry.role || 'none'} Message=${entry.message} Detail=${JSON.stringify(entry.detail || {})}\n`;
  
  // In ra console máy chủ
  console.log(`[AUDIT] ${entry.event} - ${entry.message}`);

  // Ghi vào file nhật ký kiểm toán
  fs.appendFile(auditLogFile, line, (err) => {
    if (err) console.error('[AUDIT LOG ERROR] Không thể ghi file audit log:', err.message);
  });
}

function logSecurityEvent(event, { ip, userId, role, message, detail, level = 'WARN' }) {
  writeAuditEntry({
    timestamp: new Date().toISOString(),
    event,
    level,
    ip,
    userId,
    role,
    message,
    detail
  });
}

// Middleware ghi nhật ký các thao tác thay đổi dữ liệu (POST, PUT, DELETE, PATCH)
const auditHttpMiddleware = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userId = req.user ? req.user.id : 'anonymous';
      const role = req.user ? req.user.role : 'none';

      // Chỉ log các sự kiện quan trọng hoặc khi lỗi 4xx, 5xx
      const isSensitivePath = req.originalUrl.includes('/auth') || 
                              req.originalUrl.includes('/users') || 
                              req.originalUrl.includes('/documents') ||
                              req.originalUrl.includes('/responses');

      if (isSensitivePath || res.statusCode >= 400) {
        logSecurityEvent('HTTP_MUTATION', {
          ip,
          userId,
          role,
          message: `${req.method} ${req.originalUrl} -> HTTP ${res.statusCode} (${duration}ms)`,
          detail: {
            statusCode: res.statusCode,
            durationMs: duration
          },
          level: res.statusCode >= 400 ? 'WARN' : 'INFO'
        });
      }
    });
  }
  next();
};

module.exports = { logSecurityEvent, auditHttpMiddleware };
