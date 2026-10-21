const q = (code, text, variable, extra = {}) => ({
  code,
  text,
  variable,
  type: extra.type || 'likert',
  ...extra
});

const hypo = (code, independent, dependent, description) => ({
  code,
  name: `${independent} ➔ ${dependent}`,
  description,
  independent,
  dependent,
  status: 'pending'
});

// ==========================================
// THANG ĐO LIKERT 5 MỨC ĐỘ CHUẨN (ÁP DỤNG CẢ 4 BỘ)
// 1: Hoàn toàn không đồng ý
// 2: Không đồng ý
// 3: Trung lập / Phân vân
// 4: Đồng ý
// 5: Hoàn toàn đồng ý
// ==========================================
const LIKERT_5_LABELS = [
  { value: 1, label: 'Hoàn toàn không đồng ý' },
  { value: 2, label: 'Không đồng ý' },
  { value: 3, label: 'Trung lập / Phân vân' },
  { value: 4, label: 'Đồng ý' },
  { value: 5, label: 'Hoàn toàn đồng ý' }
];

// ==========================================
// BỘ 1: DÀNH CHO BAN GIÁM HIỆU & HỘI ĐỒNG TRƯỜNG
// Đánh giá ở tầm vĩ mô: Thể chế, chiến lược, quản trị số, phân bổ nguồn lực và lợi thế cạnh tranh tổng thể
// ==========================================
const bghQuestions = [
  q('INFO_POSITION', 'Chức vụ / Vị trí công tác', 'INFO', {
    type: 'choice',
    section: 'demographics',
    mapsTo: 'role',
    options: [
      'Chủ tịch / Phó Chủ tịch Hội đồng trường',
      'Hiệu trưởng / Phó Hiệu trưởng',
      'Thành viên Hội đồng trường / Đảng ủy viên'
    ]
  }),
  q('INFO_TENURE', 'Thâm niên quản lý ở cấp trường', 'INFO', {
    type: 'choice',
    section: 'demographics',
    options: ['Dưới 3 năm', 'Từ 3 – 5 năm', 'Từ 5 – 10 năm', 'Trên 10 năm']
  }),

  // 10 CÂU LIKERT CHUẨN
  q('STR1', 'Nhà trường đã xây dựng chiến lược phát triển tổng thể, tích hợp rõ ràng các xu hướng số hóa và chuyển đổi giáo dục đại học.', 'STR', { group: '1. Chiến lược & Thể chế vĩ mô (STR)' }),
  q('STR2', 'Kế hoạch chiến lược của nhà trường được rà soát, định kỳ điều chỉnh linh hoạt theo sự biến động của môi trường giáo dục.', 'STR', { group: '1. Chiến lược & Thể chế vĩ mô (STR)' }),

  q('LEA1', 'Hội đồng trường / Ban Giám hiệu thể hiện tầm nhìn và năng lực lãnh đạo số mạnh mẽ trong chỉ đạo và điều hành.', 'LEA', { group: '2. Năng lực Lãnh đạo số (LEA)' }),
  q('LEA2', 'Nhà trường ban hành các cơ chế, thể chế quản trị linh hoạt, phân cấp mạnh mẽ cho các đơn vị để tạo sự chủ động.', 'LEA', { group: '2. Năng lực Lãnh đạo số (LEA)' }),

  q('CAP1', 'Cơ cấu tổ chức của nhà trường có khả năng tái cấu trúc và thích ứng nhanh trước các mô hình đào tạo mới.', 'CAP', { group: '3. Năng lực Thích ứng Tổ chức (CAP)' }),

  q('RES1', 'Việc phân bổ ngân sách, tài chính và hạ tầng CNTT được ưu tiên gắn liền với các mục tiêu chiến lược trọng điểm.', 'RES', { group: '4. Phân bổ Nguồn lực & Đầu tư (RES)' }),
  q('RES2', 'Nhà trường có chính sách thu hút, phát triển và giữ chân đội ngũ nhân sự chất lượng cao đáp ứng chuẩn mực mới.', 'RES', { group: '4. Phân bổ Nguồn lực & Đầu tư (RES)' }),

  q('SER1', 'Nhà trường duy trì được vị thế, uy tín và lợi thế cạnh tranh bền vững so với các cơ sở giáo dục đại học khác.', 'SER', { group: '5. Lợi thế Cạnh tranh & Uy tín (SER)' }),

  q('REA1', 'Toàn hệ thống nhà trường đã đạt được sự sẵn sàng cao về mọi mặt để thích ứng thành công với các xu hướng giáo dục mới.', 'REA', { group: '6. Mức độ Sẵn sàng Thích ứng (REA)' }),
  q('REA2', 'Nhà trường có khả năng dự báo và ứng phó hiệu quả trước các rủi ro, thách thức trong quá trình chuyển đổi tổ chức.', 'REA', { group: '6. Mức độ Sẵn sàng Thích ứng (REA)' }),

  // 2 câu mở định tính
  q('TXT_BARRIER_BGH', 'Theo Ông/Bà, đâu là rào cản lớn nhất về mặt cơ chế, thể chế hoặc nguồn lực trong quá trình chuyển đổi của nhà trường?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Ý kiến về cơ chế, thể chế, phân bổ nguồn lực, văn hóa tổ chức...'
  }),
  q('TXT_SUGGESTION_BGH', 'Ông/Bà có đề xuất định hướng chiến lược trọng tâm gì để gia tăng lợi thế cạnh tranh của nhà trường trong 3–5 năm tới?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Đề xuất định hướng chiến lược trọng tâm...'
  })
];

// ==========================================
// BỘ 2: DÀNH CHO TRƯỞNG / PHÓ KHOA, PHÒNG / BAN
// Đánh giá ở cấp trung: Triển khai chiến lược, quy trình vận hành, quản lý nhân sự và chất lượng dịch vụ nội bộ
// ==========================================
const deptHeadQuestions = [
  q('INFO_POSITION', 'Chức vụ / Vị trí công tác', 'INFO', {
    type: 'choice',
    section: 'demographics',
    mapsTo: 'role',
    options: [
      'Trưởng Khoa / Viện trưởng đào tạo',
      'Phó Trưởng Khoa / Phó Viện trưởng',
      'Trưởng Phòng / Ban / Trung tâm chức năng',
      'Phó Trưởng Phòng / Ban / Trung tâm'
    ]
  }),
  q('INFO_TENURE', 'Thâm niên quản lý ở cấp đơn vị', 'INFO', {
    type: 'choice',
    section: 'demographics',
    options: ['Dưới 3 năm', 'Từ 3 – 5 năm', 'Từ 5 – 10 năm', 'Trên 10 năm']
  }),

  // 10 CÂU LIKERT CHUẨN
  q('STR1', 'Đơn vị của tôi hiểu rõ và chủ động cụ thể hóa các mục tiêu chiến lược của nhà trường thành kế hoạch hành động.', 'STR', { group: '1. Triển khai Chiến lược tại đơn vị (STR)' }),
  q('STR2', 'Kế hoạch hoạt động của đơn vị được liên kết chặt chẽ với các chỉ số đánh giá hiệu quả (KPIs) chung của trường.', 'STR', { group: '1. Triển khai Chiến lược tại đơn vị (STR)' }),

  q('LEA1', 'Lãnh đạo đơn vị tích cực hỗ trợ, tạo điều kiện cho cán bộ/giảng viên ứng dụng các phương pháp và quy trình làm việc mới.', 'LEA', { group: '2. Lãnh đạo cấp trung & Đổi mới (LEA)' }),
  q('LEA2', 'Lãnh đạo đơn vị thường xuyên khen thưởng, động viên các ý tưởng đổi mới sáng tạo từ cán bộ/giảng viên.', 'LEA', { group: '2. Lãnh đạo cấp trung & Đổi mới (LEA)' }),

  q('CAP1', 'Quy trình phối hợp công việc giữa đơn vị của tôi với các phòng/khoa/ban khác diễn ra mượt mà, giảm bớt thủ tục hành chính.', 'CAP', { group: '3. Năng lực Quy trình & Phối hợp (CAP)' }),
  q('CAP2', 'Đơn vị có khả năng xử lý linh hoạt và nhanh chóng các sự cố phát sinh trong quá trình vận hành.', 'CAP', { group: '3. Năng lực Quy trình & Phối hợp (CAP)' }),

  q('RES1', 'Trang thiết bị, phần mềm quản lý và hạ tầng công nghệ được cung cấp đầy đủ, đáp ứng tốt nhu cầu làm việc của đơn vị.', 'RES', { group: '4. Nguồn lực & Hạ tầng đơn vị (RES)' }),
  q('RES2', 'Cán bộ/nhân sự tại đơn vị thường xuyên được bồi dưỡng nâng cao năng lực chuyên môn và kỹ năng số.', 'RES', { group: '4. Nguồn lực & Hạ tầng đơn vị (RES)' }),

  q('SER1', 'Đơn vị duy trì chất lượng phục vụ/hỗ trợ cao đối với các đơn vị khác, giảng viên và người học.', 'SER', { group: '5. Chất lượng Dịch vụ & Hỗ trợ (SER)' }),

  q('REA1', 'Đơn vị của tôi đạt mức độ sẵn sàng cao trong việc thay đổi thói quen làm việc để đáp ứng yêu cầu chuyển đổi chung.', 'REA', { group: '6. Mức độ Sẵn sàng Chuyển đổi (REA)' }),

  // 2 câu mở định tính
  q('TXT_BARRIER_DEPT', 'Khó khăn hoặc điểm nghẽn lớn nhất mà đơn vị của Thầy/Cô gặp phải trong quy trình vận hành và phối hợp liên phòng ban là gì?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Ý kiến về quy trình, thủ tục hành chính, liên thông dữ liệu...'
  }),
  q('TXT_SUGGESTION_DEPT', 'Thầy/Cô có đề xuất gì để cải tiến cơ chế phối hợp và phân quyền cho cấp đơn vị khoa/phòng ban hiệu quả hơn?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Đề xuất cải tiến cơ chế quản trị và phân quyền...'
  })
];

