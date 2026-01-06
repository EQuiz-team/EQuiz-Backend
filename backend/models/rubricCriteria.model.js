// models/RubricCriteria.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const RubricCriteria = sequelize.define('RubricCriteria', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  questionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'questions',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  criterion: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'rubric_criteria',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['question_id']
    }
  ]
});

export default RubricCriteria;