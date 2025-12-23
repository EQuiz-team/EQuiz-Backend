import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:4200', 'exp://localhost:19000'], // Angular & React Native
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route for testing
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'EQuizz Backend API'
  });
});

// API Routes (to be implemented)
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/students', require('./routes/student.routes'));
app.use('/api/v1/quizzes', require('./routes/quiz.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

export default app;