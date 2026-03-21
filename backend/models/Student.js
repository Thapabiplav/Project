const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

const Student = sequelize.define("Student", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: "users",
      key: "id"
    }
  },
  studentId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM("male", "female", "other"),
    allowNull: true
  },
  bloodGroup: {
    type: DataTypes.ENUM("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"),
    allowNull: true
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "classes",
      key: "id"
    }
  },
  section: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  rollNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  admissionDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  guardianName: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  guardianPhone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  guardianRelation: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: "students",
  timestamps: true,
  underscored: true
});

User.hasOne(Student, { foreignKey: "userId", as: "student" });
Student.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = Student;