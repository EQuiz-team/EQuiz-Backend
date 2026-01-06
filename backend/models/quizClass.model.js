// models/quizClass.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const QuizClass = sequelize.define('QuizClass', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  classId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'class_id',
    references: {
      model: 'classes', // Assuming you have a Class model
      key: 'id'
    }
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
  tableName: 'quiz_classes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['quiz_id', 'class_id']
    }
  ]
});

export default QuizClass;