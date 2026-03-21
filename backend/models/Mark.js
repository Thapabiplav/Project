const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Mark = sequelize.define("Mark", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "students",
      key: "id"
    }
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "exams",
      key: "id"
    }
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "subjects",
      key: "id"
    }
  },
  marksObtained: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  totalMarks: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  grade: {
    type: DataTypes.STRING(5),
    allowNull: true,
    comment: "Grade (A, B, C, D, E, F)"
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gradedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "teachers",
      key: "id"
    }
  }
}, {
  tableName: "marks",
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ["student_id", "exam_id"]
    }
  ]
});

module.exports = Mark;