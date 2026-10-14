const db = require('../config/db');
const { SAMPLE_QUESTIONS_BY_VAR } = require('../data/questionnaires');

// Hàm tạo câu hỏi tự động theo danh sách biến (kết hợp cả Likert thang đo và Định tính thu thập text)
function generateDefaultQuestions(variablesStr) {
  const vars = variablesStr ? variablesStr.split(',').map(v => v.trim()).filter(Boolean) : ['SP', 'LD', 'DX', 'AT'];
  let questions = [];
  vars.forEach(v => {
    if (SAMPLE_QUESTIONS_BY_VAR[v]) {
      questions.push(...SAMPLE_QUESTIONS_BY_VAR[v].map(q => ({ ...q, type: q.type || 'likert' })));
    } else {
      questions.push(
        { code: `${v}1`, text: `Biểu hiện 1 của nhân tố ${v} trong bối cảnh nghiên cứu.`, variable: v, type: 'likert' },
        { code: `${v}2`, text: `Biểu hiện 2 của nhân tố ${v} trong bối cảnh nghiên cứu.`, variable: v, type: 'likert' },
        { code: `${v}3`, text: `Biểu hiện 3 của nhân tố ${v} trong bối cảnh nghiên cứu.`, variable: v, type: 'likert' }
      );
    }
  });

  // Bổ sung các câu hỏi định tính thu thập ý kiến dạng văn bản (Qualitative text questions)
  questions.push(
    {
      code: 'TXT_BARRIER_LD',
      text: 'Theo Ông/Bà, đâu là rào cản lớn nhất về mặt cơ chế, nguồn lực hoặc văn hóa tổ chức trong quá trình chuyển đổi số tại trường?',
      variable: 'QUALITATIVE',
      type: 'textarea',
      placeholder: 'Ví dụ: cơ chế, nguồn lực tài chính, hạ tầng, văn hóa tổ chức...'
    },
    {
      code: 'TXT_SUGGESTION_LD',
      text: 'Ông/Bà có đề xuất chiến lược gì để nâng cao lợi thế cạnh tranh và tốc độ chuyển đổi của nhà trường trong 3–5 năm tới?',
      variable: 'QUALITATIVE',
      type: 'textarea',
      placeholder: 'Nhập đề xuất chiến lược cụ thể...'
    }
  );

  return questions;
}

// Hàm sinh giả thuyết nghiên cứu mặc định
function generateDefaultHypotheses(variablesStr) {
  const vars = variablesStr ? variablesStr.split(',').map(v => v.trim()).filter(Boolean) : ['SP', 'LD', 'DX', 'AT'];
  const dependent = vars.includes('AT') ? 'AT' : (vars[vars.length - 1] || 'AT');
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
  db.all(`SELECT * FROM surveys ORDER BY id DESC`, [], (err, rows) => {
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
        variables: r.variables ? r.variables.split(',').map(v => v.trim()).filter(Boolean) : [],
        audience: r.audience || null,
        subtitle: r.subtitle || '',
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
  db.get(`SELECT * FROM surveys WHERE id = ?`, [id], (err, row) => {
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
      variables: row.variables ? row.variables.split(',').map(v => v.trim()).filter(Boolean) : [],
      audience: row.audience || null,
      subtitle: row.subtitle || '',
      questions_count: questions.length || row.questions_count || 0,
      questions,
      hypotheses
    });
  });
};

// Tạo khảo sát mới
exports.createSurvey = (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền tạo khảo sát.' });
  }

  const { title, status = 'Draft', scale = 'Likert 5', target = 100, variables = '', questions, hypotheses, audience = null, subtitle = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'Tiêu đề khảo sát là bắt buộc.' });

  const varsString = Array.isArray(variables) ? variables.join(',') : variables;
  const initialQuestions = questions && Array.isArray(questions) && questions.length > 0
    ? questions
    : generateDefaultQuestions(varsString);

  const initialHypotheses = hypotheses && Array.isArray(hypotheses) && hypotheses.length > 0
    ? hypotheses
    : generateDefaultHypotheses(varsString);

  const questionsCount = initialQuestions.length;
  const now = new Date();
  const created_at = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

  const sql = `INSERT INTO surveys (title, questions_count, status, scale, responses_count, target, variables, questions, hypotheses, created_at, audience, subtitle)
               VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [
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
    subtitle
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      id: this.lastID,
      title,
      questions_count: questionsCount,
      status,
      scale,
      responses_count: 0,
      target: parseInt(target) || 100,
      variables: varsString ? varsString.split(',').map(v => v.trim()).filter(Boolean) : [],
      audience,
      subtitle,
      questions: initialQuestions,
      hypotheses: initialHypotheses,
      created_at
    });
  });
};

// Cập nhật khảo sát
exports.updateSurvey = (req, res) => {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Người xem không có quyền chỉnh sửa khảo sát.' });
  }

  const { id } = req.params;
  const { title, questions_count, status, scale, target, variables, questions, hypotheses } = req.body;

  db.get(`SELECT * FROM surveys WHERE id = ?`, [id], (err, current) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!current) return res.status(404).json({ error: 'Không tìm thấy khảo sát để cập nhật.' });

    const updatedTitle = title !== undefined ? title : current.title;
    const updatedStatus = status !== undefined ? status : current.status;
    const updatedScale = scale !== undefined ? scale : current.scale;
    const updatedTarget = target !== undefined ? parseInt(target) : current.target;
    const updatedVars = variables !== undefined ? (Array.isArray(variables) ? variables.join(',') : variables) : current.variables;

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

    const sql = `UPDATE surveys SET title = ?, questions_count = ?, status = ?, scale = ?, target = ?, variables = ?, questions = ?, hypotheses = ? WHERE id = ?`;
    db.run(sql, [
      updatedTitle,
      questionsCount,
      updatedStatus,
      updatedScale,
      updatedTarget,
      updatedVars,
      updatedQuestionsStr,
      updatedHypothesesStr,
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
  db.get(`SELECT * FROM surveys WHERE id = ?`, [id], (err, original) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!original) return res.status(404).json({ error: 'Không tìm thấy khảo sát gốc để nhân bản.' });

    const now = new Date();
    const created_at = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const newTitle = `[Bản sao] ${original.title}`;

    const sql = `INSERT INTO surveys (title, questions_count, status, scale, responses_count, target, variables, questions, hypotheses, created_at, audience, subtitle)
                 VALUES (?, ?, 'Draft', ?, 0, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [
      newTitle,
      original.questions_count,
      original.scale,
      original.target,
      original.variables,
      original.questions,
      original.hypotheses,
      created_at,
      original.audience || null,
      original.subtitle || ''
    ], function(insertErr) {
      if (insertErr) return res.status(500).json({ error: insertErr.message });

      let parsedQuestions = [];
      try { parsedQuestions = original.questions ? JSON.parse(original.questions) : []; } catch { parsedQuestions = []; }

      let parsedHypotheses = [];
      try { parsedHypotheses = original.hypotheses ? JSON.parse(original.hypotheses) : []; } catch { parsedHypotheses = []; }

      res.status(201).json({
        id: this.lastID,
        title: newTitle,
        questions_count: original.questions_count,
        status: 'Draft',
        scale: original.scale,
        responses_count: 0,
        target: original.target,
        variables: original.variables ? original.variables.split(',').map(v => v.trim()).filter(Boolean) : [],
        audience: original.audience || null,
        subtitle: original.subtitle || '',
        questions: parsedQuestions,
        hypotheses: parsedHypotheses,
        created_at
      });
    });
  });
};

