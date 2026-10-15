const { query } = require('../config/dbPostgres');

// Lấy danh sách phản hồi theo khảo sát
exports.getResponses = async (req, res) => {
  try {
    const surveyId = req.query.surveyId;
    let sql = `SELECT * FROM responses`;
    const params = [];

    if (surveyId && surveyId !== 'all') {
      sql += ` WHERE survey_id = $1`;
      params.push(parseInt(surveyId, 10));
    }
    sql += ` ORDER BY id DESC`;

    const { rows } = await query(sql, params);

    // JSONB answers tự động parse bởi pg driver, nhưng nếu là string thì parse
    const formattedRows = rows.map(r => ({
      ...r,
      answers: typeof r.answers === 'string' ? JSON.parse(r.answers) : (r.answers || {})
    }));

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
  } catch (err) {
    console.error('[GET RESPONSES ERROR]', err);
    res.status(500).json({ error: 'Lỗi truy xuất phản hồi khảo sát.' });
  }
};

// Thu thập / Tạo phản hồi mới
exports.createResponse = async (req, res) => {
  try {
    const {
      survey_id,
      role = 'Người tham gia',
      unit = 'Đơn vị khảo sát',
      gender = 'Khác',
      time_taken = '2p 30s',
      status,
      answers = {}
    } = req.body;

    // 1. Validate survey_id
    const sId = parseInt(survey_id, 10);
    if (!sId || isNaN(sId)) {
      return res.status(400).json({ error: 'Mã khảo sát (survey_id) là bắt buộc và phải là số hợp lệ.' });
    }

    // 2. Kiểm tra khảo sát tồn tại và đang mở
    const { rows: surveyRows } = await query(`SELECT id, status FROM surveys WHERE id = $1`, [sId]);
    if (!surveyRows.length) {
      return res.status(404).json({ error: 'Khảo sát không tồn tại trong hệ thống.' });
    }

    const survey = surveyRows[0];
    if (survey.status && survey.status.toLowerCase() !== 'active') {
      return res.status(400).json({ error: 'Khảo sát này hiện đã đóng hoặc tạm dừng tiếp nhận phản hồi.' });
    }

    // 3. Tự động kiểm tra Straightlining & Speeders (< 15 giây)
    let calculatedStatus = status || 'valid';
    const cleanTime = String(time_taken).trim();
    if (cleanTime.endsWith('s') && !cleanTime.includes('p')) {
      const seconds = parseInt(cleanTime, 10);
      if (!isNaN(seconds) && seconds < 15) {
        calculatedStatus = 'invalid'; // Speeder flag
      }
    }

    // Kiểm tra Straightlining nếu câu trả lời toàn bộ trùng 1 giá trị duy nhất
    if (typeof answers === 'object' && answers !== null) {
      const numericValues = Object.values(answers).filter(v => typeof v === 'number' || (!isNaN(Number(v)) && String(v).trim() !== ''));
      if (numericValues.length >= 6) {
        const allSame = numericValues.every(val => Number(val) === Number(numericValues[0]));
        if (allSame) {
          calculatedStatus = 'invalid'; // Straightlining flag
        }
      }
    }

    const now = new Date();
    const date = now.toISOString();
    const answersJson = typeof answers === 'object' ? JSON.stringify(answers) : (answers || '{}');

    // Làm sạch chuỗi
    const safeRole = String(role).substring(0, 50).trim();
    const safeUnit = String(unit).substring(0, 100).trim();
    const safeGender = String(gender).substring(0, 20).trim();
    const safeTime = String(time_taken).substring(0, 20).trim();

    const { rows } = await query(
      `INSERT INTO responses (survey_id, role, unit, gender, time_taken, status, answers, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [sId, safeRole, safeUnit, safeGender, safeTime, calculatedStatus, answersJson, date]
    );

    const newId = rows[0].id;
    // Tự động tăng responses_count
    await query(`UPDATE surveys SET responses_count = responses_count + 1 WHERE id = $1`, [sId]);

    res.status(201).json({
      id: newId,
      survey_id: sId,
      role: safeRole,
      unit: safeUnit,
      gender: safeGender,
      time_taken: safeTime,
      status: calculatedStatus,
      answers: typeof answers === 'object' ? answers : {},
      date
    });
  } catch (err) {
    console.error('[CREATE RESPONSE ERROR]', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lưu phản hồi.' });
  }
};

// Xóa phản hồi
exports.deleteResponse = async (req, res) => {
  try {
    if (req.user && req.user.role === 'viewer') {
      return res.status(403).json({ error: 'Người xem không có quyền xóa phản hồi.' });
    }

    const { id } = req.params;

    const { rows } = await query(`SELECT survey_id FROM responses WHERE id = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy phản hồi.' });

    const surveyId = rows[0].survey_id;

    await query(`DELETE FROM responses WHERE id = $1`, [id]);
    // Giảm responses_count
    await query(`UPDATE surveys SET responses_count = GREATEST(0, responses_count - 1) WHERE id = $1`, [surveyId]);

    res.json({ message: 'Xóa phản hồi thành công.' });
  } catch (err) {
    console.error('[DELETE RESPONSE ERROR]', err);
    res.status(500).json({ error: 'Lỗi khi xóa phản hồi.' });
  }
};

// Xóa hàng loạt phản hồi (Bulk Delete)
exports.bulkDeleteResponses = async (req, res) => {
  try {
    if (req.user && req.user.role === 'viewer') {
      return res.status(403).json({ error: 'Người xem không có quyền xóa phản hồi.' });
    }

    const { ids, surveyId } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Danh sách ID cần xóa không hợp lệ.' });
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const { rowCount } = await query(`DELETE FROM responses WHERE id IN (${placeholders})`, ids);
    const deletedCount = rowCount;

    // Cập nhật lại responses_count chính xác cho survey nếu có surveyId
    if (surveyId) {
      const { rows } = await query(`SELECT COUNT(*) as cnt FROM responses WHERE survey_id = $1`, [surveyId]);
      if (rows.length) {
        await query(`UPDATE surveys SET responses_count = $1 WHERE id = $2`, [rows[0].cnt, surveyId]);
      }
    }

    res.json({ message: `Đã xóa thành công ${deletedCount} phản hồi.`, deletedCount });
  } catch (err) {
    console.error('[BULK DELETE RESPONSES ERROR]', err);
    res.status(500).json({ error: 'Lỗi khi xóa hàng loạt phản hồi.' });
  }
};

// Cập nhật trạng thái hàng loạt (Bulk Update Status)
exports.bulkUpdateStatus = async (req, res) => {
  try {
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

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const { rowCount } = await query(`UPDATE responses SET status = $1 WHERE id IN (${placeholders})`, [status, ...ids]);

    res.json({ message: `Đã cập nhật trạng thái ${status} cho ${rowCount} phản hồi.`, updatedCount: rowCount });
  } catch (err) {
    console.error('[BULK UPDATE STATUS ERROR]', err);
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái hàng loạt.' });
  }
};

// Import danh sách phản hồi từ Excel / CSV
exports.importResponses = async (req, res) => {
  try {
    if (req.user && req.user.role === 'viewer') {
      return res.status(403).json({ error: 'Người xem không có quyền nhập dữ liệu phản hồi.' });
    }

    const survey_id = req.body.survey_id || req.body.surveyId;
    const items = req.body.items || req.body.responses;
    if (!survey_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Dữ liệu nhập không hợp lệ.' });
    }

    const sId = parseInt(survey_id, 10);
    if (!sId || isNaN(sId)) {
      return res.status(400).json({ error: 'Mã khảo sát không hợp lệ.' });
    }

    const { rows: surveyRows } = await query(`SELECT id FROM surveys WHERE id = $1`, [sId]);
    if (!surveyRows.length) {
      return res.status(404).json({ error: 'Khảo sát không tồn tại.' });
    }

    const now = new Date();
    const defaultDate = now.toISOString();

    let insertedCount = 0;
    for (const item of items) {
      const role = item.role || 'Giảng viên';
      const unit = item.unit || 'Khoa CNTT';
      const gender = item.gender || 'Nam';
      const time_taken = item.time_taken || '2p 30s';
      const status = item.status || 'valid';
      const answersJson = typeof item.answers === 'object' ? JSON.stringify(item.answers) : (item.answers || '{}');
      const date = item.date || defaultDate;

      await query(
        `INSERT INTO responses (survey_id, role, unit, gender, time_taken, status, answers, date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [sId, role, unit, gender, time_taken, status, answersJson, date]
      );
      insertedCount++;
    }

    // Cập nhật lại responses_count của survey
    const { rows } = await query(`SELECT COUNT(*) as cnt FROM responses WHERE survey_id = $1`, [sId]);
    if (rows.length) {
      await query(`UPDATE surveys SET responses_count = $1 WHERE id = $2`, [rows[0].cnt, sId]);
    }

    res.status(201).json({ message: `Nhập thành công ${insertedCount} phản hồi vào khảo sát #${sId}.`, count: insertedCount });
  } catch (err) {
    console.error('[IMPORT RESPONSES ERROR]', err);
    res.status(500).json({ error: 'Lỗi khi nhập phản hồi.' });
  }
};