const rateLimit = require('express-rate-limit');

/**
 * Hệ thống Rate Limiting phân tầng (Tiered Rate Limiter - H4)
 */

// 1. Tầng toàn cục: Áp dụng cho toàn bộ /api (chống flood request)
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 200, // Tối đa 200 requests / phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau giây lát.' },
});

// 2. Tầng xác thực (Auth): Login, Register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Tối đa 10 lần thử / 15 phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều lần thao tác xác thực. Vui lòng thử lại sau 15 phút.' },
});

// 3. Tầng thao tác bảo mật cao: Forgot password, Change password
const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 lần thử / 15 phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều lần yêu cầu đổi/khôi phục mật khẩu. Vui lòng thử lại sau 15 phút.' },
});

// 4. Tầng gửi phản hồi khảo sát công khai (Public Surveys)
const publicResponseLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 20, // Tối đa 20 phản hồi / phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn đang gửi phản hồi quá thường xuyên. Vui lòng chờ 1 phút trước khi tiếp tục.' },
});

// 5. Tầng thao tác hàng loạt & Upload file (Bulk Import/Delete/Upload)
const bulkOperationsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 25, // Tối đa 25 requests / 5 phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Thao tác dữ liệu hàng loạt quá thường xuyên. Vui lòng chờ 5 phút.' },
});

module.exports = {
  globalLimiter,
  authLimiter,
  sensitiveAuthLimiter,
  publicResponseLimiter,
  bulkOperationsLimiter,
};
