const sequelize = require("../config/database");
const User = require("./User");
const Student = require("./Student");
const Teacher = require("./Teacher");
const Class = require("./Class");
const Subject = require("./Subject");
const Attendance = require("./Attendance");
const Exam = require("./Exam");
const Mark = require("./Mark");
const Fee = require("./Fee");
const Notification = require("./Notification");
const Timetable = require("./Timetable");

User.hasOne(Student, { foreignKey: "userId", as: "studentProfile" });
Student.belongsTo(User, { foreignKey: "userId", as: "userAccount" });

User.hasOne(Teacher, { foreignKey: "userId", as: "teacherProfile" });
Teacher.belongsTo(User, { foreignKey: "userId", as: "userAccount" });

User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "userId", as: "recipient" });

Class.hasMany(Student, { foreignKey: "classId", as: "students" });
Student.belongsTo(Class, { foreignKey: "classId", as: "class" });

Class.hasMany(Subject, { foreignKey: "classId", as: "subjects" });
Subject.belongsTo(Class, { foreignKey: "classId", as: "class" });

Teacher.hasMany(Class, { foreignKey: "classTeacherId", as: "taughtClasses" });
Class.belongsTo(Teacher, { foreignKey: "classTeacherId", as: "classTeacher" });

Class.hasMany(Exam, { foreignKey: "classId", as: "exams" });
Exam.belongsTo(Class, { foreignKey: "classId", as: "class" });

Class.hasMany(Attendance, { foreignKey: "classId", as: "attendanceRecords" });
Attendance.belongsTo(Class, { foreignKey: "classId", as: "class" });

Teacher.hasMany(Subject, { foreignKey: "teacherId", as: "subjects" });
Subject.belongsTo(Teacher, { foreignKey: "teacherId", as: "teacher" });

Teacher.hasMany(Exam, { foreignKey: "createdBy", as: "createdExams", onDelete: 'SET NULL' });
Exam.belongsTo(Teacher, { foreignKey: "createdBy", as: "creator" });

Teacher.hasMany(Mark, { foreignKey: "gradedBy", as: "gradedMarks", onDelete: 'SET NULL' });
Mark.belongsTo(Teacher, { foreignKey: "gradedBy", as: "grader" });

Teacher.hasMany(Attendance, { foreignKey: "markedBy", as: "markedAttendance", onDelete: 'SET NULL' });
Attendance.belongsTo(Teacher, { foreignKey: "markedBy", as: "marker" });

Student.hasMany(Attendance, { foreignKey: "studentId", as: "attendanceRecords" });
Attendance.belongsTo(Student, { foreignKey: "studentId", as: "student" });

Student.hasMany(Mark, { foreignKey: "studentId", as: "marks" });
Mark.belongsTo(Student, { foreignKey: "studentId", as: "student" });

Student.hasMany(Fee, { foreignKey: "studentId", as: "feeRecords" });
Fee.belongsTo(Student, { foreignKey: "studentId", as: "student" });

Subject.hasMany(Exam, { foreignKey: "subjectId", as: "exams" });
Exam.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });

Subject.hasMany(Mark, { foreignKey: "subjectId", as: "marks" });
Mark.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });

Subject.hasMany(Attendance, { foreignKey: "subjectId", as: "attendanceRecords" });
Attendance.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });

Exam.hasMany(Mark, { foreignKey: "examId", as: "marks" });
Mark.belongsTo(Exam, { foreignKey: "examId", as: "exam" });

Class.hasMany(Timetable, { foreignKey: "classId", as: "timetableEntries" });
Timetable.belongsTo(Class, { foreignKey: "classId", as: "class" });

Subject.hasMany(Timetable, { foreignKey: "subjectId", as: "timetableEntries" });
Timetable.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });

Teacher.hasMany(Timetable, { foreignKey: "teacherId", as: "timetableEntries" });
Timetable.belongsTo(Teacher, { foreignKey: "teacherId", as: "teacher" });

module.exports = { sequelize, User, Student, Teacher, Class, Subject, Attendance, Exam, Mark, Fee, Notification, Timetable };