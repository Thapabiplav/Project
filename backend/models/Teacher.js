const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

const Teacher = sequelize.define("Teacher", {
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
  employeeId: {
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
  qualification: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Years of experience"
  },
  specialization: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  joiningDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  tableName: "teachers",
  timestamps: true,
  underscored: true
});

User.hasOne(Teacher, { foreignKey: "userId", as: "teacher" });
Teacher.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = Teacher;