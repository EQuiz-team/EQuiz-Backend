import { DataTypes } from "sequelize";
import { sequelize } from "../database/postgress.js";
import User from "./user.model.js";
import Course from "./course.model.js";

const Teacher = sequelize.define('TeacherCourse', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true

    },
    teacherId: {
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
}, {
    tablename: "teachercourse"
    timestamp: true,
} )