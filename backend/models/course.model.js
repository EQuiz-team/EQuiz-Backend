// models/course.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    courseName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'course_name',
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Engineering', 'Business', 'Other']]
      }
    },
    classes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    students: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    quizzes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE'
    },
    semester: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: true
      }
    }
  }, {
    tableName: 'courses',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'courses_search_idx',
        fields: ['code', 'course_name', 'department']
      },
      {
        name: 'courses_status_idx',
        fields: ['status']
      },
      {
        name: 'courses_department_idx',
        fields: ['department']
      }
    ],
    hooks: {
      beforeSave: (course) => {
        if (course.code) {
          course.code = course.code.toUpperCase().trim();
        }
        if (course.courseName) {
          course.courseName = course.courseName.trim();
        }
        if (course.department) {
          course.department = course.department.trim();
        }
      }
    }
  });

  // Instance methods
  Course.prototype.toggleStatus = async function() {
    this.status = this.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.save();
  };

  Course.prototype.hasStudents = function() {
    return this.students > 0;
  };

  Course.prototype.hasQuizzes = function() {
    return this.quizzes > 0;
  };

  // Class methods
  Course.getActiveCourses = function() {
    return this.findAll({
      where: { status: 'ACTIVE' },
      order: [['course_name', 'ASC']]
    });
  };

  Course.getCoursesByDepartment = function(department) {
    return this.findAll({
      where: { 
        department: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('department')),
          'LIKE',
          `%${department.toLowerCase()}%`
        )
      },
      order: [['course_name', 'ASC']]
    });
  };

  Course.searchCourses = function(searchTerm) {
    return this.findAll({
      where: {
        [sequelize.Op.or]: [
          { code: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
          { courseName: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
          { department: { [sequelize.Op.iLike]: `%${searchTerm}%` } }
        ]
      },
      order: [['course_name', 'ASC']]
    });
  };

  // For dashboard statistics
  Course.getCourseStatistics = function() {
    return this.findAll({
      attributes: [
        'department',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_courses'],
        [sequelize.fn('SUM', sequelize.col('classes')), 'total_classes'],
        [sequelize.fn('SUM', sequelize.col('students')), 'total_students'],
        [sequelize.fn('SUM', sequelize.col('quizzes')), 'total_quizzes'],
        [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN status = 'ACTIVE' THEN 1 END`)), 'active_courses']
      ],
      group: ['department'],
      raw: true
    });
  };

  export default Course;