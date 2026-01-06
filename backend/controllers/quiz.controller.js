// controllers/quiz.controller.js
import { Quiz, QuizQuestion, QuizClass, QuizAttempt } from '../models/associationQuiz.js';
import { Question } from '../models/question.model.js';
import { Course } from '../models/course.model.js';

export const quizController = {
  // Create a new quiz
  createQuiz: async (req, res) => {
    try {
      const {
        title,
        description,
        courseId,
        evaluationType,
        startDate,
        endDate,
        duration,
        maxAttempts,
        passingScore,
        showResults,
        shuffleQuestions,
        shuffleOptions,
        allowReview,
        instructions,
        accessibleClasses,
        questions
      } = req.body;

      // Generate quiz code based on evaluation type and course
      const course = await Course.findByPk(courseId);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const quizCount = await Quiz.count({ where: { courseId, evaluationType } });
      const quizCode = `${evaluationType.toUpperCase().substring(0, 3)}-${course.code}-${new Date().getFullYear()}-${quizCount + 1}`;

      const quiz = await Quiz.create({
        quizCode,
        title,
        description,
        courseId,
        evaluationType,
        status: 'draft',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        duration: parseInt(duration),
        maxAttempts: parseInt(maxAttempts),
        passingScore: parseFloat(passingScore),
        showResults: showResults || false,
        shuffleQuestions: shuffleQuestions || false,
        shuffleOptions: shuffleOptions || false,
        allowReview: allowReview || false,
        instructions
      });

      // Add accessible classes if provided
      if (accessibleClasses && accessibleClasses.length > 0) {
        const classPromises = accessibleClasses.map(classId => 
          QuizClass.create({ quizId: quiz.id, classId })
        );
        await Promise.all(classPromises);
      }

      // Add questions if provided
      if (questions && questions.length > 0) {
        const questionPromises = questions.map((question, index) => 
          QuizQuestion.create({
            quizId: quiz.id,
            questionId: question.id,
            points: question.points || 1,
            order: index
          })
        );
        await Promise.all(questionPromises);
        
        // Calculate total points and questions
        const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
        await quiz.update({ 
          totalPoints, 
          totalQuestions: questions.length 
        });
      }

      const quizWithDetails = await Quiz.findByPk(quiz.id, {
        include: [
          { model: Course, as: 'course' },
          { model: QuizQuestion, as: 'quizQuestions', include: [{ model: Question, as: 'question' }] },
          { model: QuizClass, as: 'accessibleClasses' }
        ]
      });

      res.status(201).json(quizWithDetails);
    } catch (error) {
      console.error('Error creating quiz:', error);
      res.status(500).json({ error: 'Failed to create quiz' });
    }
  },

  // Get all quizzes
  getAllQuizzes: async (req, res) => {
    try {
      const { status, courseId, evaluationType } = req.query;
      const where = {};
      
      if (status) where.status = status;
      if (courseId) where.courseId = courseId;
      if (evaluationType) where.evaluationType = evaluationType;

      const quizzes = await Quiz.findAll({
        where,
        include: [
          { model: Course, as: 'course', attributes: ['id', 'code', 'name'] },
          { model: QuizQuestion, as: 'quizQuestions' },
          { model: QuizAttempt, as: 'attempts' }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Calculate statistics
      const totalQuizzes = await Quiz.count();
      const totalAttempts = await QuizAttempt.count();
      const activeQuizzes = await Quiz.count({ where: { status: 'active' } });
      
      // Calculate average score from all graded attempts
      const gradedAttempts = await QuizAttempt.findAll({ 
        where: { status: 'graded' },
        attributes: ['score']
      });
      
      const avgScore = gradedAttempts.length > 0 
        ? gradedAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / gradedAttempts.length
        : 0;

      res.json({
        quizzes,
        statistics: {
          totalQuizzes,
          totalAttempts,
          activeQuizzes,
          avgScore: parseFloat(avgScore.toFixed(1))
        }
      });
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
  },

  // Get quiz by ID
  getQuizById: async (req, res) => {
    try {
      const { id } = req.params;
      const quiz = await Quiz.findByPk(id, {
        include: [
          { model: Course, as: 'course' },
          { 
            model: QuizQuestion, 
            as: 'quizQuestions', 
            include: [{ model: Question, as: 'question' }],
            order: [['order', 'ASC']]
          },
          { model: QuizClass, as: 'accessibleClasses' },
          { model: QuizAttempt, as: 'attempts' }
        ]
      });

      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      res.json(quiz);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      res.status(500).json({ error: 'Failed to fetch quiz' });
    }
  },

  // Update quiz
  updateQuiz: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const quiz = await Quiz.findByPk(id);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      // Update quiz fields
      await quiz.update(updates);

      // Update accessible classes if provided
      if (updates.accessibleClasses) {
        // Remove existing class associations
        await QuizClass.destroy({ where: { quizId: id } });
        
        // Add new class associations
        const classPromises = updates.accessibleClasses.map(classId => 
          QuizClass.create({ quizId: id, classId })
        );
        await Promise.all(classPromises);
      }

      // Update questions if provided
      if (updates.questions) {
        // Remove existing question associations
        await QuizQuestion.destroy({ where: { quizId: id } });
        
        // Add new question associations
        const questionPromises = updates.questions.map((question, index) => 
          QuizQuestion.create({
            quizId: id,
            questionId: question.id,
            points: question.points || 1,
            order: index
          })
        );
        await Promise.all(questionPromises);
        
        // Calculate total points and questions
        const totalPoints = updates.questions.reduce((sum, q) => sum + (q.points || 1), 0);
        await quiz.update({ 
          totalPoints, 
          totalQuestions: updates.questions.length 
        });
      }

      const updatedQuiz = await Quiz.findByPk(id, {
        include: [
          { model: Course, as: 'course' },
          { 
            model: QuizQuestion, 
            as: 'quizQuestions', 
            include: [{ model: Question, as: 'question' }],
            order: [['order', 'ASC']]
          },
          { model: QuizClass, as: 'accessibleClasses' }
        ]
      });

      res.json(updatedQuiz);
    } catch (error) {
      console.error('Error updating quiz:', error);
      res.status(500).json({ error: 'Failed to update quiz' });
    }
  },

  // Delete quiz
  deleteQuiz: async (req, res) => {
    try {
      const { id } = req.params;

      const quiz = await Quiz.findByPk(id);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      // Delete related records
      await QuizQuestion.destroy({ where: { quizId: id } });
      await QuizClass.destroy({ where: { quizId: id } });
      await QuizAttempt.destroy({ where: { quizId: id } });
      
      // Delete quiz
      await quiz.destroy();

      res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      res.status(500).json({ error: 'Failed to delete quiz' });
    }
  },

  // Publish/Activate quiz
  publishQuiz: async (req, res) => {
    try {
      const { id } = req.params;

      const quiz = await Quiz.findByPk(id);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      if (quiz.totalQuestions === 0) {
        return res.status(400).json({ error: 'Cannot publish quiz with no questions' });
      }

      await quiz.update({ status: 'active' });

      res.json({ message: 'Quiz published successfully', quiz });
    } catch (error) {
      console.error('Error publishing quiz:', error);
      res.status(500).json({ error: 'Failed to publish quiz' });
    }
  },

  // Get quiz questions from question bank
  getQuestionBank: async (req, res) => {
    try {
      const { courseId, difficulty, type, search } = req.query;
      const where = {};
      
      if (courseId) where.courseId = courseId;
      if (difficulty && difficulty !== 'all') where.difficulty = difficulty;
      if (type && type !== 'all') where.type = type;
      if (search) where.question = { [Op.iLike]: `%${search}%` };

      const questions = await Question.findAll({
        where,
        include: [{ model: Course, as: 'course' }],
        order: [['createdAt', 'DESC']]
      });

      res.json(questions);
    } catch (error) {
      console.error('Error fetching question bank:', error);
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  },

  // Get quiz responses/attempts
  getQuizResponses: async (req, res) => {
    try {
      const { quizId } = req.params;
      const { studentId, responseId, status } = req.query;
      
      const where = { quizId };
      if (studentId) where.userId = studentId;
      if (responseId) where.id = responseId;
      if (status) where.status = status;

      const responses = await QuizAttempt.findAll({
        where,
        include: [
          { model: User, as: 'user' },
          { model: Quiz, as: 'quiz' }
        ],
        order: [['submittedAt', 'DESC']]
      });

      // Calculate statistics
      const totalResponses = await QuizAttempt.count({ where: { quizId } });
      const gradedResponses = await QuizAttempt.count({ where: { quizId, status: 'graded' } });
      const completionRate = totalResponses > 0 ? (gradedResponses / totalResponses) * 100 : 0;
      
      // Calculate average score for graded responses
      const gradedScores = await QuizAttempt.findAll({
        where: { quizId, status: 'graded' },
        attributes: ['score']
      });
      
      const avgScore = gradedScores.length > 0
        ? gradedScores.reduce((sum, attempt) => sum + attempt.score, 0) / gradedScores.length
        : 0;

      res.json({
        responses,
        statistics: {
          totalResponses,
          averageScore: parseFloat(avgScore.toFixed(1)),
          gradedResponses,
          completionRate: parseFloat(completionRate.toFixed(1))
        }
      });
    } catch (error) {
      console.error('Error fetching quiz responses:', error);
      res.status(500).json({ error: 'Failed to fetch responses' });
    }
  },

  // Start a quiz attempt
  startQuizAttempt: async (req, res) => {
    try {
      const { quizId } = req.params;
      const userId = req.user.id; // Assuming user is authenticated

      const quiz = await Quiz.findByPk(quizId);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      // Check if quiz is active
      if (quiz.status !== 'active') {
        return res.status(400).json({ error: 'Quiz is not active' });
      }

      // Check if quiz is within date range
      const now = new Date();
      if (now < quiz.startDate || now > quiz.endDate) {
        return res.status(400).json({ error: 'Quiz is not available at this time' });
      }

      // Check max attempts
      const userAttempts = await QuizAttempt.count({ where: { quizId, userId } });
      if (userAttempts >= quiz.maxAttempts) {
        return res.status(400).json({ error: 'Maximum attempts reached' });
      }

      // Create new attempt
      const attempt = await QuizAttempt.create({
        quizId,
        userId,
        attemptNumber: userAttempts + 1,
        status: 'in-progress',
        startedAt: new Date()
      });

      // Get quiz questions for the attempt
      const quizQuestions = await QuizQuestion.findAll({
        where: { quizId },
        include: [{ model: Question, as: 'question' }],
        order: quiz.shuffleQuestions ? sequelize.random() : [['order', 'ASC']]
      });

      // Prepare questions for the attempt (shuffle options if needed)
      const questionsForAttempt = quizQuestions.map(qq => {
        const question = qq.question.toJSON();
        if (quiz.shuffleOptions && question.type === 'multiple-choice') {
          // Shuffle answer options
          const options = [...question.options];
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
          }
          question.options = options;
        }
        return {
          ...question,
          points: qq.points,
          order: qq.order
        };
      });

      res.json({
        attemptId: attempt.id,
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          duration: quiz.duration,
          instructions: quiz.instructions,
          showResults: quiz.showResults,
          allowReview: quiz.allowReview
        },
        questions: questionsForAttempt,
        startedAt: attempt.startedAt
      });
    } catch (error) {
      console.error('Error starting quiz attempt:', error);
      res.status(500).json({ error: 'Failed to start quiz attempt' });
    }
  },

  // Submit quiz attempt
  submitQuizAttempt: async (req, res) => {
    try {
      const { attemptId } = req.params;
      const { responses, timeSpent } = req.body;

      const attempt = await QuizAttempt.findByPk(attemptId, {
        include: [{ model: Quiz, as: 'quiz' }]
      });

      if (!attempt) {
        return res.status(404).json({ error: 'Attempt not found' });
      }

      if (attempt.status !== 'in-progress') {
        return res.status(400).json({ error: 'Attempt already submitted' });
      }

      // Get quiz questions to calculate score
      const quizQuestions = await QuizQuestion.findAll({
        where: { quizId: attempt.quizId },
        include: [{ model: Question, as: 'question' }]
      });

      // Calculate score
      let totalScore = 0;
      let maxScore = 0;
      
      for (const qq of quizQuestions) {
        maxScore += qq.points;
        const response = responses[qq.questionId];
        
        if (response) {
          const question = qq.question;
          
          // Simple scoring logic - adjust based on your needs
          if (question.type === 'multiple-choice') {
            if (Array.isArray(response)) {
              // For multiple-answer questions
              const correctAnswers = question.correctAnswers || [];
              const isCorrect = response.length === correctAnswers.length &&
                response.every(ans => correctAnswers.includes(ans));
              if (isCorrect) totalScore += qq.points;
            } else {
              // For single-answer questions
              if (response === question.correctAnswer) {
                totalScore += qq.points;
              }
            }
          }
          // Add more question type handling here...
        }
      }

      const percentageScore = (totalScore / maxScore) * 100;
      const isPassing = percentageScore >= attempt.quiz.passingScore;

      // Update attempt
      await attempt.update({
        responses,
        score: parseFloat(percentageScore.toFixed(2)),
        status: 'submitted',
        submittedAt: new Date(),
        timeSpent: parseInt(timeSpent)
      });

      // Update quiz statistics
      await updateQuizStatistics(attempt.quizId);

      res.json({
        score: percentageScore,
        totalScore,
        maxScore,
        isPassing,
        showResults: attempt.quiz.showResults,
        allowReview: attempt.quiz.allowReview
      });
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      res.status(500).json({ error: 'Failed to submit quiz attempt' });
    }
  },

  // Get attempt results
  getAttemptResults: async (req, res) => {
    try {
      const { attemptId } = req.params;

      const attempt = await QuizAttempt.findByPk(attemptId, {
        include: [
          { model: Quiz, as: 'quiz' },
          { model: User, as: 'user' }
        ]
      });

      if (!attempt) {
        return res.status(404).json({ error: 'Attempt not found' });
      }

      if (attempt.status === 'in-progress') {
        return res.status(400).json({ error: 'Attempt not yet submitted' });
      }

      // Get quiz questions for review
      const quizQuestions = await QuizQuestion.findAll({
        where: { quizId: attempt.quizId },
        include: [{ model: Question, as: 'question' }],
        order: [['order', 'ASC']]
      });

      res.json({
        attempt,
        questions: quizQuestions.map(qq => ({
          ...qq.question.toJSON(),
          points: qq.points,
          userResponse: attempt.responses[qq.questionId]
        }))
      });
    } catch (error) {
      console.error('Error fetching attempt results:', error);
      res.status(500).json({ error: 'Failed to fetch attempt results' });
    }
  }
};

// Helper function to update quiz statistics
async function updateQuizStatistics(quizId) {
  const attempts = await QuizAttempt.findAll({ where: { quizId, status: 'submitted' } });
  const totalAttempts = attempts.length;
  
  if (totalAttempts === 0) return;

  const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const averageScore = totalScore / totalAttempts;

  const quiz = await Quiz.findByPk(quizId);
  
  // Get total students in accessible classes (simplified - adjust based on your class structure)
  const totalStudents = 100; // Replace with actual student count
  
  const participationRate = (totalAttempts / totalStudents) * 100;

  await quiz.update({
    totalAttempts,
    averageScore: parseFloat(averageScore.toFixed(1)),
    participationRate: parseFloat(participationRate.toFixed(1))
  });
}