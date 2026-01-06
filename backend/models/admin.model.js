// models/admin.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../database/postgress.js";

const Admin = sequelize.define('Admin', {
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
    employeeId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'employee_id'
    },
    department: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('super-admin', 'department-admin', 'academic-admin', 'support'),
        defaultValue: 'support'
    },
    permissions: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    assignedResponsibilities: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'assigned_responsibilities'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
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
    tableName: 'admins',
    timestamps: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['employee_id']
        },
        {
            fields: ['department']
        },
        {
            fields: ['role']
        },
        {
            fields: ['status']
        }
    ]
});

export default Admin;