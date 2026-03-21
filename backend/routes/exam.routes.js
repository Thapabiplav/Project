const express = require("express");
const router = express.Router();
const { body, validationResult, param } = require("express-validator");
const examController = require("../controllers/exam.controller");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const createValidation = [
  body("title").notEmpty().withMessage("Title required"),
  body("classId").optional().isNumeric().withMessage("Class ID must be a number"),
  body("subjectId").optional().isNumeric().withMessage("Subject ID must be a number"),
  body("examDate").optional().isISO8601().withMessage("Exam date must be a valid date"),
  body("totalMarks").optional().isNumeric().withMessage("Total marks must be a number")
];

const marksValidation = [
  body("marks").isArray().withMessage("Marks array required"),
  body("marks.*.studentId").isNumeric().withMessage("Student ID must be a number"),
  body("marks.*.marksObtained").isFloat({ min: 0 }).withMessage("Marks required")
];

router.post("/", authenticate, authorize("admin", "teacher"), createValidation, validateRequest, examController.createExam);
router.get("/", authenticate, authorize("admin", "teacher"), examController.getAllExams);
router.get("/:id", authenticate, authorize("admin", "teacher"), param("id").isNumeric().withMessage("ID must be a number"), validateRequest, examController.getExamById);
router.post("/:examId/marks", authenticate, authorize("admin", "teacher"), marksValidation, validateRequest, examController.enterMarks);
router.get("/results/student/:studentId", authenticate, authorize("admin", "teacher", "student"), examController.getStudentResults);
router.get("/:id/results", authenticate, authorize("admin", "teacher"), param("id").isNumeric().withMessage("ID must be a number"), validateRequest, examController.getExamResults);

module.exports = router;