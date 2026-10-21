const { query } = require('../config/db');
const { uploadFile, deleteFile, getSignedUrl } = require('../config/supabase');

// Lấy danh sách tài liệu
exports.getDocuments = async (req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM documents ORDER BY created_at DESC`);
    res.json(rows);
  } catch (err) {
    console.error('[GET DOCUMENTS ERROR]', err);
    res.status(500).json({ error: 'Lỗi truy xuất danh sách tài liệu.' });
  }
};

// Thêm tài liệu mới (upload lên Supabase Storage)
exports.createDocument = async (req, res) => {
  try {
    if (req.user && req.user.role === 'viewer') {
      return res.status(403).json({ error: 'Người xem không có quyền thêm tài liệu.' });
    }

    const { title, type = 'Tham khảo' } = req.body;
    if (!title) return res.status(400).json({ error: 'Tên tài liệu là bắt buộc.' });
    if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file tải lên.' });

    const sizeInMB = (req.file.size / (1024 * 1024)).toFixed(2) + ' MB';

    const typeConfig = {
      'Lý thuyết': { color: '#3B82F6', bg: '#EFF6FF' },
      'Báo cáo': { color: '#8B5CF6', bg: '#F3E8FF' },
      'Tham khảo': { color: '#10B981', bg: '#D1FAE5' },
      'Dữ liệu': { color: '#F59E0B', bg: '#FEF3C7' }
    };

    const styling = typeConfig[type] || { color: '#3B82F6', bg: '#EFF6FF' };
    const now = new Date();
    const date = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    // Upload file lên Supabase Storage
    const uploadResult = await uploadFile(req.file, { folder: 'documents' });

    const sql = `
      INSERT INTO documents (title, size, type, date, color, bg, file_path, original_name, storage_path, storage_bucket, mime_type, file_size)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id
    `;
    const { rows } = await query(sql, [
      title, sizeInMB, type, date, styling.color, styling.bg,
      uploadResult.path, req.file.originalname,
      uploadResult.path, uploadResult.bucket, req.file.mimetype, req.file.size
    ]);

    res.status(201).json({
      id: rows[0].id,
      title,
      size: sizeInMB,
      type,
      date,
      color: styling.color,
      bg: styling.bg,
      file_path: uploadResult.path,
      original_name: req.file.originalname
    });
  } catch (err) {
    console.error('[CREATE DOCUMENT ERROR]', err);
    res.status(500).json({ error: err.message || 'Lỗi khi tải lên tài liệu.' });
  }
};

// Xóa tài liệu (cả DB và Supabase Storage)
exports.deleteDocument = async (req, res) => {
  try {
    if (req.user && req.user.role === 'viewer') {
      return res.status(403).json({ error: 'Người xem không có quyền xóa tài liệu.' });
    }

    const { id } = req.params;

    const { rows } = await query(`SELECT storage_path, storage_bucket FROM documents WHERE id = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy tài liệu để xóa.' });

    const doc = rows[0];

    // Xóa file trên Supabase Storage
    if (doc.storage_path) {
      try {
        await deleteFile(doc.storage_path, doc.storage_bucket);
      } catch (storageErr) {
        console.error('[DELETE STORAGE ERROR]', storageErr);
        // Không trả lỗi, vẫn xóa DB record
      }
    }

    // Xóa record trong DB
    await query(`DELETE FROM documents WHERE id = $1`, [id]);

    res.json({ message: 'Xóa tài liệu thành công.' });
  } catch (err) {
    console.error('[DELETE DOCUMENT ERROR]', err);
    res.status(500).json({ error: 'Lỗi khi xóa tài liệu.' });
  }
};

// Tải tài liệu an toàn (Signed URL từ Supabase Storage - H2)
exports.downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await query(`SELECT * FROM documents WHERE id = $1`, [id]);
    if (!rows.length || !rows[0].storage_path) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu hoặc tài liệu không có file đính kèm.' });
    }

    const doc = rows[0];

    // Tạo signed URL (hết hạn 1 giờ)
    const signedUrl = await getSignedUrl(doc.storage_path, 3600, doc.storage_bucket);

    const fileName = doc.original_name || `${doc.title}${doc.storage_path.substring(doc.storage_path.lastIndexOf('.'))}`;
    
    // Redirect đến signed URL
    res.redirect(signedUrl);
  } catch (err) {
    console.error('[DOWNLOAD DOCUMENT ERROR]', err);
    res.status(500).json({ error: 'Lỗi khi tải tài liệu.' });
  }
};