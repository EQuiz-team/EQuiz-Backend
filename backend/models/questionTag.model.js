// models/QuestionTag.model.js - Junction table for many-to-many relationship
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const QuestionTag = sequelize.define('QuestionTag', {
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
  tagId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tags',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'question_tags',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['question_id']
    },
    {
      fields: ['tag_id']
    },
    {
      fields: ['question_id', 'tag_id'],
      unique: true
    }
  ]
});

export default QuestionTag;