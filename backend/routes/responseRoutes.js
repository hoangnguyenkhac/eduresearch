const express = require('express');
const router = express.Router();
const responseController = require('../controllers/responseController');
const { authenticateToken } = require('../middlewares/auth');

/**
 * @swagger
 * /api/responses:
 *   get:
 *     summary: Lấy dữ liệu phản hồi khảo sát
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: surveyId
 *         schema:
 *           type: integer
 *         description: ID của khảo sát
 *     responses:
 *       200:
 *         description: Dữ liệu phản hồi
 *   post:
 *     summary: Gửi phản hồi mới
 *     tags: [Responses]
 *     responses:
 *       201:
 *         description: Gửi phản hồi thành công
 */
const rateLimit = require('express-rate-limit');

// Rate limiter cho gửi phản hồi khảo sát công khai — chống bot spam / DoS
const publicResponseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn đang gửi phản hồi quá thường xuyên. Vui lòng chờ 1 phút trước khi thử lại.' }
});

router.get('/', authenticateToken, responseController.getResponses);
router.post('/', publicResponseLimiter, responseController.createResponse);
router.post('/import', authenticateToken, responseController.importResponses);
router.post('/bulk-delete', authenticateToken, responseController.bulkDeleteResponses);
router.post('/bulk-status', authenticateToken, responseController.bulkUpdateStatus);
router.delete('/:id', authenticateToken, responseController.deleteResponse);

module.exports = router;
