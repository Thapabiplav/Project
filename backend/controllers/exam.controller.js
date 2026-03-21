const { Exam, Student, User, Subject, Class, Mark } = require("../models");

// Helper function to calculate grade
const calculateGrade = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  return "F";
};

// Create exam
const createExam = async (req, res) => {
  try {
    const { title, classId, subjectId, examDate, startTime, endTime, totalMarks, passingMarks, examType, instructions } = req.body;
    
    console.log('[DEBUG] createExam called with:', { title, classId, subjectId, examDate, totalMarks, passingMarks, examType });
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    
    const exam = await Exam.create({
      title, 
      classId: classId || null, 
      subjectId: subjectId || null, 
      examDate, 
      startTime, 
      endTime, 
      totalMarks: totalMarks ? parseInt(totalMarks) : null, 
      passingMarks: passingMarks || (totalMarks ? parseInt(totalMarks) * 0.4 : null),
      examType: examType || "written", 
      instructions
    });

    console.log('[DEBUG] Exam created successfully, ID:', exam.id);
    console.log('[DEBUG] Exam toJSON:', exam.toJSON ? exam.toJSON() : exam);
    
    // Convert Sequelize instance to plain JSON object to avoid serialization issues
    const examJson = exam.toJSON ? exam.toJSON() : JSON.parse(JSON.stringify(exam));
    
    console.log('[DEBUG] Sending response with examJson');
    return res.status(201).json({ message: "Exam created", exam: examJson });
  } catch (e) { 
    console.error('[ERROR] Error creating exam:', e);
    console.error('[ERROR] Stack:', e.stack);
    return res.status(500).json({ message: "Error creating exam", error: e.message }); 
  }
};

// Get all exams
const getAllExams = async (req, res) => {
  try {
    const { classId, subjectId } = req.query;
    const where = {};
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;

    const exams = await Exam.findAll({
      where,
      include: [
        { model: Class, as: "class", attributes: ["id", "name", "section"] },
        { model: Subject, as: "subject", attributes: ["id", "name", "code"] }
      ],
      order: [["examDate", "DESC"]]
    });
    res.json({ exams });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

// Get exam by ID
const getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id, {
      include: [
        { model: Class, as: "class" },
        { model: Subject, as: "subject" }
      ]
    });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json({ exam });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

// Enter marks for students
const enterMarks = async (req, res) => {
  try {
    const { examId } = req.params;
    const { marks } = req.body;
    const teacherId = req.user.id;

    const exam = await Exam.findByPk(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const results = [];
    for (const { studentId, marksObtained, remarks } of marks) {
      const percentage = (marksObtained / exam.totalMarks) * 100;
      const grade = calculateGrade(percentage);

      const [mark, created] = await Mark.findOrCreate({
        where: { studentId, examId },
        defaults: { subjectId: exam.subjectId, marksObtained, totalMarks: exam.totalMarks, percentage, grade, remarks, gradedBy: teacherId }
      });

      if (!created) {
        await mark.update({ marksObtained, percentage, grade, remarks, gradedBy: teacherId });
      }
      results.push({ studentId, marksObtained, percentage: percentage.toFixed(2), grade });
    }

    res.json({ message: "Marks entered", results });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

// Get student results
const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { examId, classId } = req.query;

    if (req.user.role === "student") {
      const me = await Student.findOne({ where: { userId: req.user.id } });
      if (!me) return res.status(404).json({ message: "Student profile not found" });
      if (parseInt(studentId, 10) !== me.id) return res.status(403).json({ message: "Access denied" });
    }

    const where = { studentId };
    if (examId) where.examId = examId;

    const marks = await Mark.findAll({
      where,
      include: [
        {
          model: Exam,
          as: "exam",
          ...(classId ? { where: { classId } } : {}),
          include: [{ model: Subject, as: "subject", attributes: ["id", "name", "code"] }]
        },
        { model: Student, as: "student", include: [{ model: User, as: "userAccount", attributes: ["firstName", "lastName"] }] }
      ]
    });

    // Calculate totals
    const totalMarks = marks.reduce((sum, m) => sum + parseFloat(m.marksObtained), 0);
    const totalMaxMarks = marks.reduce((sum, m) => sum + parseFloat(m.totalMarks), 0);
    const average = marks.length > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;

    res.json({ marks, totalMarks: totalMarks.toFixed(2), totalMaxMarks: totalMaxMarks.toFixed(2), average: average.toFixed(2), overallGrade: calculateGrade(average) });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

// Get exam results
const getExamResults = async (req, res) => {
  try {
    const { id } = req.params;

    const marks = await Mark.findAll({
      where: { examId: id },
      include: [
        { model: Student, as: "student", include: [{ model: User, as: "userAccount", attributes: ["firstName", "lastName", "email"] }] }
      ]
    });

    const totalMarks = marks.reduce((sum, m) => sum + parseFloat(m.marksObtained), 0);
    const average = marks.length > 0 ? totalMarks / marks.length : 0;
    const passCount = marks.filter(m => m.percentage >= 40).length;

    res.json({ marks, totalStudents: marks.length, average: average.toFixed(2), passCount, failCount: marks.length - passCount });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

module.exports = { createExam, getAllExams, getExamById, enterMarks, getStudentResults, getExamResults };