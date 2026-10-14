const q = (code, text, variable, extra = {}) => ({
  code,
  text,
  variable,
  type: extra.type || 'likert',
  ...extra
});

const leadershipQuestions = [
  q('INFO_POSITION', 'Vị trí công tác', 'INFO', {
    type: 'choice',
    section: 'demographics',
    mapsTo: 'role',
    options: [
      'Ban Giám hiệu / Hội đồng trường / BCH Đảng ủy',
      'Trưởng / Phó Phòng, Ban, Trung tâm',
      'Trưởng / Phó Khoa, Viện chuyên môn'
    ]
  }),
  q('INFO_TENURE', 'Thâm niên quản lý', 'INFO', {
    type: 'choice',
    section: 'demographics',
    options: ['Dưới 3 năm', 'Từ 3 – 5 năm', 'Từ 5 – 10 năm', 'Trên 10 năm']
  }),
  q('INFO_INSTITUTION', 'Loại hình cơ sở', 'INFO', {
    type: 'choice',
    section: 'demographics',
    mapsTo: 'unit',
    options: ['Công lập', 'Tư thục / Nước ngoài']
  }),

  q('SP1', 'Ban lãnh đạo đã xây dựng chiến lược và lộ trình chuyển đổi số dài hạn, rõ ràng cho nhà trường.', 'SP', { group: '2.1. Lập kế hoạch chiến lược (SP)' }),
  q('SP2', 'Các mục tiêu chuyển đổi số được gắn kết chặt chẽ với sứ mệnh và lợi thế cạnh tranh của cơ sở giáo dục.', 'SP'),
  q('SP3', 'Nguồn lực tài chính và hạ tầng công nghệ được ưu tiên phân bổ đầy đủ cho các hoạt động chuyển đổi số.', 'SP'),
  q('SP4', 'Nhà trường thường xuyên đánh giá, cập nhật chiến lược số để phản ứng linh hoạt với các xu hướng giáo dục mới.', 'SP'),

  q('LD1', 'Ban lãnh đạo luôn thể hiện vai trò tiên phong, cam kết mạnh mẽ và truyền cảm hứng trong đổi mới công nghệ.', 'LD', { group: '2.2. Lãnh đạo và quản trị số (LD)' }),
  q('LD2', 'Cán bộ quản lý chủ động khuyến khích, tạo cơ chế linh hoạt cho các sáng kiến số hóa tại các đơn vị.', 'LD'),
  q('LD3', 'Nhà trường có chính sách khen thưởng, động viên kịp thời các cá nhân, tập thể ứng dụng hiệu quả công nghệ.', 'LD'),
  q('LD4', 'Ban lãnh đạo sẵn sàng lắng nghe, hỗ trợ tháo gỡ các rào cản thể chế và kỹ thuật trong quá trình thực hiện.', 'LD'),

  q('DX1', 'Toàn bộ quy trình quản trị, điều hành và thủ tục hành chính nội bộ đã được số hóa và chuẩn hóa đồng bộ.', 'DX', { group: '2.3. Mức độ chuyển đổi số của tổ chức (DX)' }),
  q('DX2', 'Hệ thống dữ liệu toàn trường được kết nối, chia sẻ liên thông giữa các phòng/khoa/trung tâm.', 'DX'),
  q('DX3', 'Cơ sở hạ tầng công nghệ thông tin và an toàn dữ liệu đáp ứng tốt yêu cầu quản trị số hiện đại.', 'DX'),
  q('DX4', 'Việc số hóa giúp tối ưu hóa chi phí vận hành và nâng cao năng lực cạnh tranh của nhà trường.', 'DX'),

  q('AT1', 'Nhà trường có khả năng tái cấu trúc mô hình quản trị nhanh chóng trước sự biến động của môi trường giáo dục.', 'AT', { group: '2.4. Năng lực thích ứng tổ chức (AT)' }),
  q('AT2', 'Đội ngũ cán bộ quản lý đạt mức độ sẵn sàng cao và làm chủ được các công cụ quản trị số.', 'AT'),
  q('AT3', 'Văn hóa đổi mới sáng tạo và chấp nhận rủi ro công nghệ đã được hình thành rõ nét trong Nhà trường.', 'AT'),
  q('AT4', 'Năng lực chuyển đổi số góp phần khẳng định vị thế và uy tín thu hút người học của Nhà trường.', 'AT'),

  q('TXT_BARRIER_LD', 'Theo Ông/Bà, đâu là rào cản lớn nhất về mặt cơ chế, nguồn lực hoặc văn hóa tổ chức trong quá trình chuyển đổi số tại trường?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Ví dụ: cơ chế, nguồn lực tài chính, hạ tầng, văn hóa tổ chức...'
  }),
  q('TXT_SUGGESTION_LD', 'Ông/Bà có đề xuất chiến lược gì để nâng cao lợi thế cạnh tranh và tốc độ chuyển đổi của nhà trường trong 3–5 năm tới?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Nhập đề xuất chiến lược cụ thể...'
  })
];

