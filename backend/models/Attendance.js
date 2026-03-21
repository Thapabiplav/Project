const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Attendance = sequelize.define("Attendance", {
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
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM("present", "absent", "late", "excused"),
    allowNull: false,
    defaultValue: "present"
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  markedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "teachers",
      key: "id"
    }
  }
}, {
  tableName: "attendance",
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ["student_id", "date", "subject_id"]
    }
  ]
});

module.exports = Attendance;