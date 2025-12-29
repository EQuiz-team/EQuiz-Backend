import {DataTypes} from 'sequelize';
import {sequelize} from '../database/postgress.js';

const Course = sequelize.define('Course', {
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
    allowNull: true
  },
  sessions: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 1
  },
  class: {
    type: DataTypes.STRING,
    allowNull: false
  },
  level: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: { msg: 'Start date must be a valid date' },
      custom: {
        validator: (value) => {
          if (value < new Date()) {
            throw new Error('Start date must be in the future');
          }
          return true;
        }
      }
    },
    endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: { msg: 'End date must be a valid date' },
      custom: {
        validator: (value) => {
          if (value <= this.startDate) {
            throw new Error('End date must be after start date');
          }
          return true;
        }
      }
  }
}, {
  tableName: 'courses',
  timestamps: true
});

export default Course;