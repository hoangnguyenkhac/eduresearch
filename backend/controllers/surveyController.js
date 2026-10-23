const db = require('../config/db');
const { SAMPLE_QUESTIONS_BY_VAR, QUESTIONNAIRE_TEMPLATES } = require('../data/questionnaires');

// Hàm tạo câu hỏi tự động theo danh sách biến (kết hợp cả Likert thang đo và Định tính thu thập text)
function generateDefaultQuestions(variablesStr) {
  const vars = variablesStr ? variablesStr.split(',').map(v => v.trim()).filter(Boolean) : ['STR', 'LEA', 'CAP', 'RES', 'SER', 'REA'];
  let questions = [];
  vars.forEach(v => {
    if (SAMPLE_QUESTIONS_BY_VAR[v]) {
      questions.push(...SAMPLE_QUESTIONS_BY_VAR[v].map(q => ({ ...q, type: q.type || 'likert' })));
    } else {
      questions.push(
        { code: `${v}1`, text: `Biểu hiện 1 của nhân tố ${v} trong bối cảnh nghiên cứu.`, variable: v, type: 'likert' },
        { code: `${v}2`, text: `Biểu hiện 2 của nhân tố ${v} trong bối cảnh nghiên cứu.`, variable: v, type: 'likert' }
      );
    }
  });

  // Bổ sung các câu hỏi định tính thu thập ý kiến dạng văn bản
  questions.push(
    {
      code: 'TXT_BARRIER',
      text: 'Theo Ông/Bà/Anh/Chị, rào cản hoặc thách thức lớn nhất trong quá trình chuyển đổi của nhà trường/đơn vị hiện nay là gì?',
      variable: 'QUALITATIVE',
      type: 'textarea',
      placeholder: 'Ví dụ: cơ chế, thể chế, hạ tầng, sự sẵn sàng thích ứng...'
    },
    {
      code: 'TXT_SUGGESTION',
      text: 'Ông/Bà/Anh/Chị có đề xuất hoặc kiến nghị cụ thể gì để nâng cao hiệu quả và uy tín phát triển của nhà trường?',
      variable: 'QUALITATIVE',
      type: 'textarea',
      placeholder: 'Nhập các kiến nghị đề xuất trọng tâm...'
    }
  );

  return questions;
}

// Hàm sinh giả thuyết nghiên cứu mặc định
function generateDefaultHypotheses(variablesStr) {
  const vars = variablesStr ? variablesStr.split(',').map(v => v.trim()).filter(Boolean) : ['STR', 'LEA', 'CAP', 'RES', 'SER', 'REA'];
  const dependent = vars.includes('REA') ? 'REA' : (vars.includes('SER') ? 'SER' : (vars[vars.length - 1] || 'REA'));
  const independents = vars.filter(v => v !== dependent);

  return independents.map((ind, idx) => ({
    code: `H${idx + 1}`,
    name: `${ind} ➔ ${dependent}`,
    description: `Nhân tố ${ind} có tác động thuận chiều, có ý nghĩa thống kê đến ${dependent}`,
    independent: ind,
    dependent: dependent,
    status: 'pending'
  }));
}

