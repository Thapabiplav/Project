const express = require("express");
const router = express.Router();
const { body, validationResult, param } = require("express-validator");
const feeController = require("../controllers/fee.controller");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const createValidation = [
  body("studentId").optional().isNumeric().withMessage("Student ID must be a number"),
  body("amount").optional().isFloat({ min: 1 }).withMessage("Amount must be a positive number"),
  body("dueDate").optional().notEmpty().withMessage("Due date required")
];

const paymentValidation = [
  body("amount").isFloat({ min: 1 }).withMessage("Amount required"),
  body("paymentMethod").isIn(["cash", "card", "bank_transfer", "online"]).withMessage("Valid payment method required")
];

router.post("/", authenticate, authorize("admin"), createValidation, validateRequest, feeController.createFeeStructure);
router.post("/:id/payment", authenticate, authorize("admin"), paymentValidation, validateRequest, feeController.recordPayment);
router.get("/summary", authenticate, authorize("admin"), feeController.getFeeSummary);
router.get("/student/:studentId", authenticate, authorize("admin", "teacher", "student"), param("studentId").isNumeric().withMessage("Student ID must be a number"), validateRequest, feeController.getStudentFees);
router.get("/", authenticate, authorize("admin", "teacher"), feeController.getAllFees);
router.delete("/:id", authenticate, authorize("admin"), param("id").isNumeric().withMessage("ID must be a number"), validateRequest, feeController.deleteFee);

module.exports = router;