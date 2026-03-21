const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Fee = sequelize.define("Fee", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "students",
      key: "id"
    }
  },
  feeType: {
    type: DataTypes.ENUM("tuition", "transport", "hostel", "library", "exam", "other"),
    allowNull: true,
    defaultValue: "tuition"
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM("pending", "paid", "partial", "overdue"),
    allowNull: true,
    defaultValue: "pending"
  },
  academicYear: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.ENUM("cash", "card", "bank_transfer", "online"),
    allowNull: true
  },
  transactionId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "fees",
  timestamps: true,
  underscored: true
});

module.exports = Fee;