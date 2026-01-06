// models/quizQuestion.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const QuizQuestion = sequelize.define('QuizQuestion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    autoIncrement: true
  },
  quizId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'quiz_id',
    references: {
      model: 'quizzes',
      key: 'id'
    }
  },
  questionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'question_id',
    references: {
      model: 'questions',
      key: 'id'
    }
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  },
}, {
  tableName: 'quiz_questions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['quiz_id', 'question_id']
    },
    {
      fields: ['quiz_id', 'order']
    }
  ]
});

export default QuizQuestion;