// ==========================================
// BỘ 3: DÀNH CHO GIẢNG VIÊN / GIÁO VIÊN / NHÂN VIÊN
// Đánh giá trực tiếp: Công cụ làm việc, phương pháp giảng dạy, văn hóa đổi mới và sự hỗ trợ từ tổ chức
// ==========================================
const facultyStaffQuestions = [
  q('INFO_POSITION', 'Vị trí công tác', 'INFO', {
    type: 'choice',
    section: 'demographics',
    mapsTo: 'role',
    options: [
      'Giảng viên trực tiếp giảng dạy',
      'Giáo viên / Trợ giảng',
      'Chuyên viên / Nhân viên hành chính nghiệp vụ',
      'Nghiên cứu viên'
    ]
  }),
  q('INFO_EDUCATION', 'Trình độ chuyên môn cao nhất', 'INFO', {
    type: 'choice',
    section: 'demographics',
    options: ['Cử nhân / Kỹ sư', 'Thạc sĩ', 'Tiến sĩ', 'Phó Giáo sư / Giáo sư']
  }),

  // 10 CÂU LIKERT CHUẨN
  q('STR1', 'Tôi được phổ biến rõ ràng về định hướng phát triển và các chiến lược chuyển đổi của nhà trường.', 'STR', { group: '1. Nhận thức Chiến lược (STR)' }),

  q('LEA1', 'Lãnh đạo nhà trường/khoa luôn lắng nghe, chia sẻ và đồng hành cùng giảng viên/nhân viên khi triển khai cái mới.', 'LEA', { group: '2. Sự Đồng hành của Lãnh đạo (LEA)' }),

  q('CAP1', 'Tôi chủ động áp dụng các phương pháp giảng dạy hiện đại, công nghệ số hoặc quy trình mới vào công việc chuyên môn.', 'CAP', { group: '3. Năng lực Thích ứng Chuyên môn (CAP)' }),
  q('CAP2', 'Bản thân tôi có khả năng thích ứng nhanh với các thay đổi về công nghệ và quy trình làm việc tại trường.', 'CAP', { group: '3. Năng lực Thích ứng Chuyên môn (CAP)' }),

  q('RES1', 'Hạ tầng CNTT, mạng Internet và phần mềm giảng dạy/quản lý của trường hoạt động ổn định và hiệu quả.', 'RES', { group: '4. Hạ tầng & Môi trường Làm việc (RES)' }),
  q('RES2', 'Cơ sở vật chất, phòng làm việc/giảng dạy được trang bị đầy đủ, tạo môi trường làm việc thuận lợi.', 'RES', { group: '4. Hạ tầng & Môi trường Làm việc (RES)' }),

  q('SER1', 'Nhà trường cung cấp các khóa đào tạo, tập huấn thiết thực giúp tôi nâng cao kỹ năng ứng dụng công nghệ/chuyển đổi.', 'SER', { group: '5. Đào tạo & Tiếp nhận Phản hồi (SER)' }),
  q('SER2', 'Các kênh phản hồi, góp ý của cán bộ/giảng viên được nhà trường ghi nhận và phản hồi kịp thời.', 'SER', { group: '5. Đào tạo & Tiếp nhận Phản hồi (SER)' }),

  q('REA1', 'Tôi sẵn sàng điều chỉnh thói quen và nâng cao năng lực cá nhân để đáp ứng các yêu cầu chuyển đổi của nhà trường.', 'REA', { group: '6. Thái độ Sẵn sàng & Niềm tin (REA)' }),
  q('REA2', 'Tôi tin tưởng vào sự thành công và phát triển bền vững của nhà trường trong giai đoạn chuyển đổi hiện nay.', 'REA', { group: '6. Thái độ Sẵn sàng & Niềm tin (REA)' }),

  // 2 câu mở định tính
  q('TXT_BARRIER_STAFF', 'Thầy/Cô/Anh/Chị gặp khó khăn gì nhiều nhất về hạ tầng, công cụ số hay thời gian làm việc hiện nay?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Ý kiến về công cụ, phần mềm, thiết bị hoặc thời gian...'
  }),
  q('TXT_SUGGESTION_STAFF', 'Thầy/Cô/Anh/Chị có nguyện vọng hoặc đề xuất gì về chính sách đãi ngộ, tập huấn để an tâm cống hiến tốt hơn?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Đề xuất về tập huấn, đãi ngộ và môi trường...'
  })
];

