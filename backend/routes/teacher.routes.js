const express = require("express");
const router = express.Router();
const { body, validationResult, param, query } = require("express-validator");
const teacherController = require("../controllers/teacher.controller");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const createValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("firstName").notEmpty().withMessage("First name required"),
  body("lastName").notEmpty().withMessage("Last name required")
];

const idValidation = [param("id").isNumeric().withMessage("ID must be a number")];

router.get("/", authenticate, authorize("admin", "teacher"), teacherController.getAllTeachers);
router.get("/:id", authenticate, authorize("admin", "teacher"), idValidation, validateRequest, teacherController.getTeacherById);
router.post("/", authenticate, authorize("admin"), createValidation, validateRequest, teacherController.createTeacher);
router.put("/:id", authenticate, authorize("admin"), idValidation, validateRequest, teacherController.updateTeacher);
router.delete("/:id", authenticate, authorize("admin"), idValidation, validateRequest, teacherController.deleteTeacher);
router.post("/:id/subjects", authenticate, authorize("admin"), idValidation, validateRequest, teacherController.assignSubjects);
router.post("/:id/class", authenticate, authorize("admin"), idValidation, validateRequest, teacherController.assignClass);

module.exports = router;