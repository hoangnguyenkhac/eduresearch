/**
 * Helper xử lý lỗi máy chủ an toàn (L2)
 * Ngăn chặn lộ đường dẫn file, câu lệnh SQL hoặc stack trace ra phía client.
 */

function handleServerError(res, err, defaultUserMessage = 'Đã có lỗi xảy ra trên máy chủ.') {
  // Ghi log chi tiết nội bộ để quản trị viên điều tra
  console.error('[INTERNAL ERROR LOG]', {
    timestamp: new Date().toISOString(),
    error: err && err.message ? err.message : err,
    stack: err && err.stack ? err.stack : undefined
  });

  // Môi trường Production: Chỉ trả về thông điệp chung an toàn
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: defaultUserMessage });
  }

  // Môi trường Development: Trả chi tiết để debug
  return res.status(500).json({ 
    error: defaultUserMessage, 
    detail: err && err.message ? err.message : String(err) 
  });
}

module.exports = { handleServerError };