// ==========================================
// BỘ 4: DÀNH CHO HỌC SINH / SINH VIÊN / CỰU SINH VIÊN / HỌC VIÊN SAU ĐẠI HỌC
// Đánh giá từ góc độ thụ hưởng: Trải nghiệm người học, chất lượng dịch vụ đào tạo, môi trường và giá trị thương hiệu
// ==========================================
const studentAlumniQuestions = [
  q('INFO_POSITION', 'Đối tượng người học', 'INFO', {
    type: 'choice',
    section: 'demographics',
    mapsTo: 'role',
    options: [
      'Sinh viên đang theo học (Năm 1 - 2)',
      'Sinh viên đang theo học (Năm 3 - 4)',
      'Học viên Sau đại học (ThS, NCS)',
      'Cựu người học / Cựu sinh viên'
    ]
  }),
  q('INFO_MAJOR', 'Khối ngành đào tạo', 'INFO', {
    type: 'choice',
    section: 'demographics',
    options: ['Khoa học Tự nhiên & Kỹ thuật', 'Kinh tế, Quản trị & Luật', 'Khoa học Xã hội, Nhân văn & Sư phạm']
  }),

  // 10 CÂU LIKERT CHUẨN
  q('SER1', 'Chương trình đào tạo mang tính cập nhật, thực tiễn và đáp ứng tốt nhu cầu của thị trường lao động.', 'SER', { group: '1. Chất lượng Dịch vụ Đào tạo & Hỗ trợ (SER)' }),
  q('SER2', 'Giảng viên sử dụng các phương pháp giảng dạy tích cực, ứng dụng công nghệ và tương tác hiệu quả với người học.', 'SER', { group: '1. Chất lượng Dịch vụ Đào tạo & Hỗ trợ (SER)' }),
  q('SER3', 'Các dịch vụ hành chính (xác nhận học vụ, bảng điểm, đăng ký môn học...) được thực hiện nhanh chóng, tiện lợi trên nền tảng số.', 'SER', { group: '1. Chất lượng Dịch vụ Đào tạo & Hỗ trợ (SER)' }),
  q('SER4', 'Các hoạt động hỗ trợ người học (tư vấn tâm lý, hướng nghiệp, học bổng...) được nhà trường thực hiện chu đáo, chuyên nghiệp.', 'SER', { group: '1. Chất lượng Dịch vụ Đào tạo & Hỗ trợ (SER)' }),

  q('RES1', 'Phòng học, phòng thí nghiệm, thư viện và hạ tầng Internet của trường đáp ứng tốt nhu cầu học tập và nghiên cứu.', 'RES', { group: '2. Môi trường Cơ sở vật chất & Học liệu số (RES)' }),
  q('RES2', 'Các nền tảng học tập trực tuyến (LMS, phần mềm học tập) hỗ trợ đắc lực cho quá trình tự học của tôi/người học.', 'RES', { group: '2. Môi trường Cơ sở vật chất & Học liệu số (RES)' }),

  q('CAP1', 'Nhà trường nhanh chóng tiếp thu ý kiến đóng góp của người học/cựu sinh viên để cải thiện chất lượng dịch vụ đào tạo.', 'CAP', { group: '3. Năng lực Lắng nghe & Tiếp thu (CAP)' }),

  q('STR1', 'Nhà trường thể hiện định hướng phát triển hiện đại, tiên phong trong ứng dụng công nghệ và đổi mới sáng tạo.', 'STR', { group: '4. Định hướng Tiên phong Đổi mới (STR)' }),

  q('REA1', 'Tôi nhận thấy nhà trường có khả năng thích ứng tốt và duy trì chất lượng đào tạo ổn định trước những thay đổi.', 'REA', { group: '5. Uy tín & Sự Hài lòng Thụ hưởng (REA)' }),
  q('REA2', 'Tôi hài lòng và tự hào về uy tín, chất lượng đào tạo của nhà trường khi học tập hoặc giới thiệu cho người khác.', 'REA', { group: '5. Uy tín & Sự Hài lòng Thụ hưởng (REA)' }),

  // 2 câu mở định tính
  q('TXT_BARRIER_STUDENT', 'Những rào cản hoặc điểm chưa hài lòng lớn nhất mà Bạn gặp phải về dịch vụ hoặc cơ sở vật chất của trường là gì?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Ý kiến về thủ tục học vụ, Wifi, học liệu, phòng học...'
  }),
  q('TXT_SUGGESTION_STUDENT', 'Bạn có mong muốn hoặc đề xuất cụ thể nào để nhà trường nâng cấp trải nghiệm học tập và hỗ trợ sinh viên tốt hơn?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Đề xuất cải tiến dịch vụ người học và cơ sở vật chất...'
  })
];

// ==========================================
// 4 BỘ KHẢO SÁT CHUẨN CẤP HỆ THỐNG
// ==========================================
const OFFICIAL_SURVEYS = [
  {
    audience: 'leadership',
    audience_name: 'Ban Giám hiệu & Hội đồng trường',
    title: 'Bộ 1: Ban Giám hiệu & Hội đồng trường — Chiến lược, thể chế và quản trị số vĩ mô',
    subtitle: 'Đánh giá ở tầm vĩ mô: Thể chế, chiến lược, quản trị số, phân bổ nguồn lực và lợi thế cạnh tranh tổng thể',
    institution: 'Đơn vị khảo sát mẫu',
    status: 'Active',
    scale: 'Likert 5',
    target: 50,
    variables: 'STR, LEA, CAP, RES, SER, REA',
    questions: bghQuestions,
    hypotheses: [
      hypo('H1', 'STR', 'REA', 'Chiến lược phát triển (STR) tác động thuận chiều đến mức độ sẵn sàng chuyển đổi (REA)'),
      hypo('H2', 'LEA', 'REA', 'Lãnh đạo số (LEA) tác động thuận chiều đến mức độ sẵn sàng chuyển đổi (REA)'),
      hypo('H3', 'CAP', 'SER', 'Năng lực thích ứng tổ chức (CAP) có tác động tích cực đến lợi thế cạnh tranh (SER)'),
      hypo('H4', 'RES', 'REA', 'Nguồn lực và ngân sách (RES) tác động thuận chiều đến sự sẵn sàng tổ chức (REA)')
    ]
  },
  {
    audience: 'dept_head',
    audience_name: 'Trưởng / Phó Khoa, Phòng / Ban',
    title: 'Bộ 2: Trưởng / Phó Khoa, Phòng / Ban — Triển khai chiến lược và quy trình vận hành cấp trung',
    subtitle: 'Đánh giá ở cấp trung: Triển khai chiến lược, quy trình vận hành, quản lý nhân sự và chất lượng dịch vụ nội bộ',
    institution: 'Đơn vị khảo sát mẫu',
    status: 'Active',
    scale: 'Likert 5',
    target: 80,
    variables: 'STR, LEA, CAP, RES, SER, REA',
    questions: deptHeadQuestions,
    hypotheses: [
      hypo('H1', 'STR', 'CAP', 'Hiểu rõ chiến lược (STR) tác động tích cực đến năng lực phối hợp quy trình (CAP)'),
      hypo('H2', 'LEA', 'REA', 'Lãnh đạo đơn vị đổi mới (LEA) thúc đẩy mức độ sẵn sàng thay đổi (REA)'),
      hypo('H3', 'RES', 'SER', 'Hạ tầng và bồi dưỡng nhân lực (RES) tác động thuận chiều đến chất lượng phục vụ (SER)')
    ]
  },
  {
    audience: 'lecturer_staff',
    audience_name: 'Giảng viên / Giáo viên / Nhân viên',
    title: 'Bộ 3: Giảng viên / Giáo viên / Nhân viên — Công cụ làm việc, phương pháp giảng dạy và văn hóa đổi mới',
    subtitle: 'Đánh giá trực tiếp: Công cụ làm việc, phương pháp giảng dạy, văn hóa đổi mới và sự hỗ trợ từ tổ chức',
    institution: 'Đơn vị khảo sát mẫu',
    status: 'Active',
    scale: 'Likert 5',
    target: 150,
    variables: 'STR, LEA, CAP, RES, SER, REA',
    questions: facultyStaffQuestions,
    hypotheses: [
      hypo('H1', 'STR', 'REA', 'Nhận thức chiến lược (STR) tác động tích cực đến sự sẵn sàng đổi mới cá nhân (REA)'),
      hypo('H2', 'LEA', 'CAP', 'Sự đồng hành của lãnh đạo (LEA) thúc đẩy năng lực ứng dụng công nghệ (CAP)'),
      hypo('H3', 'RES', 'CAP', 'Hạ tầng và điều kiện làm việc (RES) nâng cao năng lực thích ứng chuyên môn (CAP)'),
      hypo('H4', 'SER', 'REA', 'Tập huấn và tiếp nhận phản hồi (SER) củng cố niềm tin và sự thích ứng cá nhân (REA)')
    ]
  },
  {
    audience: 'student_alumni',
    audience_name: 'Học sinh / Sinh viên / Cựu SV / Học viên SĐH',
    title: 'Bộ 4: Người học & Cựu người học — Trải nghiệm dịch vụ đào tạo, môi trường và uy tín thương hiệu',
    subtitle: 'Đánh giá từ góc độ thụ hưởng: Trải nghiệm người học, chất lượng dịch vụ đào tạo, môi trường và giá trị thương hiệu',
    institution: 'Đơn vị khảo sát mẫu',
    status: 'Active',
    scale: 'Likert 5',
    target: 200,
    variables: 'SER, RES, CAP, STR, REA',
    questions: studentAlumniQuestions,
    hypotheses: [
      hypo('H1', 'RES', 'SER', 'Môi trường CSVC và LMS (RES) tác động thuận chiều đến chất lượng đào tạo (SER)'),
      hypo('H2', 'SER', 'REA', 'Chất lượng dịch vụ đào tạo (SER) tác động tích cực đến sự hài lòng và tự hào thương hiệu (REA)'),
      hypo('H3', 'CAP', 'REA', 'Năng lực lắng nghe phản hồi (CAP) củng cố niềm tin và sự gắn kết người học (REA)')
    ]
  }
];

