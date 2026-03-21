const { Timetable, Class, Subject, Teacher, User } = require("../models");
const Sequelize = require("sequelize");

const createTimetable = async (req, res) => {
  try {
    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, academicYear } = req.body;
    console.log('[DEBUG] createTimetable called with:', { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, academicYear });
    
    const existing = await Timetable.findOne({ where: { classId, dayOfWeek, startTime, room } });
    if (existing) return res.status(400).json({ message: "Schedule conflict" });
    
    const timetable = await Timetable.create({ classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, academicYear });
    console.log('[DEBUG] Timetable created successfully, ID:', timetable.id);
    
    const timetableJson = timetable.toJSON ? timetable.toJSON() : JSON.parse(JSON.stringify(timetable));
    return res.status(201).json({ message: "Timetable created", timetable: timetableJson });
  } catch (e) { 
    console.error('[ERROR] Error creating timetable:', e);
    return res.status(500).json({ message: "Error", error: e.message }); 
  }
};

const getAllTimetables = async (req, res) => {
  try {
    const { classId, dayOfWeek } = req.query;
    const where = {};
    if (classId) where.classId = classId;
    if (dayOfWeek) where.dayOfWeek = dayOfWeek;
    const timetables = await Timetable.findAll({
      where,
      include: [
        { model: Class, as: "class", attributes: ["id", "name", "section"] },
        { model: Subject, as: "subject", attributes: ["id", "name", "code"] },
        { model: Teacher, as: "teacher", include: [{ model: User, as: "userAccount", attributes: ["firstName", "lastName"] }] }
      ],
      order: [["dayOfWeek", "ASC"], ["startTime", "ASC"]]
    });
    res.json({ timetables });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const getTimetableById = async (req, res) => {
  try {
    const timetable = await Timetable.findByPk(req.params.id, {
      include: [
        { model: Class, as: "class" },
        { model: Subject, as: "subject" },
        { model: Teacher, as: "teacher", include: [{ model: User, as: "userAccount" }] }
      ]
    });
    if (!timetable) return res.status(404).json({ message: "Timetable not found" });
    res.json({ timetable });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const updateTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByPk(req.params.id);
    if (!timetable) return res.status(404).json({ message: "Timetable not found" });
    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, academicYear, isActive } = req.body;
    await timetable.update({ classId: classId || timetable.classId, subjectId: subjectId || timetable.subjectId, teacherId: teacherId || timetable.teacherId, dayOfWeek: dayOfWeek || timetable.dayOfWeek, startTime: startTime || timetable.startTime, endTime: endTime || timetable.endTime, room: room || timetable.room, academicYear: academicYear || timetable.academicYear, isActive: isActive !== undefined ? isActive : timetable.isActive });
    res.json({ message: "Timetable updated", timetable });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByPk(req.params.id);
    if (!timetable) return res.status(404).json({ message: "Timetable not found" });
    await timetable.destroy();
    res.json({ message: "Timetable deleted" });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const getClassTimetable = async (req, res) => {
  try {
    const { classId, dayOfWeek } = req.params;
    const where = { classId };
    if (dayOfWeek) where.dayOfWeek = dayOfWeek;
    const timetable = await Timetable.findAll({
      where,
      include: [
        { model: Class, as: "class", attributes: ["name", "section"] },
        { model: Subject, as: "subject", attributes: ["name", "code"] },
        { model: Teacher, as: "teacher", include: [{ model: User, as: "userAccount", attributes: ["firstName", "lastName"] }] }
      ],
      order: [["startTime", "ASC"]]
    });
    res.json({ timetable });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

const getTeacherTimetable = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ where: { userId: req.user.id } });
    if (!teacher) return res.status(404).json({ message: "Teacher profile not found" });
    const timetable = await Timetable.findAll({
      where: { teacherId: teacher.id },
      include: [
        { model: Class, as: "class", attributes: ["name", "section"] },
        { model: Subject, as: "subject", attributes: ["name", "code"] }
      ],
      order: [["dayOfWeek", "ASC"], ["startTime", "ASC"]]
    });
    res.json({ timetable });
  } catch (e) { res.status(500).json({ message: "Error", error: e.message }); }
};

module.exports = { createTimetable, getAllTimetables, getTimetableById, updateTimetable, deleteTimetable, getClassTimetable, getTeacherTimetable };