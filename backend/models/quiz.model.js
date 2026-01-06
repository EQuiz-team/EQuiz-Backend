// models/quiz.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  quizCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'quiz_code'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'course_id',
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  evaluationType: {
    type: DataTypes.ENUM('practice', 'mid-term', 'final', 'assignment', 'draft'),
    defaultValue: 'practice',
    field: 'evaluation_type'
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'scheduled', 'completed', 'archived'),
    defaultValue: 'draft',
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_date'
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: false,
  },
  maxAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'max_attempts'
  },
  passingScore: {
    type: DataTypes.FLOAT,
    defaultValue: 50.0,
    field: 'passing_score'
  },
  showResults: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'show_results'
  },
  shuffleQuestions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'shuffle_questions'
  },
  shuffleOptions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'shuffle_options'
  },
  allowReview: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'allow_review'
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_points'
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_questions'
  },
  totalAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_attempts'
  },
  participationRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
    field: 'participation_rate'
  },
  averageScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
    field: 'average_score'
  },
  completionRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
    field: 'completion_rate'
  },
  gradedResponses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'graded_responses'
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
  tableName: 'quizzes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['quiz_code']
    },
    {
      fields: ['course_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['start_date', 'end_date']
    }
  ]
});

// Quiz associations will be set up in the main model index file
export default Quiz;