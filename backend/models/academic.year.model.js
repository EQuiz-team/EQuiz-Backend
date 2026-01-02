import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const AcademicYear = sequelize.define('AcademicYear', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    year: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'academic_year',
    timestamps: true
});

export default AcademicYear;