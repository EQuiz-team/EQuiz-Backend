// models/Tag.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/postgress.js';

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  }
}, {
  tableName: 'tags',
  timestamps: true,
  underscored: true
});

export default Tag;