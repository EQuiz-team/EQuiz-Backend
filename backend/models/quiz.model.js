import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
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
  }
}, {
  tableName: 'quiz',
  timestamps: true
});

export default Quiz;