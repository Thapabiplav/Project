const express = require("express");
const router = express.Router();
const { body, validationResult, param } = require("express-validator");
const notificationController = require("../controllers/notification.controller");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const createValidation = [
  body("userId").isInt().withMessage("User ID required"),
  body("title").notEmpty().withMessage("Title required"),
  body("message").notEmpty().withMessage("Message required")
];

router.post("/", authenticate, authorize("admin"), createValidation, validateRequest, notificationController.createNotification);
router.get("/", authenticate, notificationController.getUserNotifications);
router.put("/:id/read", authenticate, param("id").isNumeric().withMessage("ID must be a number"), validateRequest, notificationController.markAsRead);
router.put("/read-all", authenticate, notificationController.markAllAsRead);
router.post("/announcement", authenticate, authorize("admin"), notificationController.sendAnnouncement);
router.post("/exam", authenticate, authorize("admin", "teacher"), notificationController.notifyExam);
router.post("/results", authenticate, authorize("admin", "teacher"), notificationController.notifyResults);
router.post("/fee-reminders", authenticate, authorize("admin"), notificationController.sendFeeReminders);

module.exports = router;