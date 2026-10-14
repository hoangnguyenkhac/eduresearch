const db = require('../config/db');

// Lấy danh sách phản hồi theo khảo sát
exports.getResponses = (req, res) => {
  const surveyId = req.query.surveyId;
  let query = `SELECT * FROM responses`;
  let params = [];

  if (surveyId && surveyId !== 'all') {
    query += ` WHERE survey_id = ?`;
    params.push(surveyId);
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
        answers: parsedAnswers
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
      charts: { roleData, genderData },
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
    gender = 'Nam',
    time_taken = '3p 15s',
    status = 'valid',
    answers = {}
  } = req.body;

  const now = new Date();
  const date = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  const answersJson = typeof answers === 'object' ? JSON.stringify(answers) : (answers || '{}');

  const sql = `INSERT INTO responses (survey_id, role, unit, gender, time_taken, status, answers, date)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [survey_id, role, unit, gender, time_taken, status, answersJson, date], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    const newId = this.lastID;
    // Tự động tăng responses_count của khảo sát tương ứng
    db.run(`UPDATE surveys SET responses_count = responses_count + 1 WHERE id = ?`, [survey_id]);

    res.status(201).json({
      id: newId,
      survey_id,
      role,
      unit,
      gender,
      time_taken,
      status,
      answers: typeof answers === 'object' ? answers : {},
      date
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
      // Giảm responses_count của survey
      db.run(`UPDATE surveys SET responses_count = MAX(0, responses_count - 1) WHERE id = ?`, [surveyId]);
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

    // Cập nhật lại responses_count chính xác cho survey nếu có surveyId
    if (surveyId) {
      db.get(`SELECT COUNT(*) as cnt FROM responses WHERE survey_id = ?`, [surveyId], (cErr, cRow) => {
        if (!cErr && cRow) {
          db.run(`UPDATE surveys SET responses_count = ? WHERE id = ?`, [cRow.cnt, surveyId]);
        }
      });
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

// Import danh sách phản hồi từ Excel / CSV
exports.importResponses = (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền nhập dữ liệu phản hồi.' });
  }

  const survey_id = req.body.survey_id || req.body.surveyId;
  const items = req.body.items || req.body.responses;
  if (!survey_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Dữ liệu nhập không hợp lệ.' });
  }

  const now = new Date();
  const defaultDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

  const stmt = db.prepare(`INSERT INTO responses (survey_id, role, unit, gender, time_taken, status, answers, date)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  let insertedCount = 0;
  items.forEach(item => {
    const role = item.role || 'Giảng viên';
    const unit = item.unit || 'Khoa CNTT';
    const gender = item.gender || 'Nam';
    const time_taken = item.time_taken || '2p 30s';
    const status = item.status || 'valid';
    const answersJson = typeof item.answers === 'object' ? JSON.stringify(item.answers) : (item.answers || '{}');
    const date = item.date || defaultDate;

    stmt.run([survey_id, role, unit, gender, time_taken, status, answersJson, date]);
    insertedCount++;
  });

  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: err.message });
    // Cập nhật lại responses_count của survey
    db.get(`SELECT COUNT(*) as cnt FROM responses WHERE survey_id = ?`, [survey_id], (cErr, cRow) => {
      if (!cErr && cRow) {
        db.run(`UPDATE surveys SET responses_count = ? WHERE id = ?`, [cRow.cnt, survey_id]);
      }
    });
    res.status(201).json({ message: `Nhập thành công ${insertedCount} phản hồi vào khảo sát #${survey_id}.`, count: insertedCount });
  });
};

