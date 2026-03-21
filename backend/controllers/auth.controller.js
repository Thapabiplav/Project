const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Student, Teacher } = require("../models");
require("dotenv").config();

/** Primary keys in students / teachers tables (for attendance, fees, marks APIs). */
const buildPublicUserWithProfiles = async (user) => {
  const u = user.get ? user.get({ plain: true }) : user;
  const base = {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    phone: u.phone,
    address: u.address,
    isActive: u.isActive
  };
  if (u.role === "student") {
    const s = await Student.findOne({ where: { userId: u.id } });
    if (s) base.studentProfileId = s.id;
  }
  if (u.role === "teacher") {
    const t = await Teacher.findOne({ where: { userId: u.id } });
    if (t) base.teacherProfileId = t.id;
  }
  return base;
};

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone, address } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });
    const validRoles = ["admin", "teacher", "student", "parent"];
    if (!validRoles.includes(role)) return res.status(400).json({ message: "Invalid role" });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashedPassword, firstName, lastName, role: role || "student", phone, address });
    if (role === "student") {
      const sid = "STU-" + Date.now();
      await Student.create({ userId: user.id, studentId: sid });
    }
    if (role === "teacher") {
      const employeeId = "EMP-" + Date.now();
      await Teacher.create({ userId: user.id, employeeId });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || "sems_jwt_secret_key_2024", { expiresIn: process.env.JWT_EXPIRE || "7d" });
    const publicUser = await buildPublicUserWithProfiles(user);
    res.status(201).json({ message: "User registered", token, user: publicUser });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (!user.isActive) return res.status(401).json({ message: "Account deactivated" });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || "sems_jwt_secret_key_2024", { expiresIn: process.env.JWT_EXPIRE || "7d" });
    const publicUser = await buildPublicUserWithProfiles(user);
    res.json({ message: "Login successful", token, user: publicUser });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ["password"] } });
    if (!user) return res.status(404).json({ message: "User not found" });
    const publicUser = await buildPublicUserWithProfiles(user);
    res.json({ user: publicUser });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

module.exports = { register, login, getProfile };