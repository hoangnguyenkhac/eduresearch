const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const analysisController = require('../controllers/analysisController');
const { authenticateToken } = require('../middlewares/auth');

/**
 * @swagger
 * /api/surveys:
 *   get:
 *     summary: Lấy danh sách khảo sát
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách khảo sát
 *   post:
 *     summary: Tạo khảo sát mới
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               scale:
 *                 type: string
 *               questions_count:
 *                 type: integer
 *               target:
 *                 type: integer
 *               variables:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo khảo sát thành công
 */
router.get('/', authenticateToken, surveyController.getSurveys);
router.post('/sync-counts', authenticateToken, surveyController.syncSurveyCounts);
router.post('/seed-all', authenticateToken, analysisController.seedAllSurveys);
router.get('/:id/analysis', authenticateToken, analysisController.getSurveyAnalysis);
router.post('/:id/seed-responses', authenticateToken, analysisController.seedSurveyResponses);
router.get('/public/all', surveyController.getPublicSurveys);
router.get('/:id', surveyController.getSurveyById);
router.post('/', authenticateToken, surveyController.createSurvey);
router.put('/:id', authenticateToken, surveyController.updateSurvey);
router.patch('/:id/status', authenticateToken, surveyController.updateStatus);
router.post('/:id/clone', authenticateToken, surveyController.cloneSurvey);
router.delete('/:id', authenticateToken, surveyController.deleteSurvey);

module.exports = router;
