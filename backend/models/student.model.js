// models/student.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../database/postgress.js";

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    studentId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'student_id'
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true
    },
    enrollmentYear: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'enrollment_year'
    },
    gpa: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0,
        validate: {
            min: 0,
            max: 4.0
        }
    },
    creditsCompleted: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'credits_completed'
    },
    status: {
        type: DataTypes.ENUM('active', 'graduated', 'suspended', 'withdrawn'),
        defaultValue: 'active'
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
    }
}, {
    tableName: 'students',
    timestamps: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['student_id']
        },
        {
            fields: ['department']
        },
        {
            fields: ['status']
        }
    ]
});

export default Student;