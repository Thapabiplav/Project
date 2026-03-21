const express = require("express");
const router = express.Router();
const { body, validationResult, param } = require("express-validator");
const timetableController = require("../controllers/timetable.controller");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const createValidation = [
  body("classId").optional().isNumeric().withMessage("Class ID must be a number"),
  body("subjectId").optional().isNumeric().withMessage("Subject ID must be a number"),
  body("teacherId").optional().isNumeric().withMessage("Teacher ID must be a number"),
  body("dayOfWeek").optional().isIn(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]).withMessage("Valid day required"),
  body("startTime").optional().notEmpty().withMessage("Start time required"),
  body("endTime").optional().notEmpty().withMessage("End time required")
];

router.post("/", authenticate, authorize("admin"), createValidation, validateRequest, timetableController.createTimetable);
router.put("/:id", authenticate, authorize("admin"), param("id").isNumeric().withMessage("ID must be a number"), validateRequest, timetableController.updateTimetable);
router.delete("/:id", authenticate, authorize("admin"), param("id").isNumeric().withMessage("ID must be a number"), validateRequest, timetableController.deleteTimetable);
router.get("/", authenticate, authorize("admin", "teacher"), timetableController.getAllTimetables);
router.get("/class/:classId", authenticate, authorize("admin", "teacher"), param("classId").isNumeric().withMessage("Class ID must be a number"), validateRequest, timetableController.getClassTimetable);
router.get("/teacher/:teacherId", authenticate, authorize("admin", "teacher"), param("teacherId").isNumeric().withMessage("Teacher ID must be a number"), validateRequest, timetableController.getTeacherTimetable);

module.exports = router;