// Lấy tất cả khảo sát
exports.getSurveys = (req, res) => {
  const sql = `
    SELECT s.*, 
      COALESCE((SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id), 0) AS responses_count,
      COALESCE((SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id AND r.status = 'valid'), 0) AS valid_responses_count
    FROM surveys s 
    ORDER BY s.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(r => {
      let questions = [];
      try {
        questions = r.questions ? JSON.parse(r.questions) : generateDefaultQuestions(r.variables);
      } catch {
        questions = generateDefaultQuestions(r.variables);
      }
      questions = questions.map(q => ({ ...q, type: q.type || 'likert' }));

      let hypotheses = [];
      try {
        hypotheses = r.hypotheses ? JSON.parse(r.hypotheses) : generateDefaultHypotheses(r.variables);
      } catch {
        hypotheses = generateDefaultHypotheses(r.variables);
      }

      return {
        ...r,
        responses_count: parseInt(r.responses_count, 10) || 0,
        valid_responses_count: parseInt(r.valid_responses_count, 10) || 0,
        variables: r.variables ? r.variables.split(',').map(v => v.trim()).filter(Boolean) : [],
        audience: r.audience || null,
        subtitle: r.subtitle || '',
        institution: r.institution || 'Cơ sở giáo dục đại học',
        questions_count: questions.length || r.questions_count || 0,
        questions,
        hypotheses
      };
    });
    res.json(formatted);
  });
};

// Lấy chi tiết khảo sát theo ID
exports.getSurveyById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT s.*, 
      COALESCE((SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id), 0) AS responses_count,
      COALESCE((SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id AND r.status = 'valid'), 0) AS valid_responses_count
    FROM surveys s 
    WHERE s.id = ?
  `;
  db.get(sql, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Không tìm thấy khảo sát' });

    let questions = [];
    try {
      questions = row.questions ? JSON.parse(row.questions) : generateDefaultQuestions(row.variables);
    } catch {
      questions = generateDefaultQuestions(row.variables);
    }
    questions = questions.map(q => ({ ...q, type: q.type || 'likert' }));

    let hypotheses = [];
    try {
      hypotheses = row.hypotheses ? JSON.parse(row.hypotheses) : generateDefaultHypotheses(row.variables);
    } catch {
      hypotheses = generateDefaultHypotheses(row.variables);
    }

    res.json({
      ...row,
      responses_count: parseInt(row.responses_count, 10) || 0,
      valid_responses_count: parseInt(row.valid_responses_count, 10) || 0,
      variables: row.variables ? row.variables.split(',').map(v => v.trim()).filter(Boolean) : [],
      audience: row.audience || null,
      subtitle: row.subtitle || '',
      institution: row.institution || 'Cơ sở giáo dục đại học',
      questions_count: questions.length || row.questions_count || 0,
      questions,
      hypotheses
    });
  });
};

