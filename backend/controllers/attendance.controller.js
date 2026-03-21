const { Attendance, Student, User, Subject, Class } = require("../models");

const markAttendance = async (req, res) => {
  try {
    const { studentId, subjectId, date, status, remarks, classId } = req.body;
    const teacherId = req.user.id;

    const student = await Student.findByPk(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const resolvedClassId = classId != null && classId !== "" ? parseInt(classId, 10) : student.classId;
    if (!resolvedClassId) return res.status(400).json({ message: "classId is required (student has no class)" });

    const [attendance, created] = await Attendance.findOrCreate({
      where: { studentId, subjectId: subjectId || null, date },
      defaults: { status: status || "present", remarks, markedBy: teacherId, classId: resolvedClassId }
    });

    if (!created) {
      await attendance.update({ status: status || attendance.status, remarks: remarks || attendance.remarks, markedBy: teacherId });
    }

    res.json({ message: created ? "Attendance marked" : "Attendance updated", attendance });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const markBulkAttendance = async (req, res) => {
  try {
    const { attendances, date, subjectId } = req.body;
    const teacherId = req.user.id;

    const results = [];
    for (const { studentId, status, remarks } of attendances) {
      const [attendance, created] = await Attendance.findOrCreate({
        where: { studentId, subjectId: subjectId || null, date },
        defaults: { status: status || "present", remarks, markedBy: teacherId }
      });
      if (!created) await attendance.update({ status: status || attendance.status, remarks: remarks || attendance.remarks, markedBy: teacherId });
      results.push({ studentId, status: attendance.status });
    }

    res.json({ message: "Bulk attendance marked", results });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const getStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, subjectId } = req.query;

    let studentPk = parseInt(id, 10);
    if (req.user.role === "student") {
      const me = await Student.findOne({ where: { userId: req.user.id } });
      if (!me) return res.status(404).json({ message: "Student profile not found" });
      if (studentPk !== me.id) return res.status(403).json({ message: "Access denied" });
      studentPk = me.id;
    }

    const where = { studentId: studentPk };
    if (startDate && endDate) where.date = { between: [startDate, endDate] };
    if (subjectId) where.subjectId = subjectId;

    const attendance = await Attendance.findAll({
      where,
      include: [
        { model: Class, as: "class", attributes: ["id", "name", "section"] },
        { model: Subject, as: "subject", attributes: ["id", "name", "code"] },
        { model: Student, as: "student", include: [{ model: User, as: "userAccount", attributes: ["firstName", "lastName"] }] }
      ],
      order: [["date", "DESC"]]
    });

    res.json({ attendance });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const getClassAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, subjectId } = req.query;

    const students = await Student.findAll({ where: { classId: id } });
    const studentIds = students.map(s => s.id);

    const where = { studentId: studentIds };
    if (date) where.date = date;
    if (subjectId) where.subjectId = subjectId;

    const attendance = await Attendance.findAll({
      where,
      include: [
        { model: Student, as: "student", include: [{ model: User, as: "userAccount", attributes: ["firstName", "lastName", "email"] }] },
        { model: Subject, as: "subject", attributes: ["id", "name", "code"] }
      ]
    });

    res.json({ attendance, totalStudents: students.length });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

module.exports = { markAttendance, markBulkAttendance, getStudentAttendance, getClassAttendance };