const staffQuestions = [
  q('INFO_ROLE', 'Vai trò công tác', 'INFO', {
    type: 'choice',
    section: 'demographics',
    mapsTo: 'role',
    options: [
      'Giảng viên / Giáo viên trực tiếp giảng dạy',
      'Chuyên viên / Nhân viên nghiệp vụ'
    ]
  }),
  q('INFO_EDUCATION', 'Trình độ chuyên môn', 'INFO', {
    type: 'choice',
    section: 'demographics',
    options: ['Cử nhân / Kỹ sư', 'Thạc sĩ', 'Tiến sĩ / PGS / GS']
  }),
  q('INFO_TENURE', 'Thâm niên công tác', 'INFO', {
    type: 'choice',
    section: 'demographics',
    options: ['Dưới 3 năm', 'Từ 3 – 5 năm', 'Từ 5 – 10 năm', 'Trên 10 năm']
  }),

  q('SP_GV1', 'Kế hoạch và định hướng chuyển đổi số của nhà trường được phổ biến rõ ràng đến từng cán bộ, giảng viên.', 'SP', { group: '2.1. Nhận thức chiến lược & Môi trường làm việc (SP & CS)' }),
  q('CS_GV1', 'Nhà trường cung cấp đầy đủ trang thiết bị, phần mềm và hạ tầng mạng ổn định phục vụ giảng dạy/nghiệp vụ.', 'CS'),
  q('CS_GV2', 'Bộ phận hỗ trợ kỹ thuật (IT) phản hồi và xử lý các sự cố công nghệ nhanh chóng, hiệu quả.', 'CS'),

  q('DX_GV1', 'Phương pháp giảng dạy/quy trình công việc cá nhân đã được số hóa mạnh mẽ (Sử dụng LMS, phần mềm quản lý, kho liệu số).', 'DX', { group: '2.2. Mức độ số hóa giảng dạy & Công tác nghiệp vụ (DX)' }),
  q('DX_GV2', 'Việc tra cứu, lưu trữ và chia sẻ tài liệu/dữ liệu công việc được thực hiện dễ dàng trên môi trường số.', 'DX'),
  q('DX_GV3', 'Cán bộ, giảng viên được tham gia các khóa tập huấn, bồi dưỡng kỹ năng số thường xuyên và thiết thực.', 'DX'),
  q('DX_GV4', 'Việc ứng dụng các công cụ số giúp nâng cao đáng kể năng suất làm việc và chất lượng bài giảng.', 'DX'),

  q('LD_GV1', 'Lãnh đạo đơn vị (Trưởng khoa/phòng) luôn khuyến khích và tạo điều kiện cho thầy/cô đổi mới phương pháp số.', 'LD', { group: '2.3. Lãnh đạo & Tinh thần đổi mới (LD)' }),
  q('LD_GV2', 'Các đề xuất cải tiến quy trình hoặc sáng kiến công nghệ từ giảng viên/nhân viên được ghi nhận tích cực.', 'LD'),

  q('AT_GV1', 'Bản thân tôi hoàn toàn tự tin và làm chủ được các phần mềm, nền tảng số trong công việc hàng ngày.', 'AT', { group: '2.4. Năng lực thích ứng & Bản lĩnh số (AT)' }),
  q('AT_GV2', 'Tôi sẵn sàng học hỏi, thay đổi thói quen làm việc truyền thống để thích ứng với các công nghệ mới.', 'AT'),
  q('AT_GV3', 'Ứng dụng công nghệ giúp tôi giảm bớt áp lực thủ tục hành chính thủ công và tập trung vào chuyên môn.', 'AT'),
  q('AT_GV4', 'Nhìn chung, việc chuyển đổi số mang lại giá trị thiết thực cho sự phát triển nghề nghiệp của cá nhân tôi.', 'AT'),

  q('TXT_BARRIER_GV', 'Thầy/Cô/Anh/Chị gặp khó khăn gì lớn nhất về kỹ năng, công cụ hay thời gian khi triển khai giảng dạy/làm việc số?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Ví dụ: kỹ năng số, công cụ, thời gian, hạ tầng...'
  }),
  q('TXT_SUGGESTION_GV', 'Thầy/Cô/Anh/Chị có nguyện vọng hoặc kiến nghị cụ thể nào về chính sách, tập huấn hay hạ tầng để làm việc hiệu quả hơn?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Nhập kiến nghị về chính sách, tập huấn hoặc hạ tầng...'
  })
];

