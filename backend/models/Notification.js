const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define("Notification", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "users",
      key: "id"
    },
    comment: "Recipient user ID"
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM("general", "attendance", "exam", "fee", "result", "assignment"),
    allowNull: true,
    defaultValue: "general"
  },
  priority: {
    type: DataTypes.ENUM("low", "medium", "high"),
    allowNull: true,
    defaultValue: "medium"
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  link: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: "Optional link to related resource"
  },
  sentBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "users",
      key: "id"
    }
  }
}, {
  tableName: "notifications",
  timestamps: true,
  underscored: true
});

module.exports = Notification;