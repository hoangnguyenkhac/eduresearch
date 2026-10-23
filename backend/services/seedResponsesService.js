const db = require('../config/db');

// Dữ liệu mẫu thực tế và phong phú cho 4 bộ khảo sát
const BGH_ROLES = [
  'Hiệu trưởng / Phó Hiệu trưởng',
  'Chủ tịch / Phó Chủ tịch Hội đồng trường',
  'Thành viên Hội đồng trường / Đảng ủy viên'
];

const BGH_UNITS = [
  'Ban Giám hiệu',
  'Hội đồng trường',
  'Đảng ủy trường',
  'Ban Đào tạo & Quản lý Khoa học'
];

const BGH_BARRIERS = [
  'Rào cản lớn nhất nằm ở khung thể chế và cơ chế tự chủ tài chính còn vướng mắc theo các quy định hiện hành.',
  'Quy trình phê duyệt phân bổ ngân sách đầu tư cho hạ tầng số còn kéo dài qua nhiều cấp, chưa theo kịp tốc độ đổi mới.',
  'Sức ỳ tâm lý và sự ngại thay đổi thói quen làm việc truyền thống của một bộ phận cán bộ quản lý lâu năm.',
  'Nguồn lực đầu tư cho trung tâm dữ liệu và phần mềm dùng chung còn phân tán, thiếu liên thông đồng bộ.',
  'Cơ chế đãi ngộ và giữ chân nhân lực chuyên trách công nghệ thông tin và AI trình độ cao còn hạn chế.',
  'Thiếu khung tiêu chí định lượng chuẩn mực để đánh giá mức độ sẵn sàng chuyển đổi số giữa các khoa và viện.'
];

const BGH_SUGGESTIONS = [
  'Cần đẩy mạnh phân cấp phân quyền tự chủ toàn diện cho các khoa phòng, gắn liền trách nhiệm với kết quả đầu ra.',
  'Ban hành nghị quyết chuyên đề về chuyển đổi số giáo dục đại học giai đoạn 2026-2030, dành tối thiểu 10% ngân sách cho hạ tầng số.',
  'Xây dựng hệ thống Data Warehouse và Dashboard chỉ đạo điều hành thời gian thực cho Ban Giám hiệu.',
  'Thành lập Trung tâm Đổi mới Sáng tạo và Chuyển giao Tri thức liên kết chặt chẽ với các doanh nghiệp công nghệ.',
  'Đổi mới chính sách thi đua khen thưởng, ghi nhận kịp thời các sáng kiến số hóa quy trình quản trị học thuật.'
];

// Bộ 2: Trưởng / Phó Khoa Phòng
const DEPT_ROLES = [
  'Trưởng Khoa / Viện trưởng đào tạo',
  'Phó Trưởng Khoa / Phó Viện trưởng',
  'Trưởng Phòng / Ban chức năng',
  'Phó Trưởng Phòng / Ban chức năng'
];

const DEPT_UNITS = [
  'Khoa Công nghệ Thông tin',
  'Khoa Kinh tế & Quản trị Kinh doanh',
  'Phòng Quản lý Đào tạo',
  'Phòng Khảo thí & Đảm bảo Chất lượng',
  'Phòng Công tác Sinh viên',
  'Phòng Kế hoạch - Tài chính',
  'Viện Nghiên cứu & Phát triển'
];

const DEPT_BARRIERS = [
  'Việc phối hợp giải quyết thủ tục giữa các phòng ban còn nhiều khâu thủ công giấy tờ, chưa tích hợp E-Office liên thông.',
  'Cơ sở dữ liệu quản lý sinh viên và điểm thi giữa các hệ thống chưa đồng bộ hoàn toàn, thỉnh thoảng phát sinh độ trễ.',
  'Khối lượng công việc hành chính phát sinh định kỳ quá lớn làm hạn chế thời gian tập trung cho công tác chuyên môn.',
  'Thiếu các công cụ tự động hóa báo cáo và phân tích số liệu thống kê học vụ theo thời gian thực.',
  'Hạ tầng mạng nội bộ đôi lúc quá tải vào các đợt cao điểm đăng ký học phần và nhập điểm thi.'
];