const studentQuestions = [
  q('INFO_YEAR', 'Trình độ / Khối lớp', 'INFO', {
    type: 'choice',
    section: 'demographics',
    mapsTo: 'role',
    options: [
      'Sinh viên Năm 1',
      'Sinh viên Năm 2 – 3',
      'Sinh viên Năm 4',
      'Học viên Sau đại học'
    ]
  }),
  q('INFO_MAJOR', 'Khối ngành học', 'INFO', {
    type: 'choice',
    section: 'demographics',
    mapsTo: 'unit',
    options: [
      'Khoa học Kỹ thuật / Công nghệ',
      'Kinh tế / Quản trị / Luật',
      'Xã hội / Nhân văn / Giáo dục'
    ]
  }),
  q('INFO_DEVICE', 'Thiết bị học tập chính', 'INFO', {
    type: 'choice',
    section: 'demographics',
    options: [
      'Máy tính xách tay (Laptop)',
      'Máy tính bảng',
      'Điện thoại thông minh',
      'Máy tính để bàn'
    ]
  }),

  q('CS_SV1', 'Cổng thông tin và Hệ thống quản lý học tập (LMS/Portal) của nhà trường hoạt động ổn định, dễ sử dụng.', 'CS', { group: '2.1. Chất lượng dịch vụ & Hạ tầng số (CS)' }),
  q('CS_SV2', 'Các dịch vụ hành chính sinh viên (đăng ký tín chỉ, xem lịch học, nộp học phí, xin xác nhận) được thực hiện trực tuyến thuận tiện.', 'CS'),
  q('CS_SV3', 'Hệ thống Wifi và phòng máy tính/thư viện số của trường đáp ứng tốt nhu cầu học tập và nghiên cứu.', 'CS'),
  q('CS_SV4', 'Mọi thắc mắc, phản ánh về kỹ thuật hoặc học tập trực tuyến được nhà trường giải đáp và hỗ trợ kịp thời.', 'CS'),

  q('DX_SV1', 'Giảng viên/Giáo viên ứng dụng đa dạng các công cụ số (slide tương tác, video, quiz, bài giảng số) vào giờ học.', 'DX', { group: '2.2. Đổi mới giảng dạy & Mức độ tương tác số (DX)' }),
  q('DX_SV2', 'Tài liệu học tập, bài giảng và bài tập được cung cấp đầy đủ, kịp thời trên hệ thống học tập trực tuyến.', 'DX'),
  q('DX_SV3', 'Hình thức kiểm tra, đánh giá trực tuyến (thi online, nộp bài LMS) được thực hiện minh bạch, khách quan.', 'DX'),

  q('AT_SV1', 'Em/Sinh viên được nhà trường hướng dẫn kỹ lưỡng kỹ năng sử dụng các phần mềm và nền tảng học tập số.', 'AT', { group: '2.3. Năng lực thích ứng & Hiệu quả học tập số (AT)' }),
  q('AT_SV2', 'Em/Sinh viên hoàn toàn tự tin khai thác tài nguyên số (thư viện điện tử, phần mềm) để tự học.', 'AT'),
  q('AT_SV3', 'Việc học tập kết hợp công nghệ (Blended learning) giúp em chủ động, linh hoạt và tăng hứng thú học tập.', 'AT'),
  q('AT_SV4', 'Việc ứng dụng chuyển đổi số của nhà trường góp phần cải thiện rõ rệt kết quả học tập và kỹ năng số của em.', 'AT'),

  q('TXT_BARRIER_SV', 'Những trở ngại lớn nhất mà Bạn/Sinh viên gặp phải khi sử dụng các dịch vụ số hoặc học tập trực tuyến tại trường là gì?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Ví dụ: đường truyền, LMS, thiết bị, kỹ năng...'
  }),
  q('TXT_SUGGESTION_SV', 'Bạn/Sinh viên có mong muốn hoặc đề xuất gì để nhà trường cải thiện hệ thống học tập số và dịch vụ hỗ trợ sinh viên?', 'QUALITATIVE', {
    type: 'textarea',
    placeholder: 'Nhập đề xuất cải thiện hệ thống học tập số...'
  })
];

