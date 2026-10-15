const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Initialize DB (this connects and seeds data automatically)
require('./config/db');

const app = express();
const port = process.env.PORT || 5000;

// CORS — chỉ cho phép domain frontend được cấu hình
const isProduction = process.env.NODE_ENV === 'production';
let allowedOrigins = [];

if (process.env.FRONTEND_URL) {
  allowedOrigins = process.env.FRONTEND_URL.split(',').map(o => o.trim());
} else if (!isProduction) {
  // Chỉ fallback localhost ở môi trường phát triển (Development)
  allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
} else {
  console.warn('[SECURITY WARNING] FRONTEND_URL is not configured in production environment.');
}

const helmet = require('helmet');
const { globalLimiter } = require('./middlewares/rateLimiter');
const { sanitizeMiddleware } = require('./middlewares/sanitize');

// Bảo mật HTTP Headers với Helmet (M3)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Cho phép API hoạt động độc lập và phục vụ Swagger/Vite
}));

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request không có origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin "${origin}" không được phép.`));
  },
  credentials: true,
}));

// Giới hạn kích thước payload JSON và form body tránh DoS (L3)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware làm sạch dữ liệu đầu vào chống Stored & Reflected XSS (M4)
app.use(sanitizeMiddleware);

// Tầng Rate Limiter toàn cục cho mọi API (H4)
app.use('/api', globalLimiter);

const path = require('path');
const { authenticateToken } = require('./middlewares/auth');

// Bảo vệ thư mục uploads — bắt buộc có token hợp lệ để truy cập file tĩnh (H2)
app.use('/uploads', authenticateToken, express.static(path.join(__dirname, 'uploads')));

// Swagger Documentation — chỉ bật ở môi trường development khi chưa bị vô hiệu hóa tường minh (C5)
if (!isProduction && process.env.DISABLE_SWAGGER !== 'true') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger UI available at /api-docs');
}

// Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const responseRoutes = require('./routes/responseRoutes');
const documentRoutes = require('./routes/documentRoutes');
const userRoutes = require('./routes/userRoutes');

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'EduResearch API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
