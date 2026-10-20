# Eduresearch

> **Hệ thống Quản lý và Phân tích Khảo sát Giáo dục Đại học Chuẩn Quốc Tế (APA 7th Edition)**

EduResearch là nền tảng số hóa toàn diện quy trình nghiên cứu khoa học giáo dục: từ thiết kế bảng hỏi khảo sát đa dạng thang đo, phân phối thực địa qua mã QR, thu thập dữ liệu định lượng & định tính trực tuyến, kiểm định làm sạch dữ liệu tự động, đến phân tích thống kê chuyên sâu (Cronbach Alpha, EFA/KMO, Pearson Correlation) và xuất báo cáo học thuật hoàn chỉnh chuẩn APA 7 (.doc).

---

## 🌟 Tính Năng Nổi Bật

1. **Khảo sát Thực địa & Phân phối Đa Kênh**:
   - Tự động sinh mã QR phân giải cao, hỗ trợ tải ảnh QR (.png) để in ấn phiếu giấy hoặc poster hội thảo.
   - 1-Click Nhân bản bảng hỏi (`POST /api/surveys/:id/clone`) kèm toàn bộ câu hỏi và giả thuyết nghiên cứu.
   - Thanh tiến độ trực tiếp (Live Progress) và chế độ xem trước an toàn (`?preview=true`).

2. **Phân Tích Thống Kê Chuẩn Học Thuật**:
   - **Độ tin cậy thang đo**: Tính toán hệ số Cronbach's Alpha và tương quan biến - tổng.
   - **Phân tích nhân tố khám phá (EFA)**: Kiểm định KMO, kiểm định Bartlett's và ma trận xoay nhân tố Varimax.
   - **Ma trận tương quan Pearson**: Tương quan cặp $r$ (2-tailed) với mức ý nghĩa $p < 0.05^*$ và $p < 0.01^{**}$, kiểm tra đa cộng tuyến.
   - **Xuất Báo cáo Học thuật APA 7 (.doc)**: Tự động tạo file Word định dạng chuẩn viện nghiên cứu với đầy đủ bảng biểu và trích dẫn.

3. **Thu Thập & Phân Tích Ý Kiến Định Tính (Qualitative Text Analytics)**:
   - Thu thập ý kiến tự luận văn bản, phân loại cảm xúc (Sentiment Analysis).
   - Word Cloud tương tác trực quan hóa các từ khóa rào cản và đề xuất chính sách.

4. **Làm Sạch Dữ Liệu Thông Minh (Smart Data Cleaning)**:
   - Thuật toán quét và nhận diện tự động các phiếu *Straightlining* (chọn cùng 1 đáp án) và *Speeders* (làm dưới 20 giây).
   - 1-Click loại trừ phiếu lỗi để đảm bảo tính chuẩn xác của dữ liệu nghiên cứu.
   - Nhập liệu hàng loạt từ file Excel / CSV (`POST /api/responses/import`).
   - Thao tác hàng loạt: Đánh dấu hợp lệ, loại trừ, hoặc xóa hàng loạt.

5. **Hồ Sơ Cá Nhân & Quản Trị**:
   - Quản lý thông tin học thuật, đơn vị công tác và đổi mật khẩu an toàn.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 18, Vite, React Router DOM, Recharts, Lucide Icons, QR Code Canvas, Modern Vanilla CSS Design Tokens.
- **Backend**: Node.js, Express.js, SQLite3, JWT Authentication, Bcryptjs, CORS.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử Nghiệm

### 1. Khởi động Backend Server
```bash
cd backend
npm install
npm start
# Server chạy tại http://localhost:5000
```

### 2. Khởi động Frontend Dev Server
```bash
npm install
npm run dev
# Giao diện chạy tại http://localhost:5173
```

---

## 👤 Tài Khoản Quản Trị Mặc Định

- **Email**: `admin@eduresearch.com`
- **Mật khẩu**: `admin`
- **Vai trò**: Quản trị viên cấp cao (Super Admin)
