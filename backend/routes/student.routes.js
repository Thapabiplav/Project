const express = require("express");
const router = express.Router();
const { body, validationResult, param, query } = require("express-validator");
const studentController = require("../controllers/student.controller");
const { authenticate, authorize } = require("../middleware/authMiddleware");

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules
const createStudentValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").optional().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("gender").optional().isIn(["male", "female", "other"]),
  body("classId").optional().isNumeric().withMessage("Class ID must be a number")
];

const updateStudentValidation = [
  param("id").isNumeric().withMessage("Student ID must be a number"),
  body("email").optional().isEmail().withMessage("Valid email is required"),
  body("gender").optional().isIn(["male", "female", "other"]),
  body("classId").optional().isNumeric().withMessage("Class ID must be a number")
];

const studentIdValidation = [
  param("id").isNumeric().withMessage("Student ID must be a number")
];

const paginationValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 1000 }).withMessage("Limit must be between 1 and 1000"),
  query("classId").optional().isNumeric().withMessage("Class ID must be a number"),
  query("search").optional().isString().withMessage("Search must be a string")
];

// @route   GET /api/students
// @desc    Get all students with pagination
// @access  Private (Admin, Teacher)
router.get("/", authenticate, authorize("admin", "teacher"), paginationValidation, validateRequest, studentController.getAllStudents);

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private (Admin, Teacher, Student)
router.get("/:id", authenticate, studentIdValidation, validateRequest, studentController.getStudentById);

// @route   POST /api/students
// @desc    Create new student
// @access  Private (Admin only)
router.post("/", authenticate, authorize("admin"), createStudentValidation, validateRequest, studentController.createStudent);

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private (Admin only)
router.put("/:id", authenticate, authorize("admin"), updateStudentValidation, validateRequest, studentController.updateStudent);

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private (Admin only)
router.delete("/:id", authenticate, authorize("admin"), studentIdValidation, validateRequest, studentController.deleteStudent);

module.exports = router;