// Tạo khảo sát mới (Hỗ trợ theo từng chức vụ & Định danh theo Trường/Đơn vị)
exports.createSurvey = async (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền tạo khảo sát.' });
  }

  let {
    title,
    status = 'Draft',
    scale = 'Likert 5',
    target = 100,
    variables = '',
    questions,
    hypotheses,
    audience = null,
    subtitle = '',
    institution = 'Trường Đại học'
  } = req.body;

  // Nếu người dùng chọn bộ mẫu theo chức vụ (leadership, dept_head, lecturer_staff, student_alumni)
  if (audience && QUESTIONNAIRE_TEMPLATES[audience]) {
    const tmpl = QUESTIONNAIRE_TEMPLATES[audience];
    if (!title) {
      title = `${tmpl.name} — ${institution || 'Khảo sát'}`;
    }
    if (!subtitle) {
      subtitle = tmpl.subtitle;
    }
    if (!variables) {
      variables = tmpl.variables;
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      questions = tmpl.questions;
    }
    if (!hypotheses || !Array.isArray(hypotheses) || hypotheses.length === 0) {
      hypotheses = tmpl.hypotheses;
    }
    if (!target || target === 100) {
      target = tmpl.defaultTarget;
    }
  }

  if (!title) return res.status(400).json({ error: 'Tiêu đề khảo sát là bắt buộc.' });

  const varsString = Array.isArray(variables) ? variables.join(',') : variables;
  const initialQuestions = questions && Array.isArray(questions) && questions.length > 0
    ? questions
    : generateDefaultQuestions(varsString);

  const initialHypotheses = hypotheses && Array.isArray(hypotheses) && hypotheses.length > 0
    ? hypotheses
    : generateDefaultHypotheses(varsString);

  const questionsCount = initialQuestions.length;
  const created_at = new Date().toISOString();

  const sql = `INSERT INTO surveys (title, questions_count, status, scale, responses_count, target, variables, questions, hypotheses, created_at, audience, subtitle, institution)
               VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`;

  try {
    const { rows } = await db.query(sql, [
      title,
      questionsCount,
      status,
      scale,
      parseInt(target) || 100,
      varsString,
      JSON.stringify(initialQuestions),
      JSON.stringify(initialHypotheses),
      created_at,
      audience,
      subtitle,
      institution || 'Cơ sở giáo dục đại học'
    ]);

    res.status(201).json({
      id: rows[0] ? rows[0].id : undefined,
      title,
      questions_count: questionsCount,
      status,
      scale,
      responses_count: 0,
      target: parseInt(target) || 100,
      variables: varsString ? varsString.split(',').map(v => v.trim()).filter(Boolean) : [],
      audience,
      subtitle,
      institution: institution || 'Cơ sở giáo dục đại học',
      questions: initialQuestions,
      hypotheses: initialHypotheses,
      created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật khảo sát
exports.updateSurvey = (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền chỉnh sửa khảo sát.' });
  }

  const { id } = req.params;
  const { title, questions_count, status, scale, target, variables, questions, hypotheses, institution, audience, subtitle } = req.body;

  db.get(`SELECT * FROM surveys WHERE id = ?`, [id], (err, current) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!current) return res.status(404).json({ error: 'Không tìm thấy khảo sát để cập nhật.' });

    const updatedTitle = title !== undefined ? title : current.title;
    const updatedStatus = status !== undefined ? status : current.status;
    const updatedScale = scale !== undefined ? scale : current.scale;
    const updatedTarget = target !== undefined ? parseInt(target) : current.target;
    const updatedVars = variables !== undefined ? (Array.isArray(variables) ? variables.join(',') : variables) : current.variables;
    const updatedInstitution = institution !== undefined ? institution : (current.institution || 'Cơ sở giáo dục đại học');
    const updatedAudience = audience !== undefined ? audience : current.audience;
    const updatedSubtitle = subtitle !== undefined ? subtitle : current.subtitle;

    let updatedQuestionsStr = current.questions;
    let questionsCount = current.questions_count;
    if (questions !== undefined && Array.isArray(questions)) {
      updatedQuestionsStr = JSON.stringify(questions);
      questionsCount = questions.length;
    } else if (questions_count !== undefined) {
      questionsCount = parseInt(questions_count);
    }

    let updatedHypothesesStr = current.hypotheses;
    if (hypotheses !== undefined && Array.isArray(hypotheses)) {
      updatedHypothesesStr = JSON.stringify(hypotheses);
    }

    const sql = `UPDATE surveys SET title = ?, questions_count = ?, status = ?, scale = ?, target = ?, variables = ?, questions = ?, hypotheses = ?, institution = ?, audience = ?, subtitle = ? WHERE id = ?`;
    db.run(sql, [
      updatedTitle,
      questionsCount,
      updatedStatus,
      updatedScale,
      updatedTarget,
      updatedVars,
      updatedQuestionsStr,
      updatedHypothesesStr,
      updatedInstitution,
      updatedAudience,
      updatedSubtitle,
      id
    ], function(updateErr) {
      if (updateErr) return res.status(500).json({ error: updateErr.message });

      let parsedQuestions = [];
      try { parsedQuestions = JSON.parse(updatedQuestionsStr); } catch { parsedQuestions = []; }

      let parsedHypotheses = [];
      try { parsedHypotheses = JSON.parse(updatedHypothesesStr); } catch { parsedHypotheses = []; }

      res.json({
        id: parseInt(id),
        title: updatedTitle,
        questions_count: questionsCount,
        status: updatedStatus,
        scale: updatedScale,
        responses_count: current.responses_count,
        target: updatedTarget,
        variables: updatedVars ? updatedVars.split(',').map(v => v.trim()).filter(Boolean) : [],
        institution: updatedInstitution,
        audience: updatedAudience,
        subtitle: updatedSubtitle,
        questions: parsedQuestions,
        hypotheses: parsedHypotheses,
        created_at: current.created_at
      });
    });
  });
};

