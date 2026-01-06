// models/classStudent.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const ClassStudent = sequelize.define('ClassStudent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  classId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'class_id',
    references: {
      model: 'classes',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  enrollmentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'enrollment_date'
  },
  enrollmentStatus: {
    type: DataTypes.ENUM('enrolled', 'dropped', 'completed', 'failed'),
    defaultValue: 'enrolled',
    field: 'enrollment_status'
  },
  grade: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  attendance: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  performance: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  tableName: 'class_students',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['class_id', 'student_id']
    },
    {
      fields: ['student_id', 'enrollment_status']
    }
  ]
});

export default ClassStudent;