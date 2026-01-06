// models/teacher.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../database/postgress.js";

const Teacher = sequelize.define('Teacher', {
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
    teacherId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'teacher_id'
    },
    department: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    office: {
        type: DataTypes.STRING,
        allowNull: true
    },
    officeHours: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'office_hours'
    },
    specialization: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'on-leave', 'retired', 'inactive'),
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
    tableName: 'teachers',
    timestamps: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['teacher_id']
        },
        {
            fields: ['department']
        },
        {
            fields: ['status']
        }
    ]
});

export default Teacher;