const { Class, Student, Teacher } = require("../models");

// Get all classes
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.findAll({
      include: [
        { model: Student, as: "students", attributes: ["id"] },
        { model: Teacher, as: "classTeacher", attributes: ["id"] }
      ],
      order: [["name", "ASC"]]
    });
    res.json({ classes });
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ message: "Error fetching classes" });
  }
};

// Get single class
exports.getClass = async (req, res) => {
  try {
    const classData = await Class.findByPk(req.params.id, {
      include: [
        { model: Student, as: "students" },
        { model: Teacher, as: "classTeacher" }
      ]
    });
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json({ class: classData });
  } catch (error) {
    console.error("Error fetching class:", error);
    res.status(500).json({ message: "Error fetching class" });
  }
};

// Create class
exports.createClass = async (req, res) => {
  try {
    const { name, section, roomNumber, capacity, academicYear, classTeacherId } = req.body;
    const classData = await Class.create({
      name,
      section,
      roomNumber,
      capacity,
      academicYear,
      classTeacherId
    });
    res.status(201).json({ class: classData });
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ message: "Error creating class" });
  }
};

// Update class
exports.updateClass = async (req, res) => {
  try {
    const classData = await Class.findByPk(req.params.id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }
    const { name, section, roomNumber, capacity, academicYear, classTeacherId, isActive } = req.body;
    await classData.update({
      name,
      section,
      roomNumber,
      capacity,
      academicYear,
      classTeacherId,
      isActive
    });
    res.json({ class: classData });
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).json({ message: "Error updating class" });
  }
};

// Delete class
exports.deleteClass = async (req, res) => {
  try {
    const classData = await Class.findByPk(req.params.id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }
    await classData.destroy();
    res.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({ message: "Error deleting class" });
  }
};
