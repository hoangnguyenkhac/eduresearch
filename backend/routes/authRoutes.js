const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

const { authLimiter, sensitiveAuthLimiter } = require('../middlewares/rateLimiter');

router.post('/register', authLimiter, authController.register);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
router.post('/login', authLimiter, authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin user hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 */
const userController = require('../controllers/userController');

router.get('/me', authenticateToken, authController.getMe);
router.put('/profile', authenticateToken, userController.updateProfile);
router.post('/change-password', authenticateToken, sensitiveAuthLimiter, userController.changePassword);
router.post('/forgot-password', sensitiveAuthLimiter, authController.forgotPassword);

module.exports = router;
