const { Notification, User, Student, Exam, Mark, Fee } = require("../models");
const { Op } = require("sequelize");
// email service temporarily disabled
// const emailService = require("../services/emailService");

const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, priority, link } = req.body;
    const notification = await Notification.create({ userId, title, message, type: type || "general", priority: priority || "medium", link, sentBy: req.user.id });
    res.status(201).json({ message: "Notification created", notification });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread } = req.query;
    const where = { userId };
    if (unread === "true") where.isRead = false;
    const notifications = await Notification.findAll({ where, order: [["createdAt", "DESC"]] });
    const unreadCount = await Notification.count({ where: { userId, isRead: false } });
    res.json({ notifications, unreadCount });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ message: "Not found" });
    if (notification.userId !== req.user.id) return res.status(403).json({ message: "Access denied" });
    await notification.update({ isRead: true, readAt: new Date() });
    res.json({ message: "Marked as read" });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true, readAt: new Date() }, { where: { userId: req.user.id, isRead: false } });
    res.json({ message: "All marked as read" });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const sendAnnouncement = async (req, res) => {
  try {
    const { title, message, roles, classId } = req.body;
    let users = [];
    if (roles && roles.length > 0) {
      users = await User.findAll({ where: { role: { [Op.in]: roles } } });
    } else {
      users = await User.findAll();
    }
    const notifications = await Promise.all(users.map(u => Notification.create({ userId: u.id, title, message, type: "general", sentBy: req.user.id })));
    // const emailResults = await emailService.sendSystemAnnouncement(users, title, message);
    res.status(201).json({ message: "Announcement sent", notifications: notifications.length });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const notifyExam = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.body.examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    const students = await Student.findAll({ where: { classId: exam.classId } });
    for (const student of students) {
      await Notification.create({ userId: student.userId, title: "Exam Scheduled", message: "Exam: " + exam.title + " on " + exam.examDate, type: "exam", sentBy: req.user.id });
    }
    res.json({ message: "Exam notifications sent", count: students.length });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const notifyResults = async (req, res) => {
  try {
    const marks = await Mark.findAll({ where: { examId: req.body.examId } });
    for (const mark of marks) {
      await Notification.create({ userId: mark.studentId, title: "Result Published", message: "Your result is ready", type: "result", sentBy: req.user.id });
    }
    res.json({ message: "Result notifications sent", count: marks.length });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const sendFeeReminders = async (req, res) => {
  try {
    const fees = await Fee.findAll({ where: { status: { [Op.in]: ["pending", "partial", "overdue"] } } });
    let sent = 0;
    for (const fee of fees) {
      const pendingAmount = parseFloat(fee.amount) - parseFloat(fee.paidAmount || 0);
      await Notification.create({ userId: fee.studentId, title: "Fee Reminder", message: "Pending fee: Rs. " + pendingAmount, type: "fee", sentBy: req.user.id });
      sent++;
    }
    res.json({ message: "Fee reminders sent", count: sent });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

module.exports = { createNotification, getUserNotifications, markAsRead, markAllAsRead, sendAnnouncement, notifyExam, notifyResults, sendFeeReminders };