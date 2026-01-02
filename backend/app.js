import express from 'express';
import cookieParser from 'cookie-parser';

import { PORT, NODE_ENV } from './config/env.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import questRouter from './routes/question.routes.js';
import connectionToDatabase from './database/postgress.js';
import errorMiddleware from './middlewares/error.middleware.js';
import arcjetMiddleware from './middlewares/arcjet.middleware.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(arcjetMiddleware);

// Use the imported routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/questions', questRouter);

app.use(errorMiddleware);

// Basic route for testing

app.get('/', (req, res) => {
  res.send('Hello, EQuiz Backend!');
});

const startServer = async () => {
  console.log(`Starting server in ${NODE_ENV} mode on port ${PORT}`);
  //const PORT = process.env.PORT;

  try {
    await connectionToDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
};

startServer();

export default app;