const db = require('../config/db');

// Helper chuẩn hóa ngày lưu DB thành ISO string chuẩn PostgreSQL & SQLite
function normalizeToIsoDate(val) {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') {
    const dmyMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      return new Date(Date.UTC(year, month, day, 12, 0, 0)).toISOString();
    }
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }
  if (val instanceof Date && !isNaN(val.getTime())) return val.toISOString();
  return new Date().toISOString();
}

// Helper định dạng ngày hiển thị dd/mm/yyyy
function formatDisplayDate(val) {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Lấy danh sách phản hồi theo khảo sát và bộ lọc trường
exports.getResponses = (req, res) => {
  const { surveyId, institution } = req.query;
  let query = `SELECT * FROM responses WHERE 1=1`;
  let params = [];

  if (surveyId && surveyId !== 'all') {
    query += ` AND survey_id = ?`;
    params.push(surveyId);
  }

  if (institution && institution !== 'all') {
    query += ` AND institution = ?`;
    params.push(institution);
  }

  query += ` ORDER BY id DESC`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Parse answers và trích xuất ý kiến văn bản (text responses)
    const formattedRows = rows.map(r => {
      let parsedAnswers = {};
      try {
        parsedAnswers = r.answers ? JSON.parse(r.answers) : {};
      } catch {
        parsedAnswers = {};
      }
      return {
        ...r,
        institution: r.institution || 'Cơ sở giáo dục đại học',
        answers: parsedAnswers,
        date: formatDisplayDate(r.date)
      };
    });

    // Tính toán thống kê định lượng
    const total = formattedRows.length;
    const valid = formattedRows.filter(r => r.status === 'valid').length;
    const invalid = total - valid;

    const roleStats = formattedRows.reduce((acc, r) => {
      acc[r.role] = (acc[r.role] || 0) + 1;
      return acc;
    }, {});
    const roleData = Object.keys(roleStats).map(k => ({ name: k, value: roleStats[k] }));

    const genderStats = formattedRows.reduce((acc, r) => {
      acc[r.gender] = (acc[r.gender] || 0) + 1;
      return acc;
    }, {});
    const genderData = Object.keys(genderStats).map(k => ({ name: k, value: genderStats[k] }));

    const instStats = formattedRows.reduce((acc, r) => {
      const inst = r.institution || 'Chưa định danh';
      acc[inst] = (acc[inst] || 0) + 1;
      return acc;
    }, {});
    const institutionData = Object.keys(instStats).map(k => ({ name: k, value: instStats[k] }));

    // Trích xuất phản hồi dạng text định tính
    const textComments = [];
    formattedRows.forEach(r => {
      if (r.answers) {
        Object.keys(r.answers).forEach(key => {
          const val = r.answers[key];
          if (typeof val === 'string' && val.length > 5 && isNaN(Number(val))) {
            textComments.push({
              id: r.id,
              role: r.role,
              unit: r.unit,
              institution: r.institution,
              questionKey: key,
              content: val,
              date: r.date
            });
          }
        });
      }
    });

    res.json({
      list: formattedRows,
      stats: { total, valid, invalid },
      charts: { roleData, genderData, institutionData },
      textComments
    });
  });
};

// Thu thập / Tạo phản hồi mới
exports.createResponse = (req, res) => {
  const {
    survey_id = 1,
    role = 'Cán bộ QL',
    unit = 'Khoa CNTT',
    institution = 'Trường Đại học',
    gender = 'Không nêu',
    time_taken = '3p 15s',
    status,
    answers = {}
  } = req.body;

  // 1. Kiểm tra khảo sát tồn tại
  db.get(`SELECT id FROM surveys WHERE id = ?`, [survey_id], (sErr, survey) => {
    if (sErr) return res.status(500).json({ error: sErr.message });
    if (!survey) return res.status(404).json({ error: 'Khảo sát không tồn tại.' });

    // 2. Tự động nhận diện Speeder (< 15s)
    let calculatedStatus = status || 'valid';
    let totalSeconds = 0;
    if (typeof time_taken === 'string') {
      const minMatch = time_taken.match(/(\d+)\s*p/);
      const secMatch = time_taken.match(/(\d+)\s*s/);
      if (minMatch) totalSeconds += parseInt(minMatch[1], 10) * 60;
      if (secMatch) totalSeconds += parseInt(secMatch[1], 10);
      if (!minMatch && !secMatch) {
        const numOnly = parseInt(time_taken, 10);
        if (!isNaN(numOnly)) totalSeconds = numOnly;
      }
      if (totalSeconds > 0 && totalSeconds < 15) {
        calculatedStatus = 'invalid';
      }
    }

    const isoDate = normalizeToIsoDate(req.body.date);
    const displayDate = formatDisplayDate(isoDate);
    const answersJson = typeof answers === 'object' ? JSON.stringify(answers) : (answers || '{}');

    const sql = `INSERT INTO responses (survey_id, role, unit, institution, gender, time_taken, status, answers, date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [survey_id, role, unit, institution, gender, time_taken, calculatedStatus, answersJson, isoDate], function(err) {
      if (err) return res.status(500).json({ error: err.message });

      const newId = this.lastID;
      // Tự động đồng bộ responses_count của khảo sát tương ứng
      db.run(`UPDATE surveys SET responses_count = (SELECT COUNT(*) FROM responses WHERE survey_id = ?) WHERE id = ?`, [survey_id, survey_id], () => {});

      res.status(201).json({
        id: newId,
        survey_id,
        role,
        unit,
        institution,
        gender,
        time_taken,
        status: calculatedStatus,
        answers: typeof answers === 'object' ? answers : {},
        date: displayDate
      });
    });
  });
};

// Xóa phản hồi
exports.deleteResponse = (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền xóa phản hồi.' });
  }

  const { id } = req.params;
  db.get(`SELECT survey_id FROM responses WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Không tìm thấy phản hồi.' });

    const surveyId = row.survey_id;
    db.run(`DELETE FROM responses WHERE id = ?`, [id], function(delErr) {
      if (delErr) return res.status(500).json({ error: delErr.message });
      // Cập nhật lại responses_count chính xác cho survey
      db.run(`UPDATE surveys SET responses_count = (SELECT COUNT(*) FROM responses WHERE survey_id = ?) WHERE id = ?`, [surveyId, surveyId], () => {});
      res.json({ message: 'Xóa phản hồi thành công.' });
    });
  });
};

