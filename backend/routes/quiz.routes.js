// routes/quiz.routes.js
import express from 'express';
import { quizController } from '../controllers/quiz.controller.js';
import { authenticate, authorize } from '../middleware/questionAuth/auth.middleware.js';

const quizRoutes = express.Router();

// Quiz management routes
quizRoutes.post('/quizzes', authenticate, authorize(['instructor', 'admin']), quizController.createQuiz);
quizRoutes.get('/quizzes', authenticate, quizController.getAllQuizzes);
quizRoutes.get('/quizzes/:id', authenticate, quizController.getQuizById);
quizRoutes.put('/quizzes/:id', authenticate, authorize(['instructor', 'admin']), quizController.updateQuiz);
quizRoutes.delete('/quizzes/:id', authenticate, authorize(['instructor', 'admin']), quizController.deleteQuiz);
quizRoutes.post('/quizzes/:id/publish', authenticate, authorize(['instructor', 'admin']), quizController.publishQuiz);

// Question bank routes
quizRoutes.get('/question-bank', authenticate, authorize(['instructor', 'admin']), quizController.getQuestionBank);

// Quiz attempt routes
quizRoutes.post('/quizzes/:quizId/attempt', authenticate, quizController.startQuizAttempt);
quizRoutes.post('/attempts/:attemptId/submit', authenticate, quizController.submitQuizAttempt);
quizRoutes.get('/attempts/:attemptId/results', authenticate, quizController.getAttemptResults);

// Response viewing routes
quizRoutes.get('/quizzes/:quizId/responses', authenticate, authorize(['instructor', 'admin']), quizController.getQuizResponses);

export default quizRoutes;