const hypo = (code, independent, dependent, description) => ({
  code,
  name: `${independent} ➔ ${dependent}`,
  description,
  independent,
  dependent,
  status: 'pending'
});

const OFFICIAL_SURVEYS = [
  {
    audience: 'leadership',
    title: 'Phiếu 1: Ban lãnh đạo / Quản lý — Chiến lược, lãnh đạo số và thích ứng tổ chức',
    subtitle: 'Tập trung vào Quản trị chiến lược, Định hướng nguồn lực, Năng lực lãnh đạo số và Thích ứng tổ chức',
    status: 'Active',
    scale: 'Likert 5',
    target: 80,
    variables: 'SP, LD, DX, AT',
    questions: leadershipQuestions,
    hypotheses: [
      hypo('H1', 'SP', 'AT', 'Lập kế hoạch chiến lược (SP) có tác động thuận chiều đến năng lực thích ứng tổ chức (AT)'),
      hypo('H2', 'LD', 'AT', 'Lãnh đạo và quản trị số (LD) có tác động thuận chiều đến năng lực thích ứng tổ chức (AT)'),
      hypo('H3', 'DX', 'AT', 'Mức độ chuyển đổi số của tổ chức (DX) có tác động thuận chiều đến năng lực thích ứng tổ chức (AT)')
    ]
  },
  {
    audience: 'staff',
    title: 'Phiếu 2: Giảng viên & Cán bộ nhân viên — Ứng dụng công nghệ giảng dạy và sẵn sàng cá nhân',
    subtitle: 'Tập trung vào Ứng dụng công nghệ giảng dạy, Quy trình nghiệp vụ, Kỹ năng số và Sự sẵn sàng cá nhân',
    status: 'Active',
    scale: 'Likert 5',
    target: 150,
    variables: 'SP, CS, DX, LD, AT',
    questions: staffQuestions,
    hypotheses: [
      hypo('H1', 'SP', 'AT', 'Nhận thức chiến lược (SP) có tác động thuận chiều đến năng lực thích ứng cá nhân (AT)'),
      hypo('H2', 'CS', 'AT', 'Môi trường làm việc số / chất lượng hỗ trợ (CS) có tác động thuận chiều đến AT'),
      hypo('H3', 'DX', 'AT', 'Mức độ số hóa giảng dạy và nghiệp vụ (DX) có tác động thuận chiều đến AT'),
      hypo('H4', 'LD', 'AT', 'Lãnh đạo và tinh thần đổi mới (LD) có tác động thuận chiều đến AT')
    ]
  },
  {
    audience: 'student',
    title: 'Phiếu 3: Học viên, sinh viên — Trải nghiệm dịch vụ số và hiệu quả học tập',
    subtitle: 'Tập trung vào Trải nghiệm dịch vụ số, Chất lượng công cụ học tập trực tuyến, Sự chủ động và Hiệu quả học tập',
    status: 'Active',
    scale: 'Likert 5',
    target: 200,
    variables: 'CS, DX, AT',
    questions: studentQuestions,
    hypotheses: [
      hypo('H1', 'CS', 'AT', 'Chất lượng dịch vụ và hạ tầng số (CS) có tác động thuận chiều đến năng lực thích ứng và hiệu quả học tập (AT)'),
      hypo('H2', 'DX', 'AT', 'Đổi mới giảng dạy và tương tác số (DX) có tác động thuận chiều đến AT')
    ]
  }
];

const SAMPLE_QUESTIONS_BY_VAR = {
  SP: leadershipQuestions.filter(item => item.variable === 'SP' && item.type === 'likert'),
  LD: leadershipQuestions.filter(item => item.variable === 'LD' && item.type === 'likert'),
  DX: leadershipQuestions.filter(item => item.variable === 'DX' && item.type === 'likert'),
  AT: leadershipQuestions.filter(item => item.variable === 'AT' && item.type === 'likert'),
  CS: studentQuestions.filter(item => item.variable === 'CS' && item.type === 'likert')
};

module.exports = {
  OFFICIAL_SURVEYS,
  SAMPLE_QUESTIONS_BY_VAR,
  leadershipQuestions,
  staffQuestions,
  studentQuestions
};
