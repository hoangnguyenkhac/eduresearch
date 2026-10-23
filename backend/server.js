const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Initialize DB (this connects and seeds data automatically)
require('./config/db');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const responseRoutes = require('./routes/responseRoutes');
const documentRoutes = require('./routes/documentRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);

// Global Error Handler returning JSON
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Lỗi xử lý yêu cầu trên máy chủ.'
  });
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
