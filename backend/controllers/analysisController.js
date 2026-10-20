const db = require('../config/db');
const { runCompleteAcademicPipeline } = require('../services/statisticsEngine');
const { seedSurveyResponsesInDB, seedAllSurveysIfEmpty } = require('../services/seedResponsesService');

// Phân tích thống kê 5 khâu chuẩn APA 7th Edition cho 1 bộ khảo sát
exports.getSurveyAnalysis = (req, res) => {
  const { id } = req.params;
  const filterOutliers = req.query.filterOutliers !== 'false';

  db.get(`SELECT * FROM surveys WHERE id = ?`, [id], (sErr, survey) => {
    if (sErr) return res.status(500).json({ error: sErr.message });
    if (!survey) return res.status(404).json({ error: 'Không tìm thấy bộ khảo sát.' });

    db.all(`SELECT * FROM responses WHERE survey_id = ? ORDER BY id ASC`, [id], (rErr, responses) => {
      if (rErr) return res.status(500).json({ error: rErr.message });

      if (!responses || responses.length === 0) {
        return res.json({
          surveyInfo: {
            id: survey.id,
            title: survey.title,
            subtitle: survey.subtitle,
            audience: survey.audience,
            institution: survey.institution,
            target: survey.target,
            scale: survey.scale,
            variables: survey.variables ? survey.variables.split(',').map(v => v.trim()).filter(Boolean) : []
          },
          hasData: false,
          message: 'Khảo sát này chưa có phản hồi nào. Vui lòng thu thập phản hồi hoặc nhấn "Sinh dữ liệu mẫu thực tế" để chạy phân tích.'
        });
      }

      try {
        const analysisResults = runCompleteAcademicPipeline(survey, responses, { filterOutliers });
        res.json({
          hasData: true,
          ...analysisResults
        });
      } catch (calcErr) {
        console.error('Lỗi khi tính toán phân tích thống kê:', calcErr);
        res.status(500).json({ error: `Lỗi tính toán: ${calcErr.message}` });
      }
    });
  });
};

// Sinh dữ liệu mẫu thực tế cho 1 khảo sát
exports.seedSurveyResponses = (req, res) => {
  const { id } = req.params;
  const count = parseInt(req.body.count, 10) || 75;

  seedSurveyResponsesInDB(id, count, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      message: `Đã sinh thành công ${result.count} phản hồi thực tế cho khảo sát #${id}.`,
      count: result.count,
      total: result.total
    });
  });
};

// Sinh dữ liệu mẫu thực tế cho tất cả các khảo sát
exports.seedAllSurveys = (req, res) => {
  db.all(`SELECT id FROM surveys`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    let completed = 0;
    const counts = [52, 68, 95, 120];

    rows.forEach((row, idx) => {
      seedSurveyResponsesInDB(row.id, counts[idx % counts.length], () => {
        completed++;
        if (completed === rows.length) {
          res.json({ message: `Đã sinh dữ liệu mẫu thực tế cho tất cả ${rows.length} bộ khảo sát.` });
        }
      });
    });
  });
};
