const { Fee, Student, User, Class } = require("../models");

// Wrapper to ensure only one response is sent
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const createFeeStructure = asyncHandler(async (req, res) => {
  console.log('\n========== FEE CREATE REQUEST ==========');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Body:', JSON.stringify(req.body));
  console.log('User:', req.user);
  console.log('==========================================\n');
  
  // Extract fields
  const { studentId, feeType, amount, dueDate, remarks, academicYear } = req.body;
  
  // Validate required fields
  if (!studentId) {
    console.log('[VALIDATION] studentId is missing');
    return res.status(400).json({ 
      success: false,
      message: "studentId is required" 
    });
  }
  
  // Parse and validate amount
  let parsedAmount = null;
  if (amount) {
    parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.log('[VALIDATION] Invalid amount:', amount);
      return res.status(400).json({ 
        success: false,
        message: "Amount must be a positive number" 
      });
    }
  }
  
  // studentId is optional - can create fee structure without specific student
  // (for bulk fees that get assigned later)
  let student = null;
  if (studentId) {
    const parsedStudentId = parseInt(studentId);
    if (!isNaN(parsedStudentId)) {
      student = await Student.findByPk(parsedStudentId);
      if (!student) {
        console.log('[VALIDATION] Student not found with ID:', parsedStudentId);
        return res.status(400).json({ 
          success: false,
          message: "Student not found with ID: " + parsedStudentId 
        });
      }
    }
  }
  
  console.log('[DB] Creating fee record...');
  const fee = await Fee.create({ 
    studentId: studentId || null, 
    feeType: feeType || 'tuition', 
    amount: parsedAmount, 
    paidAmount: 0, 
    dueDate, 
    remarks, 
    status: "pending", 
    academicYear 
  });
  
  console.log('[DB] Fee created with ID:', fee.id);
  
  // Build response object manually to avoid any serialization issues
  const responseData = {
    id: fee.id,
    studentId: fee.studentId,
    feeType: fee.feeType,
    amount: parseFloat(fee.amount),
    paidAmount: parseFloat(fee.paidAmount || 0),
    dueDate: fee.dueDate,
    status: fee.status,
    academicYear: fee.academicYear,
    createdAt: fee.createdAt,
    updatedAt: fee.updatedAt
  };
  
  console.log('[RESPONSE] Sending success response...');
  return res.status(201).json({
    success: true,
    message: "Fee structure created",
    fee: responseData
  });
});

// Export with asyncHandler wrapper
module.exports = { 
  createFeeStructure: asyncHandler(createFeeStructure),
  getAllFees: asyncHandler(async (req, res) => {
    // ... rest unchanged
    const { page = 1, limit = 10, status, studentId, classId } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    
    let studentIds = null;
    if (classId) {
      const studentsInClass = await Student.findAll({ where: { classId }, attributes: ['id'] });
      studentIds = studentsInClass.map(s => s.id);
      if (studentIds.length > 0) {
        where.studentId = { [require('sequelize').Op.in]: studentIds };
      }
    }
    
    const { count, rows: fees } = await Fee.findAndCountAll({
      where,
      include: [{ 
        model: Student, 
        as: "student", 
        include: [
          { model: User, as: "userAccount", attributes: ["id", "firstName", "lastName", "email"] },
          { model: Class, as: "class", attributes: ["id", "name", "section"] }
        ] 
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]]
    });
    return res.json({ success: true, fees, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count/limit) } });
  }),
  getFeeById: asyncHandler(async (req, res) => {
    const fee = await Fee.findByPk(req.params.id, { 
      include: [{ 
        model: Student, 
        as: "student", 
        include: [{ model: User, as: "userAccount", attributes: { exclude: ["password"] } }] 
      }] 
    });
    if (!fee) return res.status(404).json({ success: false, message: "Fee not found" });
    return res.json({ success: true, fee });
  }),
  updateFee: asyncHandler(async (req, res) => {
    const fee = await Fee.findByPk(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: "Fee not found" });
    const { amount, dueDate, description, status } = req.body;
    await fee.update({ amount: amount || fee.amount, dueDate: dueDate || fee.dueDate, description: description || fee.description, status: status || fee.status });
    return res.json({ success: true, message: "Fee updated", fee });
  }),
  deleteFee: asyncHandler(async (req, res) => {
    const fee = await Fee.findByPk(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: "Fee not found" });
    await fee.destroy();
    return res.json({ success: true, message: "Fee deleted" });
  }),
  recordPayment: asyncHandler(async (req, res) => {
    const fee = await Fee.findByPk(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: "Fee not found" });
    const { amount, paymentMethod, transactionId, paymentDate, remarks } = req.body;
    const newPaidAmount = parseFloat(fee.paidAmount) + parseFloat(amount);
    const newPendingAmount = parseFloat(fee.amount) - newPaidAmount;
    const newStatus = newPendingAmount <= 0 ? "paid" : (newPaidAmount > 0 ? "partial" : "pending");
    await fee.update({ 
      paidAmount: newPaidAmount, 
      status: newStatus, 
      paymentMethod, 
      transactionId, 
      paymentDate: paymentDate || new Date(), 
      remarks: remarks || fee.remarks 
    });
    return res.json({ success: true, message: "Payment recorded", fee });
  }),
  getFeeSummary: asyncHandler(async (req, res) => {
    const Sequelize = require("sequelize");
    const fees = await Fee.findAll({ attributes: ['amount', 'paidAmount'] });
    const total = fees.reduce((sum, f) => sum + parseFloat(f.amount), 0);
    const paid = fees.reduce((sum, f) => sum + parseFloat(f.paidAmount || 0), 0);
    const pending = total - paid;
    return res.json({ success: true, total, paid, pending });
  }),
  getStudentFees: asyncHandler(async (req, res) => {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ success: false, message: "Student profile not found" });
    const fees = await Fee.findAll({ where: { studentId: student.id }, order: [["createdAt", "DESC"]] });
    return res.json({ success: true, fees });
  })
};
