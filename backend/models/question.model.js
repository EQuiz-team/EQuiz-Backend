// models/Question.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Basic question info
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  
  // Question type configuration
  questionType: {
    type: DataTypes.ENUM('multiple-choice', 'true-false', 'short-answer', 'essay'),
    allowNull: false,
    defaultValue: 'multiple-choice'
  },
  
  // Multiple choice specific
  multipleCorrect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // True/False specific
  correctBoolean: {
    type: DataTypes.BOOLEAN
  },
  
  // Short answer specific
  correctAnswer: {
    type: DataTypes.TEXT
  },
  sampleAnswer: {
    type: DataTypes.TEXT
  },
  
  // Essay specific
  maxLength: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  
  // Course and difficulty
  course: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'code'
    },
    validate: {
      notEmpty: true
    }
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    allowNull: false,
    defaultValue: 'medium'
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      min: 0
    }
  },
  
  // Additional information
  topic: {
    type: DataTypes.STRING
  },
  explanation: {
    type: DataTypes.TEXT
  },
  
  // Template functionality
  isTemplate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  templateName: {
    type: DataTypes.STRING
  },
  templateDescription: {
    type: DataTypes.TEXT
  },
  
  // Metadata
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'questions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['course', 'question_type']
    },
    {
      fields: ['difficulty']
    },
    {
      fields: ['is_template']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['is_active']
    }
  ]
});

export default Question;