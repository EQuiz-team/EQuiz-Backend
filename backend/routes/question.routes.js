// routes/question.route.js
import express from 'express';
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  createFromTemplate,
  submitAnswer,
  getTags,
  getQuestionsByTag
} from '../controllers/question.controller.js';
import { authenticate, authorize } from '../middlewares/questionAuth/auth.middleware.js';
import validateQuestion from '../middlewares/validation/question.validation.js';
import questionController from '../controllers/questionService.controller.js';

const questionRoutes = express.Router();

// Apply authentication to all routes
questionRoutes.use(authenticate);

// ====================================
// QUESTION CRUD ROUTES
// ====================================

// Create a new question
questionRoutes.post(
  '/',
  validateQuestion.create,
  createQuestion
);

// Get all questions (with filtering, searching, pagination)
questionRoutes.get('/', getQuestions);

// Get a specific question by ID
questionRoutes.get('/:id', getQuestionById);

// Update a question
questionRoutes.put(
  '/:id',
  validateQuestion.update,
  updateQuestion
);

// Delete a question (soft delete)
questionRoutes.delete('/:id', deleteQuestion);

// ====================================
// TEMPLATE ROUTES
// ====================================

// Create a question from template
questionRoutes.post(
  '/templates/:templateId/create',
  validateQuestion.create,
  createFromTemplate
);

// Get all templates
questionRoutes.get(
  '/templates',
  (req, res, next) => {
    req.query.isTemplate = 'true';
    next();
  },
  getQuestions
);

// ====================================
// ANSWER SUBMISSION ROUTES
// ====================================

// Submit an answer for a question
questionRoutes.post(
  '/:id/submit-answer',
  validateQuestion.submitAnswer,
  submitAnswer
);

// Batch submit answers for multiple questions
//questionRoutes.post(
//  '/submit-answers/batch',
//  validateQuestion.submitBatchAnswers,
//  questionController.submitBatchAnswers
//);

// ====================================
// TAG MANAGEMENT ROUTES
// ====================================

// Get all tags (for autocomplete)
questionRoutes.get('/tags/all', getTags);

// Get questions by specific tag
questionRoutes.get('/tags/:tagId/questions', getQuestionsByTag);

// ====================================
// EXPORT/IMPORT ROUTES
// ====================================

// Export questions (with filters)
questionRoutes.post('/export', 
  validateQuestion.export,
  questionController.exportQuestions
);

// Import questions from file
questionRoutes.post('/import', 
  authenticate,
  authorize(['admin', 'instructor']),
  questionController.importQuestions
);

// Download import template
questionRoutes.get('/import/template', 
  authenticate,
  authorize(['admin', 'instructor']),
  questionController.downloadImportTemplate
);

// ====================================
// STATISTICS & ANALYTICS ROUTES
// ====================================

// Get question statistics
questionRoutes.get('/stats/overview', questionController.getQuestionStats);

// Get difficulty distribution
questionRoutes.get('/stats/difficulty', questionController.getDifficultyStats);

// Get question type distribution
questionRoutes.get('/stats/question-types', questionController.getQuestionTypeStats);

// Get course-wise statistics
questionRoutes.get('/stats/courses', questionController.getCourseStats);

// ====================================
// BULK OPERATIONS ROUTES
// ====================================

// Bulk update questions
questionRoutes.put(
  '/bulk/update',
  authenticate,
  authorize(['admin', 'instructor']),
  validateQuestion.bulkUpdate,
  questionController.bulkUpdateQuestions
);

// Bulk delete questions
questionRoutes.delete(
  '/bulk/delete',
  authenticate,
  authorize(['admin', 'instructor']),
  questionController.bulkDeleteQuestions
);

// Bulk change question status (active/inactive)
questionRoutes.put(
  '/bulk/status',
  authenticate,
  authorize(['admin', 'instructor']),
  questionController.bulkChangeStatus
);

// ====================================
// VALIDATION & DUPLICATE CHECK ROUTES
// ====================================

// Check for duplicate questions
questionRoutes.post(
  '/check-duplicate',
  validateQuestion.checkDuplicate,
  questionController.checkDuplicateQuestion
);

// Validate question data
questionRoutes.post(
  '/validate',
  validateQuestion.create,
  questionController.validateQuestionData
);

// ====================================
// PREVIEW & CLONE ROUTES
// ====================================

// Preview question (without saving)
questionRoutes.post(
  '/preview',
  validateQuestion.create,
  questionController.previewQuestion
);

// Clone a question
questionRoutes.post('/:id/clone', questionController.cloneQuestion);

// ====================================
// SEARCH & FILTER ROUTES
// ====================================

// Advanced search with multiple criteria
questionRoutes.post(
  '/search/advanced',
  questionController.advancedSearch
);

