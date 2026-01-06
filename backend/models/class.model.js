// models/class.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  classCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'class_code'
  },
  name: {
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
  group: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  academicYear: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'academic_year'
  },
  semester: {
    type: DataTypes.ENUM('fall', 'spring', 'summer'),
    allowNull: false,
  },
  maxStudents: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    field: 'max_students'
  },
  currentStudents: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_students'
  },
  schedule: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  teacherId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'teacher_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'completed', 'cancelled'),
    defaultValue: 'active',
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
  tableName: 'classes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['class_code']
    },
    {
      fields: ['course_id']
    },
    {
      fields: ['teacher_id']
    },
    {
      fields: ['academic_year', 'semester']
    },
    {
      fields: ['status']
    }
  ]
});

export default Class;