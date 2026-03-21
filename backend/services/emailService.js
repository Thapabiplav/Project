const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.SMTP_USER) {
      console.log("Email not configured, skipping:", { to, subject });
      return { success: true, mock: true };
    }
    const info = await transporter.sendMail({
      from: \`"SEMS" <\${process.env.SMTP_USER}>\`,
      to,
      subject,
      html
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error: error.message };
  }
};

const sendSystemAnnouncement = async (users, title, message) => {
  const results = [];
  for (const user of users) {
    const result = await sendEmail(
      user.email,
      \`[SEMS] \${title}\`,
      \`<h2>\${title}</h2><p>\${message}</p>\`
    );
    results.push({ email: user.email, ...result });
  }
  return results;
};

const sendExamNotification = async (student, exam) => {
  const subject = "Exam Scheduled: " + exam.title;
  const html = \`<h2>Exam Notification</h2><p>Dear \${student.firstName},</p><p>An exam has been scheduled:</p><ul><li>Subject: \${exam.subject?.name}</li><li>Date: \${exam.examDate}</li><li>Time: \${exam.startTime} - \${exam.endTime}</li><li>Total Marks: \${exam.totalMarks}</li></ul>\`;
  return sendEmail(student.email, subject, html);
};

const sendResultNotification = async (student, result) => {
  const subject = "Result Published: " + result.exam?.title;
  const html = \`<h2>Result Notification</h2><p>Dear \${student.firstName},</p><p>Your result has been published:</p><ul><li>Subject: \${result.exam?.subject?.name}</li><li>Marks: \${result.marksObtained}/\${result.totalMarks}</li><li>Grade: \${result.grade}</li><li>Percentage: \${result.percentage}%</li></ul>\`;
  return sendEmail(student.email, subject, html);
};

const sendFeeReminder = async (student, fee) => {
  const subject = "Fee Payment Reminder";
  const html = \`<h2>Fee Reminder</h2><p>Dear \${student.firstName},</p><p>This is a reminder for pending fee payment:</p><ul><li>Fee Type: \${fee.feeType}</li><li>Amount: Rs. \${fee.pendingAmount}</li><li>Due Date: \${fee.dueDate}</li></ul><p>Please pay before the due date to avoid late charges.</p>\`;
  return sendEmail(student.email, subject, html);
};

module.exports = { sendEmail, sendSystemAnnouncement, sendExamNotification, sendResultNotification, sendFeeReminder };