const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/auth');

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Lấy dữ liệu thống kê Dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dữ liệu dashboard
 */
router.get('/', authenticateToken, dashboardController.getDashboardData);

module.exports = router;
