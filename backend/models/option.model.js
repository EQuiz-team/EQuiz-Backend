// models/Option.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const Option = sequelize.define('Option', {
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
  optionText: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  explanation: {
    type: DataTypes.TEXT
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'options',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['question_id']
    },
    {
      fields: ['question_id', 'is_correct']
    }
  ]
});

export default Option;