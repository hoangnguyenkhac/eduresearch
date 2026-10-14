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
router.get('/', authenticateToken, responseController.getResponses);
router.post('/', responseController.createResponse);
router.post('/import', authenticateToken, responseController.importResponses);
router.post('/bulk-delete', authenticateToken, responseController.bulkDeleteResponses);
router.post('/bulk-status', authenticateToken, responseController.bulkUpdateStatus);
router.delete('/:id', authenticateToken, responseController.deleteResponse);

module.exports = router;