// Get filter options for dropdowns
questionRoutes.get('/filters/options', questionController.getFilterOptions);

// ====================================
// COURSE MANAGEMENT ROUTES
// ====================================

// Get all unique courses
questionRoutes.get('/courses/all', questionController.getAllCourses);

// Get questions by course
questionRoutes.get('/courses/:courseName/questions', questionController.getQuestionsByCourse);

// Update course name (affects all questions)
questionRoutes.put(
  '/courses/:oldName/rename',
  authenticate,
  authorize(['admin']),
  questionController.renameCourse
);

// ====================================
// QUESTION BANK MANAGEMENT ROUTES
// ====================================

// Get question bank statistics for dashboard
questionRoutes.get('/dashboard/stats', questionController.getDashboardStats);

// Get recent questions
questionRoutes.get('/recent', questionController.getRecentQuestions);

// Get most used questions
questionRoutes.get('/most-used', questionController.getMostUsedQuestions);

// ====================================
// SHARING & COLLABORATION ROUTES
// ====================================

// Share question with other users
questionRoutes.post(
  '/:id/share',
  validateQuestion.share,
  questionController.shareQuestion
);

// Get shared questions
questionRoutes.get('/shared/with-me', questionController.getSharedQuestions);

// Stop sharing question
questionRoutes.delete(
  '/:id/share/:userId',
  questionController.stopSharingQuestion
);

// ====================================
// VERSIONING ROUTES
// ====================================

// Create new version of question
questionRoutes.post('/:id/versions', questionController.createQuestionVersion);

// Get all versions of a question
questionRoutes.get('/:id/versions', questionController.getQuestionVersions);

// Restore to previous version
questionRoutes.put(
  '/:id/versions/:versionId/restore',
  questionController.restoreQuestionVersion
);

// Compare two versions
questionRoutes.get(
  '/:id/versions/compare/:versionId1/:versionId2',
  questionController.compareVersions
);

// ====================================
// EXPORT SPECIFIC FORMATS
// ====================================

// Export to QTI format (for LMS integration)
questionRoutes.get('/:id/export/qti', questionController.exportToQTI);

// Export to CSV
questionRoutes.post('/export/csv', questionController.exportToCSV);

// Export to JSON
questionRoutes.post('/export/json', questionController.exportToJSON);

// ====================================
// HEALTH CHECK & UTILITY ROUTES
// ====================================

// Health check for questions module
questionRoutes.get('/health', questionController.healthCheck);

// Get question count by status
questionRoutes.get('/count', questionController.getQuestionCounts);

// Clean up old/inactive questions
questionRoutes.post(
  '/cleanup',
  authenticate,
  authorize(['admin']),
  questionController.cleanupQuestions
);

// ====================================
// WEBHOOK & INTEGRATION ROUTES
// ====================================

// Webhook for external systems to create questions
questionRoutes.post(
  '/webhook/create',
  validateQuestion.webhookCreate,
  questionController.webhookCreateQuestion
);

// Sync questions with external system
questionRoutes.post(
  '/sync/external',
  authenticate,
  authorize(['admin']),
  questionController.syncWithExternal
);

// ====================================
// FEEDBACK & RATING ROUTES
// ====================================

// Add feedback to question
questionRoutes.post(
  '/:id/feedback',
  validateQuestion.feedback,
  questionController.addQuestionFeedback
);

// Get question feedback
questionRoutes.get('/:id/feedback', questionController.getQuestionFeedback);

// Rate question difficulty
questionRoutes.post(
  '/:id/rate-difficulty',
  validateQuestion.rateDifficulty,
  questionController.rateQuestionDifficulty
);

// ====================================
// AUDIT LOG ROUTES
// ====================================

// Get audit logs for question
questionRoutes.get('/:id/audit-logs', questionController.getQuestionAuditLogs);

// Get user's activity on questions
questionRoutes.get('/activity/my', questionController.getMyQuestionActivity);

// ====================================
// BACKUP & RESTORE ROUTES
// ====================================

// Create backup of questions
questionRoutes.post(
  '/backup/create',
  authenticate,
  authorize(['admin']),
  questionController.createQuestionBackup
);

// Restore from backup
questionRoutes.post(
  '/backup/restore',
  authenticate,
  authorize(['admin']),
  questionController.restoreFromBackup
);

// List available backups
questionRoutes.get('/backup/list', questionController.listBackups);

// ====================================
// MIGRATION ROUTES
// ====================================

// Migrate questions to new schema
questionRoutes.post(
  '/migrate',
  authenticate,
  authorize(['admin']),
  questionController.migrateQuestions
);

// Validate migration
questionRoutes.post(
  '/migrate/validate',
  authenticate,
  authorize(['admin']),
  questionController.validateMigration
);

export default questionRoutes;