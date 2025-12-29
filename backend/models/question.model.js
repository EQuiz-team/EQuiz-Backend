// models/question.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  options: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: false
  },
  courseId: {
    type: DataTypes.INTEGER,
    ref: 'Courses',
    key: 'id',
    field: 'course_id',
    allowNull: false
  },
  teacherId: {
    type: DataTypes.INTEGER,
    ref: 'Users',
    key: 'id',
    field: 'teacher_id',
    allowNull: false
  },
  testId: {
    type: DataTypes.INTEGER,
    ref: 'Tests',
    key: 'id',
    field: 'test_id',
    allowNull: false
  },
  correctAnswer: {
    type: DataTypes.STRING,
    allowNull: function() {
      return this.questionType !== 'multichoice';
    },
    field: 'correct_answer' // Maps to snake_case column
  },
  questionType: {
    type: DataTypes.ENUM('single_choice', 'multichoice', 'open_ended'),
    defaultValue: 'single_choice',
    field: 'question_type'
  }
  
}, {
  tableName: 'questions',
  timestamps: true
});

export default Question;