// Ngân hàng câu hỏi mẫu theo từng biến nghiên cứu mới
const SAMPLE_QUESTIONS_BY_VAR = {
  STR: [
    q('STR1', 'Nhà trường đã xây dựng chiến lược phát triển tổng thể, tích hợp rõ ràng các xu hướng số hóa và chuyển đổi giáo dục đại học.', 'STR'),
    q('STR2', 'Kế hoạch chiến lược của nhà trường được rà soát, định kỳ điều chỉnh linh hoạt theo sự biến động của môi trường giáo dục.', 'STR')
  ],
  LEA: [
    q('LEA1', 'Lãnh đạo thể hiện tầm nhìn và năng lực điều hành mạnh mẽ, đồng hành cùng các đơn vị trong đổi mới.', 'LEA'),
    q('LEA2', 'Nhà trường ban hành các cơ chế, thể chế quản trị linh hoạt, phân cấp mạnh mẽ tạo sự chủ động.', 'LEA')
  ],
  CAP: [
    q('CAP1', 'Cơ cấu tổ chức và quy trình phối hợp công việc diễn ra mượt mà, thích ứng nhanh với các yêu cầu mới.', 'CAP'),
    q('CAP2', 'Đơn vị và cá nhân có khả năng xử lý linh hoạt và nhanh chóng các sự cố phát sinh trong vận hành.', 'CAP')
  ],
  RES: [
    q('RES1', 'Trang thiết bị, hạ tầng CNTT và đường truyền mạng được đầu tư đầy đủ, hoạt động ổn định.', 'RES'),
    q('RES2', 'Đội ngũ nhân sự được bồi dưỡng nâng cao năng lực chuyên môn và kỹ năng số thường xuyên.', 'RES')
  ],
  SER: [
    q('SER1', 'Dịch vụ đào tạo và hành chính được thực hiện nhanh chóng, tiện lợi trên nền tảng số.', 'SER'),
    q('SER2', 'Chất lượng phục vụ và hỗ trợ người học, giảng viên luôn được duy trì ở mức cao và chuyên nghiệp.', 'SER')
  ],
  REA: [
    q('REA1', 'Toàn hệ thống đạt mức độ sẵn sàng cao trong việc thay đổi thói quen để thích ứng với yêu cầu chuyển đổi.', 'REA'),
    q('REA2', 'Có niềm tin vững chắc và sự hài lòng cao về uy tín, sự phát triển bền vững của cơ sở giáo dục.', 'REA')
  ]
};

