// models/courseCode.model.js
import { DataTypes } from 'sequelize';
import { sequeliize } from '../database/postgress.js';

  const CourseCode = sequelize.define('CourseCode', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    originalCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'original_code'
    },
    subjectCode: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'subject_code'
    },
    courseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'course_number'
    },
    section: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fullCode: {
      type: DataTypes.STRING,
      field: 'full_code'
    }
  }, {
    tableName: 'course_codes',
    timestamps: true,
    underscored: true
  });

  export default CourseCode;