const { Teacher, User, Subject, Class } = require("../models");
const bcrypt = require("bcrypt");

const getAllTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const { count, rows: teachers } = await Teacher.findAndCountAll({
      include: [
        { model: User, as: "userAccount", attributes: ["id", "email", "firstName", "lastName", "phone", "address", "isActive"] },
        { model: Subject, as: "subjects", attributes: ["id", "name", "code"] },
        { model: Class, as: "taughtClasses", attributes: ["id", "name", "section"] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]]
    });
    res.json({ teachers, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count/limit) } });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, {
      include: [
        { model: User, as: "userAccount", attributes: { exclude: ["password"] } },
        { model: Subject, as: "subjects" },
        { model: Class, as: "taughtClasses" }
      ]
    });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json({ teacher });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const createTeacher = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, address, dateOfBirth, gender, bloodGroup, qualification, experience, specialization, department, joiningDate, salary } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });
    const employeeId = "EMP-" + Date.now();
    const hashedPassword = await bcrypt.hash(password || "teacher123", 12);
    const user = await User.create({ email, password: hashedPassword, firstName, lastName, phone, address, role: "teacher", isActive: true });
    const teacher = await Teacher.create({ userId: user.id, employeeId, dateOfBirth, gender, bloodGroup, qualification, experience, specialization, department, joiningDate: joiningDate || new Date(), salary });
    res.status(201).json({ message: "Teacher created", teacher: { ...teacher.toJSON(), user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } } });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, { include: [{ model: User, as: "userAccount" }] });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    const { firstName, lastName, email, phone, address, dateOfBirth, gender, bloodGroup, qualification, experience, specialization, department, joiningDate, salary, isActive } = req.body;
    if (teacher.userAccount) await teacher.userAccount.update({ firstName: firstName || teacher.userAccount.firstName, lastName: lastName || teacher.userAccount.lastName, email: email || teacher.userAccount.email, phone: phone || teacher.userAccount.phone, address: address || teacher.userAccount.address, isActive: isActive !== undefined ? isActive : teacher.userAccount.isActive });
    await teacher.update({ dateOfBirth: dateOfBirth || teacher.dateOfBirth, gender: gender || teacher.gender, bloodGroup: bloodGroup || teacher.bloodGroup, qualification: qualification || teacher.qualification, experience: experience || teacher.experience, specialization: specialization || teacher.specialization, department: department || teacher.department, joiningDate: joiningDate || teacher.joiningDate, salary: salary || teacher.salary });
    res.json({ message: "Teacher updated", teacher });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, { include: [{ model: User, as: "userAccount" }] });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    if (teacher.userAccount) await teacher.userAccount.destroy();
    else await teacher.destroy();
    res.json({ message: "Teacher deleted" });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const assignSubjects = async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    await teacher.setSubjects(req.body.subjectIds);
    const t = await Teacher.findByPk(req.params.id, { include: [{ model: Subject, as: "subjects" }] });
    res.json({ message: "Subjects assigned", subjects: t.subjects });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const assignClass = async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    await Class.update({ classTeacherId: req.params.id }, { where: { id: req.body.classId } });
    const c = await Class.findByPk(req.body.classId);
    res.json({ message: "Class assigned", class: c });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

module.exports = { getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher, assignSubjects, assignClass };