const DEPT_SUGGESTIONS = [
  'Đề xuất số hóa 100% quy trình ký số và luân chuyển văn bản nội bộ giữa Khoa và các Phòng chức năng.',
  'Tổ chức các khóa tập huấn kỹ năng quản trị số và phân tích dữ liệu cho đội ngũ trợ lý khoa và chuyên viên.',
  'Chuẩn hóa API tích hợp giữa Cổng thông tin đào tạo, phần mềm Khảo thí và phần mềm Kế toán.',
  'Giao quyền chủ động kinh phí hoạt động chuyên môn cho Ban chủ nhiệm Khoa dựa trên chỉ số KPIs minh bạch.'
];

// Bộ 3: Giảng viên / Nhân viên
const STAFF_ROLES = [
  'Giảng viên trực tiếp giảng dạy',
  'Giáo viên / Trợ giảng',
  'Chuyên viên / Nhân viên hành chính nghiệp vụ',
  'Nghiên cứu viên'
];

const STAFF_UNITS = [
  'Bộ môn Khoa học Máy tính',
  'Bộ môn Tài chính - Ngân hàng',
  'Khoa Ngoại ngữ',
  'Khoa Luật',
  'Trung tâm Học liệu & Thư viện',
  'Văn phòng Khoa'
];

const STAFF_BARRIERS = [
  'Hệ thống LMS của trường đôi khi phản hồi chậm khi có số lượng lớn sinh viên đồng thời làm bài kiểm tra.',
  'Trang thiết bị giảng dạy tại một số giảng đường cũ chưa tương thích tốt với các phần mềm trình chiếu tương tác hiện đại.',
  'Thời gian dành cho đào tạo bồi dưỡng kỹ năng công nghệ còn hạn chế do lịch giảng dạy và nghiên cứu dày đặc.',
  'Các quy định thanh quyết toán đề tài nghiên cứu khoa học còn phức tạp và đòi hỏi nhiều hồ sơ bản cứng.',
  'Wifi tại các khu giảng đường cần được phủ sóng mạnh hơn và ổn định hơn.'
];

const STAFF_SUGGESTIONS = [
  'Nhà trường nên trang bị bản quyền các công cụ AI hỗ trợ giảng dạy và nghiên cứu cho toàn thể giảng viên.',
  'Có chính sách giảm giờ giảng cho các giảng viên chủ trì các dự án đổi mới phương pháp giảng dạy số hóa.',
  'Nâng cấp băng thông Wifi và hệ thống phòng Lab thực hành đạt chuẩn quốc tế.',
  'Đơn giản hóa thủ tục hành chính nghiên cứu khoa học thông qua cổng nộp báo cáo trực tuyến.'
];

// Bộ 4: Sinh viên / Cựu sinh viên
const STUDENT_ROLES = [
  'Sinh viên đang theo học (Năm 1 - 2)',
  'Sinh viên đang theo học (Năm 3 - 4)',
  'Học viên Sau đại học (ThS, NCS)',
  'Cựu người học / Cựu sinh viên'
];

const STUDENT_UNITS = [
  'Ngành Kỹ thuật Phần mềm',
  'Ngành Khoa học Dữ liệu & AI',
  'Ngành Quản trị Kinh doanh',
  'Ngành Kinh tế Quốc tế',
  'Ngành Truyền thông Đa phương tiện',
  'Ngành Ngôn ngữ Anh'
];

const STUDENT_BARRIERS = [
  'Thủ tục cấp bảng điểm và giấy xác nhận sinh viên thời gian giải quyết còn lâu vào đầu năm học.',
  'App sinh viên trên điện thoại đôi khi bị mất kết nối và không cập nhật kịp thời thông báo dời lịch học.',
  'Tài liệu điện tử và giáo trình trực tuyến trên thư viện số cần được cập nhật phong phú hơn.',
  'Một số phòng học lớn âm thanh chưa rõ và điều hòa hoạt động chưa ổn định vào mùa hè.'
];

const STUDENT_SUGGESTIONS = [
  'Đề xuất nhà trường tích hợp dịch vụ cấp giấy tờ điện tử có mã QR xác thực trên Cổng một cửa số hóa.',
  'Tăng cường các buổi tọa đàm với chuyên gia doanh nghiệp và mở rộng cơ hội thực tập nghề nghiệp sớm.',
  'Nâng cấp đường truyền mạng Wifi tại khu tự học và ký túc xá cho sinh viên.',
  'Tạo diễn đàn tương tác hỏi đáp trực tuyến 24/7 có chatbot AI hỗ trợ giải đáp thắc mắc học vụ.'
];

