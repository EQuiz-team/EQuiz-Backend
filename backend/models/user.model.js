// models/user.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {  // Changed from username to name
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Name is required' },
      notEmpty: { msg: 'Name cannot be empty' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'Email is required' },
      notEmpty: { msg: 'Email cannot be empty' },
      isEmail: { msg: 'Please provide a valid email' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'Password is required' },
      notEmpty: { msg: 'Password cannot be empty' }
    }
  },
  role: {
    type: DataTypes.ENUM('student', 'teacher', 'admin'),
    defaultValue: 'student',
    validate: {
      isIn: {
        args: [['student', 'teacher', 'admin']],
        msg: 'Role must be either "student", "teacher", or "admin"'
      }
    }
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: true,
    validate: {
      isStudentIdRequired(value) {
        if (this.role === 'student' && !value) {
          throw new Error('studentId is required for users with the role of student');
        }
        if (this.role !== 'student' && value) {
          throw new Error('studentId should be null for users without the role of student');
        }
      }
    },
    field: 'student_id'
  },
  teacherId: {
    type: DataTypes.UUID,
    allowNull: true,
    validate: {
      isTeacherIdRequired(value) {
        if (this.role === 'teacher' && !value) {
          throw new Error('teacherId is required for users with the role of teacher');
        }
        if (this.role !== 'teacher' && value) {
          throw new Error('teacherId should be null for users without the role of teacher');
        }
      }
    },
    field: 'teacher_id'
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: true,
    validate: {
      isAdminIdRequired(value) {
        if (this.role === 'admin' && !value) {
          throw new Error('adminId is required for users with the role of admin');
        }
        if (this.role !== 'admin' && value) {
          throw new Error('adminId should be null for users without the role of admin');
        }
      }
    },
    field: 'admin_id'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

export default User;