// Xóa hàng loạt phản hồi (Bulk Delete)
exports.bulkDeleteResponses = (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền xóa phản hồi.' });
  }

  const { ids, surveyId } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Danh sách ID cần xóa không hợp lệ.' });
  }

  const placeholders = ids.map(() => '?').join(',');
  db.run(`DELETE FROM responses WHERE id IN (${placeholders})`, ids, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const deletedCount = this.changes;

    // Cập nhật lại responses_count chính xác cho survey
    if (surveyId) {
      db.run(`UPDATE surveys SET responses_count = (SELECT COUNT(*) FROM responses WHERE survey_id = ?) WHERE id = ?`, [surveyId, surveyId], () => {});
    } else {
      db.run(`UPDATE surveys SET responses_count = (SELECT COUNT(*) FROM responses WHERE responses.survey_id = surveys.id)`, [], () => {});
    }

    res.json({ message: `Đã xóa thành công ${deletedCount} phản hồi.`, deletedCount });
  });
};

// Cập nhật trạng thái hàng loạt (Bulk Update Status)
exports.bulkUpdateStatus = (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền cập nhật trạng thái.' });
  }

  const { ids, status } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Danh sách ID không hợp lệ.' });
  }
  if (!['valid', 'invalid'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ (valid hoặc invalid).' });
  }

  const placeholders = ids.map(() => '?').join(',');
  db.run(`UPDATE responses SET status = ? WHERE id IN (${placeholders})`, [status, ...ids], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `Đã cập nhật trạng thái ${status} cho ${this.changes} phản hồi.`, updatedCount: this.changes });
  });
};

// Chuẩn hóa trạng thái về đúng 2 giá trị mà DB cho phép (valid / invalid)
function normalizeStatus(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'invalid' || s === 'không hợp lệ' || s === 'khong hop le' || s === 'không họp lệ') {
    return 'invalid';
  }
  return 'valid';
}

// Import danh sách phản hồi từ Excel / CSV
exports.importResponses = async (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền nhập dữ liệu phản hồi.' });
  }

  const survey_id = req.body.survey_id || req.body.surveyId;
  const items = req.body.items || req.body.responses;
  if (!survey_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Dữ liệu nhập không hợp lệ.' });
  }

  // Kiểm tra khảo sát đích có tồn tại (tránh lỗi khóa ngoại khi insert)
  const survey = await new Promise((resolve, reject) => {
    db.get(`SELECT id FROM surveys WHERE id = ?`, [survey_id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

  if (!survey) {
    return res.status(404).json({ error: `Không tìm thấy khảo sát #${survey_id} để nhập dữ liệu.` });
  }

  const insertSql = `INSERT INTO responses (survey_id, role, unit, institution, gender, time_taken, status, answers, date)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  let insertedCount = 0;
  try {
    for (const item of items) {
      const role = item.role || 'Giảng viên';
      const unit = item.unit || 'Khoa CNTT';
      const institution = item.institution || 'Trường Đại học';
      const gender = item.gender || 'Nam';
      const time_taken = item.time_taken || '2p 30s';
      const status = normalizeStatus(item.status);
      let answersJson = '{}';
      if (typeof item.answers === 'object' && item.answers !== null) {
        answersJson = JSON.stringify(item.answers);
      } else if (typeof item.answers === 'string' && item.answers.trim()) {
        answersJson = item.answers;
      }
      const date = normalizeToIsoDate(item.date);

      await new Promise((resolve, reject) => {
        db.run(
          insertSql,
          [survey_id, role, unit, institution, gender, time_taken, status, answersJson, date],
          function (err) {
            if (err) return reject(err);
            insertedCount++;
            resolve();
          }
        );
      });
    }

    // Cập nhật lại responses_count của survey
    await new Promise((resolve) => {
      db.run(
        `UPDATE surveys SET responses_count = (SELECT COUNT(*) FROM responses WHERE survey_id = ?) WHERE id = ?`,
        [survey_id, survey_id],
        () => resolve()
      );
    });

    res.status(201).json({
      message: `Nhập thành công ${insertedCount} phản hồi vào khảo sát #${survey_id}.`,
      count: insertedCount
    });
  } catch (err) {
    res.status(500).json({ error: `Lỗi khi nhập dữ liệu: ${err.message}` });
  }
};
