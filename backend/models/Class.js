const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Class = sequelize.define("Class", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: "Class name (e.g., Grade 1, Class 10)"
  },
  section: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: "Section (e.g., A, B, C)"
  },
  roomNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 40
  },
  academicYear: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: "e.g., 2024-2025"
  },
  classTeacherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "teachers",
      key: "id"
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: "classes",
  timestamps: true,
  underscored: true
});

module.exports = Class;