const INSTITUTIONS = [
  'Trường Đại học Bách Khoa',
  'Trường Đại học Kinh Tế Quốc Dân',
  'Trường Đại học Sư Phạm',
  'Trường Đại học Quốc Gia',
  'Trường Đại học Y Dược'
];

// Hàm sinh điểm Likert ngẫu nhiên theo phân phối chuẩn
function generateLikertScore(meanTarget, sd = 0.6) {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(Math.max(1e-5, u1))) * Math.cos(2.0 * Math.PI * u2);
  let val = Math.round(meanTarget + z0 * sd);
  return Math.max(1, Math.min(5, val));
}

function generateResponsesForSurvey(survey, count = 75) {
  let questions = [];
  try {
    questions = typeof survey.questions === 'string' ? JSON.parse(survey.questions) : (survey.questions || []);
  } catch {
    questions = [];
  }

  const likertQuestions = questions.filter(q => !q.type || q.type === 'likert');
  const qualitativeQuestions = questions.filter(q => q.type === 'textarea');

  const responses = [];
  const audience = survey.audience || 'leadership';

  let rolePool = BGH_ROLES;
  let unitPool = BGH_UNITS;
  let barrierPool = BGH_BARRIERS;
  let suggestionPool = BGH_SUGGESTIONS;

  if (audience === 'dept_head') {
    rolePool = DEPT_ROLES;
    unitPool = DEPT_UNITS;
    barrierPool = DEPT_BARRIERS;
    suggestionPool = DEPT_SUGGESTIONS;
  } else if (audience === 'lecturer_staff') {
    rolePool = STAFF_ROLES;
    unitPool = STAFF_UNITS;
    barrierPool = STAFF_BARRIERS;
    suggestionPool = STAFF_SUGGESTIONS;
  } else if (audience === 'student_alumni') {
    rolePool = STUDENT_ROLES;
    unitPool = STUDENT_UNITS;
    barrierPool = STUDENT_BARRIERS;
    suggestionPool = STUDENT_SUGGESTIONS;
  }

  // Số lượng outlier cố ý sinh ra để kiểm định khâu 1:
  // 2 phiếu straightlining, 2 phiếu speeders
  const numStraightlining = Math.min(2, Math.max(1, Math.floor(count * 0.03)));
  const numSpeeders = Math.min(2, Math.max(1, Math.floor(count * 0.03)));

  for (let i = 0; i < count; i++) {
    const isStraightliner = i < numStraightlining;
    const isSpeeder = !isStraightliner && (i < numStraightlining + numSpeeders);

    const answers = {};

    if (isStraightliner) {
      // Đánh cùng 1 mức điểm cho toàn bộ (ví dụ: toàn 5 hoặc toàn 1)
      const straightScore = i % 2 === 0 ? 5 : 1;
      likertQuestions.forEach(q => { answers[q.code] = straightScore; });
    } else {
      // Phân phối chuẩn thực nghiệm học thuật APA: Mỗi người có nhận thức chung z ~ N(0, 1)
      const u1 = Math.max(1e-5, Math.random());
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const respondentTendency = Math.max(2.0, Math.min(4.8, 3.90 + z0 * 0.72));

      const constructLatents = {};
      likertQuestions.forEach(q => {
        const v = q.variable || 'VAR';
        if (constructLatents[v] === undefined) {
          const varOffset = (Math.random() - 0.5) * 0.40;
          constructLatents[v] = Math.max(1.8, Math.min(4.8, respondentTendency + varOffset));
        }
        const latent = constructLatents[v];
        // Đa số câu hỏi cùng nhân tố bám sát latent nhưng có độ phân tán tự nhiên giữa các câu hỏi
        const itemNoise = (Math.random() - 0.5) * 0.90;
        const itemVal = Math.round(latent + itemNoise);
        answers[q.code] = Math.max(1, Math.min(5, itemVal));
      });
    }





    // Câu hỏi định tính
    if (qualitativeQuestions.length > 0) {
      const qBarrier = qualitativeQuestions.find(q => q.code.includes('BARRIER'));
      if (qBarrier) {
        answers[qBarrier.code] = barrierPool[i % barrierPool.length];
      }
      const qSugg = qualitativeQuestions.find(q => q.code.includes('SUGGESTION'));
      if (qSugg) {
        answers[qSugg.code] = suggestionPool[i % suggestionPool.length];
      }
    }

    // Thời gian làm bài
    let timeTaken = '';
    if (isSpeeder) {
      const sec = 8 + Math.floor(Math.random() * 10); // 8 - 17 giây (Speeder)
      timeTaken = `${sec}s`;
    } else {
      const min = 2 + Math.floor(Math.random() * 4); // 2 - 5 phút
      const sec = Math.floor(Math.random() * 59);
      timeTaken = `${min}p ${sec}s`;
    }

    const now = new Date();
    const dayOffset = Math.floor(Math.random() * 15);
    const d = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString();

    responses.push({
      survey_id: survey.id,
      role: rolePool[i % rolePool.length],
      unit: unitPool[i % unitPool.length],
      institution: INSTITUTIONS[i % INSTITUTIONS.length],
      gender: i % 2 === 0 ? 'Nam' : 'Nữ',
      time_taken: timeTaken,
      status: 'valid',
      answers: JSON.stringify(answers),
      date: dateStr
    });
  }

  return responses;
}

