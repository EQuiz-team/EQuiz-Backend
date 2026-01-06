// models/index.js or similar association setup
import Quiz from './quiz.model.js';
import QuizQuestion from './quizQuestion.model.js';
import QuizClass from './quizClass.model.js';
import QuizAttempt from './quizAttempt.model.js';
import Course from './course.model.js';
import Question from './question.model.js';
import User from './user.model.js';
// Import Class model if you have it

// Quiz associations
Quiz.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Quiz.hasMany(QuizQuestion, { foreignKey: 'quizId', as: 'quizQuestions' });
Quiz.hasMany(QuizClass, { foreignKey: 'quizId', as: 'accessibleClasses' });
Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId', as: 'attempts' });

// QuizQuestion associations
QuizQuestion.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });
QuizQuestion.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

// QuizClass associations
QuizClass.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });
// QuizClass.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// QuizAttempt associations
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });
QuizAttempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
  Quiz,
  QuizQuestion,
  QuizClass,
  QuizAttempt
};