const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Timetable = sequelize.define("Timetable", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  classId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "classes", key: "id" } },
  subjectId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "subjects", key: "id" } },
  teacherId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "teachers", key: "id" } },
  dayOfWeek: { type: DataTypes.ENUM("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"), allowNull: true },
  startTime: { type: DataTypes.TIME, allowNull: true },
  endTime: { type: DataTypes.TIME, allowNull: true },
  roomNumber: { type: DataTypes.STRING(20), allowNull: true },
  academicYear: { type: DataTypes.STRING(20), allowNull: true }
}, { tableName: "timetables", timestamps: true, underscored: true });

module.exports = Timetable;