const { sequelize } = require("./models");
const bcrypt = require("bcrypt");
const { User, Student, Teacher, Class, Subject } = require("./models");

const seedDatabase = async () => {
  try {
    console.log("Syncing database...");
    await sequelize.sync({ force: true });
    console.log("Database synced!");

    console.log("Creating classes...");
    const classes = await Class.bulkCreate([
      { name: "Grade 1", section: "A", capacity: 30, academicYear: "2024-2025" },
      { name: "Grade 2", section: "A", capacity: 30, academicYear: "2024-2025" },
      { name: "Grade 3", section: "A", capacity: 35, academicYear: "2024-2025" },
      { name: "Grade 4", section: "A", capacity: 35, academicYear: "2024-2025" },
      { name: "Grade 5", section: "A", capacity: 40, academicYear: "2024-2025" }
    ]);

    console.log("Creating admin user...");
    const adminPassword = await bcrypt.hash("admin123", 12);
    await User.create({
      email: "admin@sems.com",
      password: adminPassword,
      firstName: "System",
      lastName: "Admin",
      role: "admin",
      isActive: true
    });

    console.log("Creating teachers...");
    const teacherPassword = await bcrypt.hash("teacher123", 12);
    const teacher1 = await User.create({ email: "teacher1@sems.com", password: teacherPassword, firstName: "John", lastName: "Smith", role: "teacher", isActive: true });
    const teacher2 = await User.create({ email: "teacher2@sems.com", password: teacherPassword, firstName: "Sarah", lastName: "Johnson", role: "teacher", isActive: true });
    const teacher3 = await User.create({ email: "teacher3@sems.com", password: teacherPassword, firstName: "Mike", lastName: "Brown", role: "teacher", isActive: true });

    await Teacher.bulkCreate([
      { userId: teacher1.id, employeeId: "EMP-001", qualification: "M.Sc.", experience: 5, department: "Mathematics" },
      { userId: teacher2.id, employeeId: "EMP-002", qualification: "M.A.", experience: 3, department: "English" },
      { userId: teacher3.id, employeeId: "EMP-003", qualification: "M.Sc.", experience: 7, department: "Science" }
    ]);

    console.log("Creating subjects...");
    await Subject.bulkCreate([
      { name: "Mathematics", code: "MATH-1", classId: classes[0].id, teacherId: 1 },
      { name: "English", code: "ENG-1", classId: classes[0].id, teacherId: 2 },
      { name: "Science", code: "SCI-1", classId: classes[0].id, teacherId: 3 },
      { name: "Mathematics", code: "MATH-2", classId: classes[1].id, teacherId: 1 },
      { name: "English", code: "ENG-2", classId: classes[1].id, teacherId: 2 },
      { name: "Mathematics", code: "MATH-3", classId: classes[2].id, teacherId: 1 }
    ]);

    console.log("Creating students...");
    const studentPassword = await bcrypt.hash("student123", 12);
    const studentUsers = [];
    for (let i = 1; i <= 10; i++) {
      const user = await User.create({
        email: "student" + i + "@sems.com",
        password: studentPassword,
        firstName: "Student" + i,
        lastName: "LastName",
        role: "student",
        isActive: true
      });
      studentUsers.push(user);
    }

    await Student.bulkCreate([
      { userId: studentUsers[0].id, studentId: "STU-001", classId: classes[0].id, rollNumber: "1" },
      { userId: studentUsers[1].id, studentId: "STU-002", classId: classes[0].id, rollNumber: "2" },
      { userId: studentUsers[2].id, studentId: "STU-003", classId: classes[0].id, rollNumber: "3" },
      { userId: studentUsers[3].id, studentId: "STU-004", classId: classes[1].id, rollNumber: "1" },
      { userId: studentUsers[4].id, studentId: "STU-005", classId: classes[1].id, rollNumber: "2" },
      { userId: studentUsers[5].id, studentId: "STU-006", classId: classes[2].id, rollNumber: "1" },
      { userId: studentUsers[6].id, studentId: "STU-007", classId: classes[2].id, rollNumber: "2" },
      { userId: studentUsers[7].id, studentId: "STU-008", classId: classes[3].id, rollNumber: "1" },
      { userId: studentUsers[8].id, studentId: "STU-009", classId: classes[4].id, rollNumber: "1" },
      { userId: studentUsers[9].id, studentId: "STU-010", classId: classes[4].id, rollNumber: "2" }
    ]);

    console.log("\nDatabase seeded successfully!");
    console.log("\nLogin credentials:");
    console.log("Admin: admin@sems.com / admin123");
    console.log("Teacher: teacher1@sems.com / teacher123");
    console.log("Student: student1@sems.com / student123");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

seedDatabase();