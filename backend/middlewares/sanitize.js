
/**
 * Middleware làm sạch dữ liệu đầu vào (Input Sanitization)
 * Ngăn chặn Stored XSS, Reflected XSS và Prototype Pollution.
 */

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\0/g, '') // Loại bỏ null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Gỡ thẻ <script>
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Gỡ thẻ <iframe>
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Gỡ thẻ <object>
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Gỡ thẻ <embed>
    .replace(/javascript\s*:/gi, '') // Gỡ giao thức javascript:
    .replace(/vbscript\s*:/gi, '') // Gỡ giao thức vbscript:
    .replace(/data\s*:\s*text\/html/gi, '') // Gỡ data:text/html
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Gỡ event handlers onerror=..., onload=...
    .replace(/on\w+\s*=\s*[^>\s]+/gi, ''); // Gỡ unquoted event handlers
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => (typeof item === 'object' && item !== null ? sanitizeObject(item) : sanitizeString(item)));
  }
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    // Chống Prototype Pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    
    if (typeof val === 'string') {
      clean[key] = sanitizeString(val);
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizeObject(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

const sanitizeMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
};

module.exports = { sanitizeMiddleware, sanitizeString, sanitizeObject };
