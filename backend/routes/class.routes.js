const express = require("express");
const router = express.Router();
const { body, param, validationResult } = require("express-validator");
const classController = require("../controllers/class.controller");
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
const createValidation = [
  body("name").notEmpty().withMessage("Class name is required"),
  body("section").optional().isString(),
  body("roomNumber").optional().isString(),
  body("capacity").optional().isNumeric().withMessage("Capacity must be a number"),
  body("academicYear").optional().isString(),
  body("classTeacherId").optional().isNumeric().withMessage("Class teacher ID must be a number")
];

const idValidation = [
  param("id").isNumeric().withMessage("Valid class ID required")
];

// Routes
router.get("/", authenticate, authorize("admin", "teacher"), classController.getAllClasses);
router.get("/:id", authenticate, authorize("admin", "teacher"), idValidation, validateRequest, classController.getClass);
router.post("/", authenticate, authorize("admin"), createValidation, validateRequest, classController.createClass);
router.put("/:id", authenticate, authorize("admin"), idValidation, validateRequest, classController.updateClass);
router.delete("/:id", authenticate, authorize("admin"), idValidation, validateRequest, classController.deleteClass);

module.exports = router;
