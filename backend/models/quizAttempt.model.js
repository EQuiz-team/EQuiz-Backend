// models/quizAttempt.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const QuizAttempt = sequelize.define('QuizAttempt', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  attemptNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'attempt_number'
  },
  score: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  status: {
    type: DataTypes.ENUM('in-progress', 'submitted', 'graded', 'expired'),
    defaultValue: 'in-progress',
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'started_at'
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'submitted_at'
  },
  gradedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'graded_at'
  },
  timeSpent: {
    type: DataTypes.INTEGER, // in seconds
    defaultValue: 0,
    field: 'time_spent'
  },
  responses: {
    type: DataTypes.JSONB,
    defaultValue: {},
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
  tableName: 'quiz_attempts',
  timestamps: true,
  indexes: [
    {
      fields: ['quiz_id', 'user_id']
    },
    {
      fields: ['user_id', 'status']
    },
    {
      fields: ['submitted_at']
    }
  ]
});

export default QuizAttempt;