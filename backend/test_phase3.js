/**
 * Automated test suite for Phase 3:
 * 1. Forgot Password flow (user enumeration defense, secure token generation)
 * 2. Reset Password flow (validation, replay attack protection)
 * 3. Session Revocation via token_version
 * 
 * Run: node test_phase3.js
 */

async function runPhase3Tests() {
  console.log('================================================================');
  console.log(' BẮT ĐẦU KIỂM TRA BẢO MẬT GIAI ĐOẠN 3 (PHASE 3 TEST SUITE)');
  console.log('================================================================\n');

  require('./server');
  await new Promise(r => setTimeout(r, 1000));

  const port = process.env.PORT || 5000;
  const baseUrl = `http://localhost:${port}`;
  const db = require('./config/db');

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

  const testEmail = `user_p3_${Date.now()}@eduresearch.test`;
  const initialPassword = 'Password123!';
  const newPassword = 'NewSecretPassword456!';

  try {
    // -------------------------------------------------------------------------
    // 1. Tạo user test & Login
    // -------------------------------------------------------------------------
    console.log('--- 1. Thiết lập tài khoản test & Đăng nhập ban đầu ---');
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase 3 Tester',
        email: testEmail,
        password: initialPassword,
        unit: 'Khảo thí'
      })
    });
    assert('Đăng ký tài khoản thử nghiệm thành công', regRes.status === 201);

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: initialPassword })
    });
    const loginData = await loginRes.json();
    const tokenOld = loginData.token;
    assert('Đăng nhập ban đầu thành công và nhận JWT token', !!tokenOld);

    // Xác thực token cũ hoạt động
    const meRes1 = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenOld}` }
    });
    assert('Token cũ hợp lệ khi gọi /api/auth/me (HTTP 200)', meRes1.status === 200);

    // -------------------------------------------------------------------------
    // 2. Kiểm tra Luồng Quên mật khẩu (Forgot Password)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Kiểm tra Luồng Quên Mật Khẩu & Chống User Enumeration (H6) ---');
    
    // Test email không tồn tại
    const fakeForgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_account_xyz@test.com' })
    });
    const fakeForgotData = await fakeForgotRes.json();
    assert(
      'Email không tồn tại vẫn trả về thông báo chung (chống rà quét tài khoản / User Enumeration)',
      fakeForgotRes.status === 200 && fakeForgotData.message.includes('Nếu email của bạn tồn tại'),
      `Msg: ${fakeForgotData.message}`
    );

    // Test email tồn tại thực
    const realForgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const realForgotData = await realForgotRes.json();
    const resetToken = realForgotData.resetToken;
    assert('Tạo mã token khôi phục mật khẩu 64 ký tự thành công', typeof resetToken === 'string' && resetToken.length === 64);

    // -------------------------------------------------------------------------
    // 3. Kiểm tra Luồng Đặt lại mật khẩu (Reset Password)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Kiểm tra Luồng Đặt Lại Mật Khẩu & Chống Replay (H6) ---');
    
    // Thử token giả mạo
    const invalidTokenRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'fake_invalid_token_123', newPassword: newPassword })
    });
    assert('Chặn token khôi phục không hợp lệ (HTTP 400)', invalidTokenRes.status === 400);

    // Thử mật khẩu mới yếu
    const weakResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, newPassword: '123' })
    });
    assert('Chặn mật khẩu mới yếu trong luồng reset password (HTTP 400)', weakResetRes.status === 400);

    // Đặt lại mật khẩu thành công với token thật và mật khẩu mạnh
    const validResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, newPassword: newPassword })
    });
    const validResetData = await validResetRes.json();
    assert('Đặt lại mật khẩu thành công bằng token hợp lệ', validResetRes.status === 200);

    // Thử dùng lại token vừa dùng (Chống Replay Attack)
    const replayRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, newPassword: 'AnotherPassword789!' })
    });
    const replayText = await replayRes.text();
    assert('Chặn sử dụng lại token đã tiêu thụ (Chống Replay Attack)', replayRes.status === 400, `Status: ${replayRes.status}, Body: ${replayText}`);

    // -------------------------------------------------------------------------
    // 4. Kiểm tra Thu hồi Phiên cũ qua token_version (H5)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Kiểm tra Tự động Thu hồi Phiên cũ khi đổi mật khẩu (H5) ---');
    
    // Gọi /api/auth/me bằng token cũ (trước khi đổi mật khẩu)
    const meResOld = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenOld}` }
    });
    assert(
      'Token cũ bị thu hồi ngay lập tức sau khi đổi mật khẩu (HTTP 401 Session Revoked)',
      meResOld.status === 401,
      `Status: ${meResOld.status}`
    );

    // Đăng nhập bằng mật khẩu mới
    const loginNewRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: newPassword })
    });
    const loginNewData = await loginNewRes.json();
    assert('Đăng nhập thành công với mật khẩu mới', loginNewRes.status === 200 && !!loginNewData.token);

    // Gọi /api/auth/me bằng token mới
    const meResNew = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${loginNewData.token}` }
    });
    assert('Token mới hoạt động bình thường (HTTP 200)', meResNew.status === 200);

    // -------------------------------------------------------------------------
    // Dọn dẹp dữ liệu test
    // -------------------------------------------------------------------------
    await new Promise(resolve => {
      db.run(`DELETE FROM users WHERE email = ?`, [testEmail], () => {
        db.run(`DELETE FROM password_resets WHERE token_hash IS NOT NULL`, () => {
          resolve();
        });
      });
    });

    console.log('\n================================================================');
    console.log(` KẾT QUẢ GIAI ĐOẠN 3: ${passed} PASS, ${failed} FAIL`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);

  } catch (err) {
    console.error('Lỗi ngoại lệ trong quá trình test Phase 3:', err);
    process.exit(1);
  }
}

runPhase3Tests();
