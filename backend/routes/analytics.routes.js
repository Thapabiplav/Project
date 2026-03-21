const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { authenticate, authorize } = require("../middleware/authMiddleware");

router.get("/dashboard", authenticate, authorize("admin", "teacher"), analyticsController.getDashboardStats);
router.get("/students", authenticate, authorize("admin", "teacher"), analyticsController.getStudentAnalytics);
router.get("/attendance", authenticate, authorize("admin", "teacher"), analyticsController.getAttendanceAnalytics);
router.get("/exams", authenticate, authorize("admin", "teacher"), analyticsController.getExamAnalytics);
router.get("/fees", authenticate, authorize("admin", "teacher"), analyticsController.getFeeAnalytics);
router.get("/teachers", authenticate, authorize("admin"), analyticsController.getTeacherPerformance);

module.exports = router;