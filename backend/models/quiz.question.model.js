import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const QuizQuestion = sequelize.define('QuizQuestion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
    quizId: {
    type: DataTypes.INTEGER,
    ref: 'Quiz',
    key: 'id',
    field: 'quiz_id',
    allowNull: false
  },
    questionId: {
    type: DataTypes.INTEGER,
    ref: 'Question',
    key: 'id',
    field: 'question_id',
    allowNull: false
  }
}, {
  tableName: 'quiz_questions',
  timestamps: true
});

export default QuizQuestion;