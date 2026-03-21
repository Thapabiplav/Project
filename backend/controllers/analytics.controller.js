const Sequelize = require("sequelize");
const { User, Student, Teacher, Class, Subject, Attendance, Exam, Mark, Fee, Notification } = require("../models");
const { Op } = require("sequelize");

const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalTeachers = await Teacher.count();
    const totalClasses = await Class.count();
    const totalSubjects = await Subject.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.count({ where: { date: today } });
    
    // Calculate pending fees as amount - paidAmount
    const fees = await Fee.findAll({ attributes: ['amount', 'paidAmount'] });
    const pendingFees = fees.reduce((sum, f) => sum + (parseFloat(f.amount) - parseFloat(f.paidAmount || 0)), 0);
    
    const recentNotifications = await Notification.findAll({ limit: 5, order: [["createdAt", "DESC"]] });
    res.json({ stats: { totalStudents, totalTeachers, totalClasses, totalSubjects, activeUsers, todayAttendance, pendingFees }, recentNotifications });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const getStudentAnalytics = async (req, res) => {
  try {
    const { classId, subjectId } = req.query;
    const where = {};
    if (classId) where.classId = classId;
    const students = await Student.findAll({ where, include: [{ model: User, as: "userAccount", attributes: ["firstName", "lastName"] }, { model: Class, as: "class" }] });
    const studentIds = students.map(s => s.id);
    const marks = await Mark.findAll({ where: { studentId: { [Op.in]: studentIds }, ...(subjectId && { subjectId }) } });
    const avgMarks = marks.reduce((acc, m) => acc + m.marks, 0) / (marks.length || 1);
    const passCount = marks.filter(m => m.marks >= 40).length;
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    marks.forEach(m => { if (m.marks >= 90) gradeDistribution.A++; else if (m.marks >= 75) gradeDistribution.B++; else if (m.marks >= 60) gradeDistribution.C++; else if (m.marks >= 40) gradeDistribution.D++; else gradeDistribution.F++; });
    res.json({ students: students.length, avgMarks: avgMarks.toFixed(2), passRate: ((passCount / (marks.length || 1)) * 100).toFixed(2), gradeDistribution });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const getAttendanceAnalytics = async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const where = {};
    if (classId) where.classId = classId;
    if (startDate && endDate) where.date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    const attendance = await Attendance.findAll({ where });
    const total = attendance.length;
    const present = attendance.filter(a => a.status === "present").length;
    const absent = attendance.filter(a => a.status === "absent").length;
    const late = attendance.filter(a => a.status === "late").length;
    const dailyStats = attendance.reduce((acc, a) => { const d = a.date.toISOString().split("T")[0]; if (!acc[d]) acc[d] = { present: 0, absent: 0, late: 0 }; acc[d][a.status]++; return acc; }, {});
    res.json({ total, present, absent, late, attendanceRate: ((present / (total || 1)) * 100).toFixed(2), dailyStats });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const getFeeAnalytics = async (req, res) => {
  try {
    const total = await Fee.sum("amount") || 0;
    const paid = await Fee.sum("paidAmount") || 0;
    const pending = await Fee.sum("pendingAmount") || 0;
    const byStatus = await Fee.findAll({ attributes: [[Sequelize.fn("SUM", Sequelize.col("amount")), "total"], "status"], group: ["status"] });
    const byType = await Fee.findAll({ attributes: [[Sequelize.fn("SUM", Sequelize.col("amount")), "total"], "feeType"], group: ["feeType"] });
    const collectionRate = ((paid / total) * 100).toFixed(2);
    res.json({ total, paid, pending, collectionRate, byStatus, byType });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const getExamAnalytics = async (req, res) => {
  try {
    const { examId, classId, subjectId } = req.query;
    const where = {};
    if (examId) where.examId = examId;
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    const marks = await Mark.findAll({ where, include: [{ model: Exam, as: "exam", attributes: ["title", "examDate"] }] });
    const avgMarks = marks.reduce((acc, m) => acc + m.marks, 0) / (marks.length || 1);
    const highest = Math.max(...marks.map(m => m.marks), 0);
    const lowest = Math.min(...marks.map(m => m.marks), 0);
    const passCount = marks.filter(m => m.marks >= 40).length;
    const gradeDist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    marks.forEach(m => { if (m.marks >= 90) gradeDist.A++; else if (m.marks >= 75) gradeDist.B++; else if (m.marks >= 60) gradeDist.C++; else if (m.marks >= 40) gradeDist.D++; else gradeDist.F++; });
    res.json({ total: marks.length, avgMarks: avgMarks.toFixed(2), highest, lowest, passRate: ((passCount / (marks.length || 1)) * 100).toFixed(2), gradeDistribution: gradeDist });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const getTeacherPerformance = async (req, res) => {
  try {
    const teachers = await Teacher.findAll({ include: [{ model: User, as: "userAccount", attributes: ["firstName", "lastName"] }, { model: Subject, as: "subjects", attributes: ["name"] }] });
    const teacherData = await Promise.all(teachers.map(async t => {
      const subjects = await Subject.findAll({ where: { teacherId: t.id } });
      const marks = await Mark.findAll({ where: { subjectId: { [Op.in]: subjects.map(s => s.id) } } });
      const avgMarks = marks.length > 0 ? marks.reduce((acc, m) => acc + m.marks, 0) / marks.length : 0;
      return { id: t.id, name: t.userAccount ? (t.userAccount.firstName + " " + t.userAccount.lastName) : "N/A", subjects: subjects.length, avgMarks: avgMarks.toFixed(2) };
    }));
    res.json({ teachers: teacherData });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

module.exports = { getDashboardStats, getStudentAnalytics, getAttendanceAnalytics, getFeeAnalytics, getExamAnalytics, getTeacherPerformance };