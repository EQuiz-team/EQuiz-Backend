import { DataTypes } from "sequelize";
import { sequelize } from "../database/postgress.js";
import User from "./user.model.js";
import Course from "./course.model.js";

const Student = sequelize.define('studentCourse', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true

    },
    studentId: {
        type: DataTypes.STRING,
        ref: User.teacher_id,
        allownull: true,
        field: teacher_id
    },
    courseId: {
        type: DataTypes.STRING,
        ref: Course.code,
        allownull: false,
        field: course_id
    }
    level: {
        type: DataTypes.STRING,
        allownull: false,
        validate: {
            User.level === Course.level
        }
    }
}, {
    tablename: "studentcourse"
    timestamp: true,
} )