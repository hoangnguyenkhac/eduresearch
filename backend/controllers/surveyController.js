const db = require('../config/db');

// Câu hỏi mẫu chuẩn hóa theo biến nghiên cứu
const SAMPLE_QUESTIONS_BY_VAR = {
  'SP': [
    { code: 'SP1', text: 'Nhà trường có chiến lược chuyển đổi số rõ ràng và khả thi.', variable: 'SP', type: 'likert' },
    { code: 'SP2', text: 'Kế hoạch triển khai công nghệ được phổ biến rộng rãi tới mọi thành viên.', variable: 'SP', type: 'likert' },
    { code: 'SP3', text: 'Nguồn lực tài chính và hạ tầng được phân bổ hợp lý cho việc số hóa.', variable: 'SP', type: 'likert' },
    { code: 'SP4', text: 'Chiến lược số được cập nhật và điều chỉnh định kỳ theo thực tế.', variable: 'SP', type: 'likert' }
  ],
  'LD': [
    { code: 'LD1', text: 'Ban lãnh đạo luôn tiên phong và quyết liệt trong đổi mới công nghệ.', variable: 'LD', type: 'likert' },
    { code: 'LD2', text: 'Cán bộ quản lý khuyến khích áp dụng các sáng kiến số mới.', variable: 'LD', type: 'likert' },
    { code: 'LD3', text: 'Đơn vị có cơ chế khen thưởng đối với các giải pháp số hiệu quả.', variable: 'LD', type: 'likert' },
    { code: 'LD4', text: 'Lãnh đạo hỗ trợ giải quyết kịp thời các khó khăn khi áp dụng công nghệ.', variable: 'LD', type: 'likert' }
  ],
  'DX': [
    { code: 'DX1', text: 'Quy trình công việc và học tập được số hóa và chuẩn hóa đồng bộ.', variable: 'DX', type: 'likert' },
    { code: 'DX2', text: 'Hệ thống dữ liệu được kết nối và chia sẻ liên thông giữa các phòng ban.', variable: 'DX', type: 'likert' },
    { code: 'DX3', text: 'Nhân sự và sinh viên được đào tạo kỹ năng số đầy đủ và thường xuyên.', variable: 'DX', type: 'likert' },
    { code: 'DX4', text: 'Các ứng dụng số giúp nâng cao năng suất và chất lượng hoạt động.', variable: 'DX', type: 'likert' }
  ],
  'AT': [
    { code: 'AT1', text: 'Đơn vị thích ứng linh hoạt trước những thay đổi nhanh chóng của công nghệ.', variable: 'AT', type: 'likert' },
    { code: 'AT2', text: 'Mức độ sẵn sàng làm việc trên môi trường số của cán bộ đạt mức cao.', variable: 'AT', type: 'likert' },
    { code: 'AT3', text: 'Người tham gia tự tin làm chủ và xử lý hiệu quả các nền tảng số.', variable: 'AT', type: 'likert' },
    { code: 'AT4', text: 'Hiệu quả nghiên cứu và công tác chung tăng rõ rệt nhờ chuyển đổi số.', variable: 'AT', type: 'likert' }
  ]
};

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
      code: 'TXT_BARRIER',
      text: 'Theo bạn, rào cản hoặc khó khăn lớn nhất khi triển khai công tác chuyển đổi số tại đơn vị hiện nay là gì?',
      variable: 'QUALITATIVE',
      type: 'textarea',
      placeholder: 'Nhập ý kiến nhận xét, rào cản (ví dụ: hạ tầng mạng, thiết bị, kỹ năng, phần mềm...)'
    },
    {
      code: 'TXT_SUGGESTION',
      text: 'Đề xuất hoặc kiến nghị cụ thể của bạn để nâng cao hiệu quả chuyển đổi số và năng lực thích ứng trong thời gian tới:',
      variable: 'QUALITATIVE',
      type: 'textarea',
      placeholder: 'Nhập các giải pháp hoặc kiến nghị đề xuất...'
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

  const { title, status = 'Draft', scale = 'Likert 5', target = 100, variables = '', questions, hypotheses } = req.body;
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

  const sql = `INSERT INTO surveys (title, questions_count, status, scale, responses_count, target, variables, questions, hypotheses, created_at)
               VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`;

  db.run(sql, [
    title,
    questionsCount,
    status,
    scale,
    parseInt(target) || 100,
    varsString,
    JSON.stringify(initialQuestions),
    JSON.stringify(initialHypotheses),
    created_at
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

    const sql = `INSERT INTO surveys (title, questions_count, status, scale, responses_count, target, variables, questions, hypotheses, created_at)
                 VALUES (?, ?, 'Draft', ?, 0, ?, ?, ?, ?, ?)`;

    db.run(sql, [
      newTitle,
      original.questions_count,
      original.scale,
      original.target,
      original.variables,
      original.questions,
      original.hypotheses,
      created_at
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
        questions: parsedQuestions,
        hypotheses: parsedHypotheses,
        created_at
      });
    });
  });
};

