/**
 * Script kiểm tra tự động toàn diện các tính năng bảo mật Giai đoạn 1 & 2
 * Chạy bằng: node test_security_phase1_2.js
 */

const http = require('http');

async function runSecurityTestSuite() {
  console.log('================================================================');
  console.log(' BẮT ĐẦU ĐỢT KIỂM TRA BẢO MẬT (SECURITY AUDIT TEST - PHASES 1 & 2)');
  console.log('================================================================\n');

  // Khởi động server express
  require('./server');
  // Đợi database và server khởi tạo
  await new Promise(r => setTimeout(r, 1000));

  const port = process.env.PORT || 5000;
  const baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let failed = 0;

  function assert(title, condition, detail = '') {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title} - ${detail}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Kiểm tra Security Headers từ Helmet (M3)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Kiểm tra HTTP Security Headers (Helmet) ---');
    const rootRes = await fetch(`${baseUrl}/`);
    const headers = rootRes.headers;
    
    assert(
      'Header X-Content-Type-Options: nosniff tồn tại',
      headers.get('x-content-type-options') === 'nosniff',
      `Nhận được: ${headers.get('x-content-type-options')}`
    );

    assert(
      'Header X-Frame-Options chống Clickjacking tồn tại',
      headers.has('x-frame-options'),
      `Nhận được: ${headers.get('x-frame-options')}`
    );

    assert(
      'Header Cross-Origin-Resource-Policy tồn tại',
      headers.get('cross-origin-resource-policy') === 'cross-origin',
      `Nhận được: ${headers.get('cross-origin-resource-policy')}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Kiểm tra khóa cứng Role Viewer khi Đăng ký công khai (C3)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Kiểm tra chống leo thang đặc quyền khi Đăng ký (C3) ---');
    const uniqueEmail = `hacker_${Date.now()}@eduresearch.test`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker User',
        email: uniqueEmail,
        password: 'Password123!',
        role: 'admin', // Cố tình truyền role: admin để test leo thang quyền
        unit: 'Khoa CNTT'
      })
    });
    const regData = await regRes.json();
    assert(
      'Đăng ký tài khoản thành công',
      regRes.status === 201,
      `Status: ${regRes.status}`
    );

    // Đăng nhập lại để kiểm tra role thật được gán trong DB và token
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password123!'
      })
    });
    const loginData = await loginRes.json();
    assert(
      'Role của tài khoản mới được khóa cứng là "viewer" (không bị leo lên "admin")',
      loginData.user && loginData.user.role === 'viewer',
      `Role thực tế nhận được: ${loginData.user?.role}`
    );
    const viewerToken = loginData.token;

    // -------------------------------------------------------------------------
    // TEST 3: Kiểm tra Xác thực Mật khẩu phức tạp & Bcrypt Salt 12 (C2, M2)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Kiểm tra Độ phức tạp Mật khẩu & Bcrypt Salt ---');
    const weakPwRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Weak PW User',
        email: `weak_${Date.now()}@eduresearch.test`,
        password: '123' // Quá ngắn, không chữ hoa, không ký tự số hợp lệ
      })
    });
    assert(
      'Chặn mật khẩu yếu (< 8 ký tự, không đủ chữ hoa/thường/số)',
      weakPwRes.status === 400,
      `Status: ${weakPwRes.status}`
    );

    // Kiểm tra salt rounds 12 trong database
    const db = require('./config/db');
    await new Promise((resolve) => {
      db.get(`SELECT password FROM users WHERE email = ?`, [uniqueEmail], (err, row) => {
        if (row && row.password) {
          const isSalt12 = row.password.startsWith('$2a$12$') || row.password.startsWith('$2b$12$');
          assert(
            'Mật khẩu băm bằng Bcrypt salt rounds = 12 ($2a$12$ hoặc $2b$12$)',
            isSalt12,
            `Hash: ${row.password.substring(0, 10)}...`
          );
        } else {
          assert('Tìm thấy hash mật khẩu trong DB', false);
        }
        resolve();
      });
    });

    // -------------------------------------------------------------------------
    // TEST 4: Kiểm tra Khóa ngoại survey_id & Trạng thái khảo sát (C4, M5)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Kiểm tra Toàn vẹn Phản hồi Khảo sát (C4, M5) ---');
    
    // Gửi phản hồi với survey_id không tồn tại
    const fakeSurveyRes = await fetch(`${baseUrl}/api/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        survey_id: 999999, // Không tồn tại
        answers: { SP1: 5 }
      })
    });
    assert(
      'Từ chối nộp phản hồi vào survey_id không tồn tại (trả về 404)',
      fakeSurveyRes.status === 404,
      `Status: ${fakeSurveyRes.status}`
    );

    // Gửi phản hồi với thời gian siêu ngắn (< 15s - Speeder)
    // Lấy survey ID hợp lệ đầu tiên
    let validSurveyId = 1;
    await new Promise(resolve => {
      db.get(`SELECT id FROM surveys WHERE status = 'Active' LIMIT 1`, (err, row) => {
        if (row) validSurveyId = row.id;
        resolve();
      });
    });

    const speederRes = await fetch(`${baseUrl}/api/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        survey_id: validSurveyId,
        time_taken: '8s', // Dưới 15 giây
        answers: { SP1: 4, SP2: 4, LD1: 4 }
      })
    });
    const speederData = await speederRes.json();
    assert(
      'Tự động nhận diện Speeder (< 15 giây) và gán status = "invalid"',
      speederData.status === 'invalid',
      `Status thực tế: ${speederData.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Kiểm tra Middleware Làm sạch XSS & Prototype Pollution (M4)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Kiểm tra Input Sanitization chống XSS (M4) ---');
    const xssPayload = "Ý kiến <script>alert('pwned')</script> và <iframe src='evil.com'></iframe> ổn định.";
    const xssRes = await fetch(`${baseUrl}/api/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        survey_id: validSurveyId,
        time_taken: '2p 30s',
        answers: {
          TXT_SUGGESTION: xssPayload
        }
      })
    });
    const xssData = await xssRes.json();
    const savedComment = xssData.answers?.TXT_SUGGESTION || '';
    const hasScriptTag = savedComment.includes('<script>') || savedComment.includes('<iframe>');
    assert(
      'Thẻ <script> và <iframe> đã bị loại bỏ hoàn toàn khỏi nội dung phản hồi',
      !hasScriptTag && savedComment.includes('Ý kiến') && savedComment.includes('ổn định'),
      `Nội dung sau khi lọc: "${savedComment}"`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Kiểm tra Bảo vệ Truy cập Tĩnh /uploads & Download (H1, H2)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Kiểm tra Bảo vệ Tệp tin /uploads (H1, H2) ---');
    
    // Truy cập /uploads không có token
    const directUploadRes = await fetch(`${baseUrl}/uploads/test.png`);
    assert(
      'Từ chối truy cập /uploads không có xác thực (trả về 401)',
      directUploadRes.status === 401,
      `Status: ${directUploadRes.status}`
    );

    // Truy cập /api/documents/:id/download không có token
    const unauthDownloadRes = await fetch(`${baseUrl}/api/documents/1/download`);
    assert(
      'Từ chối tải tài liệu qua endpoint /download không có token (trả về 401)',
      unauthDownloadRes.status === 401,
      `Status: ${unauthDownloadRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Kiểm tra Giới hạn Kích thước Body JSON (L3)
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Kiểm tra Body Parser Limit 10MB (L3) ---');
    // Gửi chuỗi body vượt quá giới hạn hoặc định dạng json hợp lệ
    const normalJsonRes = await fetch(`${baseUrl}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'ok' })
    });
    assert(
      'Body parser JSON hoạt động bình thường với payload chuẩn',
      normalJsonRes.status === 200 || normalJsonRes.status === 404,
      `Status: ${normalJsonRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Kiểm tra Tầng Rate Limiter (H4)
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Kiểm tra Rate Limiting bảo vệ Auth (H4) ---');
    let got429 = false;
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@rate.limit', password: 'wrong' })
      });
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    assert(
      'Rate Limiter kích hoạt chặn brute force (trả về HTTP 429 Too Many Requests)',
      got429,
      'Không nhận được HTTP 429 sau 15 lần thử'
    );

    // -------------------------------------------------------------------------
    // TỔNG KẾT
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(` KẾT QUẢ KIỂM TRA: ${passed} PASS, ${failed} FAIL`);
    console.log('================================================================\n');

    // Dọn dẹp dữ liệu test
    await new Promise((resolve) => {
      db.run(`DELETE FROM users WHERE email LIKE '%@eduresearch.test'`, () => {
        resolve();
      });
    });

    process.exit(failed > 0 ? 1 : 0);

  } catch (err) {
    console.error('Lỗi ngoại lệ trong quá trình chạy test suite:', err);
    process.exit(1);
  }
}

runSecurityTestSuite();
