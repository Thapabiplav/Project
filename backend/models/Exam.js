const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Exam = sequelize.define("Exam", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "classes",
      key: "id"
    }
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "subjects",
      key: "id"
    }
  },
  examDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  totalMarks: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  passingMarks: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  examType: {
    type: DataTypes.ENUM("written", "practical", "oral", "assignment"),
    allowNull: true,
    defaultValue: "written"
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: "exams",
  timestamps: true,
  underscored: true
});

module.exports = Exam;