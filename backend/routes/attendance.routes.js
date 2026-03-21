const express = require("express");
const router = express.Router();
const { body, validationResult, param, query } = require("express-validator");
const attendanceController = require("../controllers/attendance.controller");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const markValidation = [
  body("studentId").isNumeric().withMessage("Student ID is required"),
  body("date").isISO8601().withMessage("Valid date required"),
  body("status").isIn(["present", "absent", "late", "leave"]).withMessage("Invalid status")
];

const bulkValidation = [
  body("attendances").isArray().withMessage("Attendances array required"),
  body("date").isDate().withMessage("Valid date required")
];

router.post("/", authenticate, authorize("admin", "teacher"), markValidation, validateRequest, attendanceController.markAttendance);
router.post("/bulk", authenticate, authorize("admin", "teacher"), bulkValidation, validateRequest, attendanceController.markBulkAttendance);
router.get("/student/:id", authenticate, authorize("admin", "teacher", "student"), param("id").isNumeric(), validateRequest, attendanceController.getStudentAttendance);
router.get("/class/:id", authenticate, authorize("admin", "teacher"), param("id").isNumeric(), validateRequest, attendanceController.getClassAttendance);

module.exports = router;