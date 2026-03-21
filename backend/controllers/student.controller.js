const { Student, User, Class } = require("../models");
const bcrypt = require("bcrypt");

const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, classId, search } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (classId) where.classId = classId;
    const { count, rows: students } = await Student.findAndCountAll({
      where,
      include: [
        { model: User, as: "userAccount", attributes: ["id", "email", "firstName", "lastName", "phone", "address", "isActive"] },
        { model: Class, as: "class", attributes: ["id", "name", "section"] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]]
    });
    res.json({ students, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count/limit) } });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const getStudentById = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [
        { model: User, as: "userAccount", attributes: { exclude: ["password"] } },
        { model: Class, as: "class" }
      ]
    });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ student });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const createStudent = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, address, dateOfBirth, gender, bloodGroup, classId, section, rollNumber, admissionDate, guardianName, guardianPhone, guardianRelation } = req.body;
    
    // Validate required fields
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ message: "Email, firstName, and lastName are required" });
    }
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });
    
    // Use provided studentId or auto-generate one
    const studentIdInput = req.body.studentId ? parseInt(req.body.studentId) : null;
    let finalStudentId;
    
    if (studentIdInput && !isNaN(studentIdInput)) {
      // Check if studentId already exists
      const existingStudentId = await Student.findOne({ where: { studentId: studentIdInput.toString() } });
      if (existingStudentId) {
        return res.status(400).json({ message: "Student ID already exists" });
      }
      finalStudentId = studentIdInput.toString();
    } else {
      finalStudentId = "STU-" + Date.now();
    }
    
    const hashedPassword = await bcrypt.hash(password || "student123", 12);
    
    // Create user first
    const user = await User.create({ email, password: hashedPassword, firstName, lastName, phone, address, role: "student", isActive: true });
    
    // Then create student record
    const student = await Student.create({ 
      userId: user.id, 
      studentId: finalStudentId, 
      dateOfBirth, 
      gender, 
      bloodGroup, 
      classId: classId || null, 
      section, 
      rollNumber, 
      admissionDate: admissionDate || new Date(), 
      guardianName, 
      guardianPhone, 
      guardianRelation 
    });
    
    res.status(201).json({ message: "Student created", student: { ...student.toJSON(), user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } } });
  } catch (e) { 
    console.error("Error creating student:", e);
    res.status(500).json({ message: "Error creating student", error: e.message }); 
  }
};

const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, { include: [{ model: User, as: "userAccount" }] });
    if (!student) return res.status(404).json({ message: "Student not found" });
    const { firstName, lastName, email, phone, address, dateOfBirth, gender, bloodGroup, classId, section, rollNumber, guardianName, guardianPhone, guardianRelation, isActive } = req.body;
    if (student.userAccount) await student.userAccount.update({ firstName: firstName || student.userAccount.firstName, lastName: lastName || student.userAccount.lastName, email: email || student.userAccount.email, phone: phone || student.userAccount.phone, address: address || student.userAccount.address, isActive: isActive !== undefined ? isActive : student.userAccount.isActive });
    await student.update({ dateOfBirth: dateOfBirth || student.dateOfBirth, gender: gender || student.gender, bloodGroup: bloodGroup || student.bloodGroup, classId: classId || student.classId, section: section || student.section, rollNumber: rollNumber || student.rollNumber, guardianName: guardianName || student.guardianName, guardianPhone: guardianPhone || student.guardianPhone, guardianRelation: guardianRelation || student.guardianRelation });
    res.json({ message: "Student updated", student });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, { include: [{ model: User, as: "userAccount" }] });
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (student.userAccount) await student.userAccount.destroy();
    else await student.destroy();
    res.json({ message: "Student deleted" });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

module.exports = { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent };