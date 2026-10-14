const db = require('../config/db');

// Lấy danh sách tài liệu
exports.getDocuments = (req, res) => {
  db.all(`SELECT * FROM documents ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Thêm tài liệu mới
exports.createDocument = (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền thêm tài liệu.' });
  }

  const { title, type = 'Tham khảo' } = req.body;
  if (!title) return res.status(400).json({ error: 'Tên tài liệu là bắt buộc.' });
  if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file tải lên.' });

  const sizeInMB = (req.file.size / (1024 * 1024)).toFixed(2) + ' MB';
  const filePath = req.file.filename;
  const originalName = req.file.originalname;

  const typeConfig = {
    'Lý thuyết': { color: '#3B82F6', bg: '#EFF6FF' },
    'Báo cáo': { color: '#8B5CF6', bg: '#F3E8FF' },
    'Tham khảo': { color: '#10B981', bg: '#D1FAE5' },
    'Dữ liệu': { color: '#F59E0B', bg: '#FEF3C7' }
  };

  const styling = typeConfig[type] || { color: '#3B82F6', bg: '#EFF6FF' };
  const now = new Date();
  const date = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

  const sql = `INSERT INTO documents (title, size, type, date, color, bg, file_path, original_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [title, sizeInMB, type, date, styling.color, styling.bg, filePath, originalName], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      id: this.lastID,
      title,
      size: sizeInMB,
      type,
      date,
      color: styling.color,
      bg: styling.bg,
      file_path: filePath,
      original_name: originalName
    });
  });
};

// Xóa tài liệu
exports.deleteDocument = (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền xóa tài liệu.' });
  }

  const { id } = req.params;
  
  db.get(`SELECT file_path FROM documents WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Không tìm thấy tài liệu để xóa.' });

    db.run(`DELETE FROM documents WHERE id = ?`, [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Xóa file vật lý nếu có
      if (row.file_path) {
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.join(__dirname, '../uploads', row.file_path);
        fs.unlink(fullPath, (unlinkErr) => {
          if (unlinkErr) console.error('Lỗi khi xóa file:', unlinkErr);
        });
      }
      
      res.json({ message: 'Xóa tài liệu thành công.' });
    });
  });
};