// Đổi trạng thái nhanh khảo sát
exports.updateStatus = (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền thay đổi trạng thái khảo sát.' });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!['Active', 'Draft', 'Closed'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ (Active, Draft, Closed).' });
  }

  db.run(`UPDATE surveys SET status = ? WHERE id = ?`, [status, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Không tìm thấy khảo sát.' });
    res.json({ id: parseInt(id), status });
  });
};

// Xóa khảo sát
exports.deleteSurvey = (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền xóa khảo sát.' });
  }

  const { id } = req.params;
  db.run(`DELETE FROM responses WHERE survey_id = ?`, [id], (err) => {
    if (err) console.error('Lỗi xóa responses kèm theo:', err);
    try {
      const { syncResponsesSequence } = require('./responseController');
      if (typeof syncResponsesSequence === 'function') syncResponsesSequence();
    } catch (_) {}

    db.run(`DELETE FROM surveys WHERE id = ?`, [id], function(deleteErr) {
      if (deleteErr) return res.status(500).json({ error: deleteErr.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Khảo sát không tồn tại.' });
      res.json({ message: 'Xóa khảo sát thành công.' });
    });
  });
};

// Nhân bản khảo sát (Clone / Duplicate Survey 1-Click)
exports.cloneSurvey = (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền nhân bản khảo sát.' });
  }

  const { id } = req.params;
  db.get(`SELECT * FROM surveys WHERE id = ?`, [id], async (err, original) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!original) return res.status(404).json({ error: 'Không tìm thấy khảo sát gốc để nhân bản.' });

    const created_at = new Date().toISOString();
    const newTitle = `[Bản sao] ${original.title}`;

    const sql = `INSERT INTO surveys (title, questions_count, status, scale, responses_count, target, variables, questions, hypotheses, created_at, audience, subtitle, institution)
                 VALUES ($1, $2, 'Draft', $3, 0, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`;

    try {
      const { rows } = await db.query(sql, [
        newTitle,
        original.questions_count,
        original.scale,
        original.target,
        original.variables,
        original.questions,
        original.hypotheses,
        created_at,
        original.audience || null,
        original.subtitle || '',
        original.institution || 'Cơ sở giáo dục đại học'
      ]);

      let parsedQuestions = [];
      try { parsedQuestions = original.questions ? JSON.parse(original.questions) : []; } catch { parsedQuestions = []; }

      let parsedHypotheses = [];
      try { parsedHypotheses = original.hypotheses ? JSON.parse(original.hypotheses) : []; } catch { parsedHypotheses = []; }

      res.status(201).json({
        id: rows[0] ? rows[0].id : undefined,
        title: newTitle,
        questions_count: original.questions_count,
        status: 'Draft',
        scale: original.scale,
        responses_count: 0,
        target: original.target,
        variables: original.variables ? original.variables.split(',').map(v => v.trim()).filter(Boolean) : [],
        audience: original.audience || null,
        subtitle: original.subtitle || '',
        institution: original.institution || 'Cơ sở giáo dục đại học',
        questions: parsedQuestions,
        hypotheses: parsedHypotheses,
        created_at
      });
    } catch (insertErr) {
      res.status(500).json({ error: insertErr.message });
    }
  });
};

// Lấy danh sách khảo sát công khai đang mở (Không yêu cầu đăng nhập)
exports.getPublicSurveys = (req, res) => {
  db.all(`SELECT id, title, subtitle, institution, audience, scale, status, questions_count FROM surveys WHERE status = 'Active' ORDER BY id ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
};

// Đồng bộ số lượng phản hồi cho toàn bộ các khảo sát
exports.syncSurveyCounts = (req, res) => {
  db.run(`
    UPDATE surveys 
    SET responses_count = (SELECT COUNT(*) FROM responses WHERE responses.survey_id = surveys.id)
  `, [], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Đã đồng bộ số lượng phản hồi của tất cả khảo sát thành công.' });
  });
};
