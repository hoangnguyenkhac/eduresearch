const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const analysisController = require('../controllers/analysisController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', authenticateToken, surveyController.getSurveys);
router.post('/seed-all', authenticateToken, analysisController.seedAllSurveys);
router.get('/:id/analysis', authenticateToken, analysisController.getSurveyAnalysis);
router.post('/:id/seed-responses', authenticateToken, analysisController.seedSurveyResponses);
router.get('/:id', surveyController.getSurveyById);
router.post('/', authenticateToken, surveyController.createSurvey);
router.put('/:id', authenticateToken, surveyController.updateSurvey);
router.patch('/:id/status', authenticateToken, surveyController.updateStatus);
router.post('/:id/clone', authenticateToken, surveyController.cloneSurvey);
router.delete('/:id', authenticateToken, surveyController.deleteSurvey);

module.exports = router;