// Lưu responses vào database (tương thích cả SQLite và PostgreSQL)
function seedSurveyResponsesInDB(surveyId, count = 75, callback) {
  db.get(`SELECT * FROM surveys WHERE id = ?`, [surveyId], (err, survey) => {
    if (err) return callback(err);
    if (!survey) return callback(new Error(`Không tìm thấy khảo sát ID ${surveyId}`));

    const responses = generateResponsesForSurvey(survey, count);
    const insertSql = `INSERT INTO responses (survey_id, role, unit, institution, gender, time_taken, status, answers, date)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    let insertedCount = 0;

    const updateSurveyCount = () => {
      db.get(`SELECT COUNT(*) as cnt FROM responses WHERE survey_id = ?`, [surveyId], (cErr, cRow) => {
        if (cErr || !cRow) {
          return callback(null, { count: insertedCount });
        }
        db.run(`UPDATE surveys SET responses_count = ? WHERE id = ?`, [cRow.cnt, surveyId], () => {
          callback(null, { count: insertedCount, total: cRow.cnt });
        });
      });
    };

    const insertNext = (index) => {
      if (index >= responses.length) return updateSurveyCount();
      const r = responses[index];
      db.run(
        insertSql,
        [r.survey_id, r.role, r.unit, r.institution, r.gender, r.time_taken, r.status, r.answers, r.date],
        (insertErr) => {
          if (insertErr) return callback(insertErr);
          insertedCount++;
          insertNext(index + 1);
        }
      );
    };

    insertNext(0);
  });
}

// Khởi tạo dữ liệu mẫu ban đầu cho tất cả 4 bộ khảo sát nếu chưa có responses
function seedAllSurveysIfEmpty() {
  db.get(`SELECT COUNT(*) as total FROM responses`, (err, row) => {
    if (err) {
      console.error('Lỗi kiểm tra responses:', err.message);
      return;
    }

    if (!row || row.total === 0) {
      console.log('Chưa có phản hồi nào trong database. Bắt đầu sinh tập dữ liệu khảo sát mẫu thực tế cho 4 bộ...');
      db.all(`SELECT * FROM surveys`, (sErr, surveys) => {
        if (sErr || !surveys || surveys.length === 0) return;

        // Số lượng mẫu phù hợp quy mô từng đối tượng
        const counts = [52, 68, 95, 120];
        surveys.forEach((s, idx) => {
          const sampleCount = counts[idx % counts.length];
          seedSurveyResponsesInDB(s.id, sampleCount, (seedErr, res) => {
            if (seedErr) {
              console.error(`Lỗi sinh dữ liệu cho khảo sát #${s.id}:`, seedErr.message);
            } else {
              console.log(`Đã sinh thành công ${res.count} phản hồi thực tế cho khảo sát #${s.id} (${s.title.substring(0, 30)}...)`);
            }
          });
        });
      });
    }
  });
}

module.exports = {
  seedSurveyResponsesInDB,
  seedAllSurveysIfEmpty,
  generateResponsesForSurvey
};