// Map tiện ích lấy bộ câu hỏi theo chức vụ
const QUESTIONNAIRE_TEMPLATES = {
  leadership: {
    code: 'leadership',
    name: 'Bộ 1: Ban Giám hiệu & Hội đồng trường',
    defaultTitle: 'Khảo sát Quản trị Chiến lược & Thể chế vĩ mô (BGH & Hội đồng trường)',
    subtitle: 'Đánh giá ở tầm vĩ mô: Thể chế, chiến lược, quản trị số, phân bổ nguồn lực và lợi thế cạnh tranh tổng thể',
    variables: 'STR, LEA, CAP, RES, SER, REA',
    questions: bghQuestions,
    hypotheses: OFFICIAL_SURVEYS[0].hypotheses,
    defaultTarget: 50
  },
  dept_head: {
    code: 'dept_head',
    name: 'Bộ 2: Trưởng / Phó Khoa, Phòng / Ban',
    defaultTitle: 'Khảo sát Vận hành & Triển khai Chiến lược Cấp đơn vị (Khoa, Phòng, Ban)',
    subtitle: 'Đánh giá ở cấp trung: Triển khai chiến lược, quy trình vận hành, quản lý nhân sự và chất lượng dịch vụ nội bộ',
    variables: 'STR, LEA, CAP, RES, SER, REA',
    questions: deptHeadQuestions,
    hypotheses: OFFICIAL_SURVEYS[1].hypotheses,
    defaultTarget: 80
  },
  lecturer_staff: {
    code: 'lecturer_staff',
    name: 'Bộ 3: Giảng viên / Giáo viên / Nhân viên',
    defaultTitle: 'Khảo sát Phương pháp Giảng dạy, Công cụ & Môi trường làm việc (GV & NV)',
    subtitle: 'Đánh giá trực tiếp: Công cụ làm việc, phương pháp giảng dạy, văn hóa đổi mới và sự hỗ trợ từ tổ chức',
    variables: 'STR, LEA, CAP, RES, SER, REA',
    questions: facultyStaffQuestions,
    hypotheses: OFFICIAL_SURVEYS[2].hypotheses,
    defaultTarget: 150
  },
  student_alumni: {
    code: 'student_alumni',
    name: 'Bộ 4: Học sinh / Sinh viên / Cựu SV / Học viên SĐH',
    defaultTitle: 'Khảo sát Trải nghiệm Đào tạo, Dịch vụ số & Giá trị Thương hiệu (Người học)',
    subtitle: 'Đánh giá từ góc độ thụ hưởng: Trải nghiệm người học, chất lượng dịch vụ đào tạo, môi trường và giá trị thương hiệu',
    variables: 'SER, RES, CAP, STR, REA',
    questions: studentAlumniQuestions,
    hypotheses: OFFICIAL_SURVEYS[3].hypotheses,
    defaultTarget: 200
  }
};

module.exports = {
  LIKERT_5_LABELS,
  OFFICIAL_SURVEYS,
  QUESTIONNAIRE_TEMPLATES,
  SAMPLE_QUESTIONS_BY_VAR,
  bghQuestions,
  deptHeadQuestions,
  facultyStaffQuestions,
  studentAlumniQuestions
};
