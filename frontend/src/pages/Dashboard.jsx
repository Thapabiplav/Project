import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDashboardStats,
  getStudents,
  getTeachers,
  getNotifications,
  createStudent,
  updateStudent,
  deleteStudent,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getExams,
  createExam,
  enterMarks,
  getExamResults,
  getFees,
  createFee,
  recordPayment,
  getTimetables,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  markAttendance,
  markBulkAttendance,
  getStudentAttendance,
  getClassAttendance,
  getStudentFees,
  getStudentResults,
  getClassTimetable,
  getPendingFees,
  getAttendanceStats,
  sendAnnouncement,
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getProfile
} from '../services/api';
import './Dashboard.css';

/** Backend Sequelize aliases: User → userAccount, Class → class (see models/index.js). */
function userFrom(row) {
  if (!row) return null;
  return row.userAccount || row.user || null;
}
function displayNameFrom(row) {
  const u = userFrom(row);
  if (!u) return '—';
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return name || '—';
}
function emailFrom(row) {
  return userFrom(row)?.email ?? '—';
}
function classNameFrom(row) {
  return row?.class?.name ?? '—';
}

function markScore(r) {
  if (!r) return 0;
  const v = r.marksObtained != null ? r.marksObtained : r.mark;
  return Number(v) || 0;
}

function normalizeAttendanceStatus(status) {
  return String(status ?? '').toLowerCase().trim();
}

function attendanceStatusLabel(status) {
  const s = normalizeAttendanceStatus(status);
  if (s === 'present') return 'Present';
  if (s === 'absent') return 'Absent';
  if (s === 'late') return 'Late';
  if (s === 'excused') return 'Excused';
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Data states for various modules
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [fees, setFees] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [myFees, setMyFees] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [marks, setMarks] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [selectedTeacherClass, setSelectedTeacherClass] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchData(parsedUser);
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'attendance' && selectedClass) {
      fetchClassAttendance(selectedClass);
    }
    if (activeTab === 'timetable' && selectedClass) {
      fetchClassTimetable(selectedClass);
    }
    if (activeTab === 'fees' && user?.role === 'admin') {
      fetchFees();
    }
    if (activeTab === 'exams') {
      fetchExams();
    }
    if (activeTab === 'myAttendance' && user?.role === 'student') {
      fetchStudentData();
    }
    if (activeTab === 'myResults' && user?.role === 'student') {
      fetchStudentData();
    }
    if (activeTab === 'myFees' && user?.role === 'student') {
      fetchStudentData();
    }
    // Refresh data when switching to data management tabs
    if (activeTab === 'students' && user?.role === 'admin') {
      refreshStudents();
    }
    if (activeTab === 'teachers' && user?.role === 'admin') {
      refreshTeachers();
    }
    if (activeTab === 'classes' && user?.role === 'admin') {
      refreshClasses();
    }
  }, [activeTab, selectedClass, selectedDate, user?.studentProfileId, user?.role]);

  const refreshStudents = async () => {
    try {
      const res = await getStudents({ limit: 500 });
      setStudents(res.data?.students || res.data || []);
    } catch {
      /* ignore */
    }
  };

  const refreshTeachers = async () => {
    try {
      const res = await getTeachers({ limit: 500 });
      setTeachers(res.data?.teachers || res.data || []);
    } catch {
      /* ignore */
    }
  };

  const refreshClasses = async () => {
    try {
      const res = await getClasses();
      setClasses(res.data?.classes || res.data || []);
    } catch {
      /* ignore */
    }
  };

  const resolveStudentRecordId = () => {
    if (user?.studentProfileId != null && user.studentProfileId !== '') {
      return Number(user.studentProfileId);
    }
    const match = students.find(s => userFrom(s)?.email === user?.email);
    return match?.id ?? null;
  };

  const fetchStudentData = async () => {
    try {
      const studentId = resolveStudentRecordId();
      if (!studentId) return;
      const [attRes, feesRes, resultsRes] = await Promise.all([
        getStudentAttendance(studentId),
        getStudentFees(studentId),
        getStudentResults(studentId)
      ]);
      setMyAttendance(attRes.data?.attendance || []);
      setMyFees(feesRes.data?.fees || []);
      setMyResults(resultsRes.data?.marks || []);
    } catch {
      /* ignore */
    }
  };

  const fetchFees = async () => {
    try {
      const res = await getFees();
      setFees(res.data?.fees || res.data || []);
    } catch {
      /* ignore */
    }
  };

  const fetchExams = async () => {
    try {
      const res = await getExams();
      setExams(res.data?.exams || res.data || []);
    } catch {
      /* ignore */
    }
  };

  const fetchData = async (userData) => {
    try {
      if (userData.role === 'student') {
        const [notifRes, profileRes] = await Promise.all([
          getNotifications(),
          getProfile()
        ]);
        setNotifications(notifRes.data?.notifications || notifRes.data || []);
        const profileUser = profileRes.data?.user;
        if (profileUser) {
          const merged = { ...userData, ...profileUser };
          setUser(merged);
          localStorage.setItem('user', JSON.stringify(merged));
          const sid = profileUser.studentProfileId;
          if (sid != null) {
            const [attRes, feesRes, resultsRes] = await Promise.all([
              getStudentAttendance(sid),
              getStudentFees(sid),
              getStudentResults(sid)
            ]);
            setMyAttendance(attRes.data?.attendance || []);
            setMyFees(feesRes.data?.fees || []);
            setMyResults(resultsRes.data?.marks || []);
          }
        }
        return;
      }

      const [statsRes, studentsRes, teachersRes, notificationsRes, classesRes] = await Promise.all([
        getDashboardStats(),
        getStudents({ limit: 500 }),
        getTeachers({ limit: 500 }),
        getNotifications(),
        getClasses()
      ]);
      const statsData = statsRes.data?.stats || statsRes.data || {};
      setStats(statsData);
      setStudents(studentsRes.data?.students || studentsRes.data || []);
      setTeachers(teachersRes.data?.teachers || teachersRes.data || []);
      setNotifications(notificationsRes.data?.notifications || notificationsRes.data || []);
      setClasses(classesRes.data?.classes || classesRes.data || []);

      if (userData.role === 'teacher') {
        const examsRes = await getExams({ teacherId: userData.teacherId || userData.id });
        setExams(examsRes.data?.exams || examsRes.data || []);
        // Fetch teacher's assigned classes from subjects
        const teacherExams = examsRes.data?.exams || examsRes.data || [];
        const uniqueClasses = [...new Set(teacherExams.map(e => e.class?.name).filter(Boolean))];
        setTeacherClasses(uniqueClasses);
        // Get unique subjects
        const uniqueSubjects = [...new Set(teacherExams.map(e => e.subject).filter(Boolean))];
        setTeacherSubjects(uniqueSubjects);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const fetchClassAttendance = async (classId) => {
    try {
      if (!classId) return;
      const classIdInt = parseInt(classId, 10);
      if (isNaN(classIdInt)) return;
      const res = await getClassAttendance(classIdInt, { date: selectedDate });
      setAttendanceRecords(res.data?.attendance || []);
    } catch {
      /* ignore */
    }
  };

  const fetchClassTimetable = async (classId) => {
    try {
      const res = await getClassTimetable(classId);
      setTimetables(res.data?.timetable || []);
    } catch {
      /* ignore */
    }
  };

  /** Reload lists and dashboard stats after any create/update/delete so the UI matches the server without a manual refresh. */
  const refreshAfterMutation = async () => {
    const u = user || (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || 'null');
      } catch {
        return null;
      }
    })();

    const settled = await Promise.allSettled([
      getDashboardStats(),
      getStudents({ limit: 500 }),
      getTeachers({ limit: 500 }),
      getNotifications(),
      getClasses(),
      getExams(),
      getFees(),
      getTimetables()
    ]);

    const statsRes = settled[0].status === 'fulfilled' ? settled[0].value : null;
    const studentsRes = settled[1].status === 'fulfilled' ? settled[1].value : null;
    const teachersRes = settled[2].status === 'fulfilled' ? settled[2].value : null;
    const notificationsRes = settled[3].status === 'fulfilled' ? settled[3].value : null;
    const classesRes = settled[4].status === 'fulfilled' ? settled[4].value : null;
    const examsRes = settled[5].status === 'fulfilled' ? settled[5].value : null;
    const feesRes = settled[6].status === 'fulfilled' ? settled[6].value : null;
    const timetablesRes = settled[7].status === 'fulfilled' ? settled[7].value : null;

    if (statsRes?.data) setStats(statsRes.data.stats || statsRes.data || {});
    if (studentsRes?.data) {
      const studentsList = studentsRes.data.students || studentsRes.data || [];
      setStudents(Array.isArray(studentsList) ? studentsList : []);
    }
    if (teachersRes?.data) setTeachers(teachersRes.data.teachers || teachersRes.data || []);
    if (notificationsRes?.data) setNotifications(notificationsRes.data.notifications || notificationsRes.data || []);
    if (classesRes?.data) setClasses(classesRes.data.classes || classesRes.data || []);
    if (examsRes?.data) setExams(examsRes.data.exams || examsRes.data || []);
    if (feesRes?.data) setFees(feesRes.data.fees || feesRes.data || []);
    if (timetablesRes?.data) {
      const tt = timetablesRes.data.timetables ?? timetablesRes.data;
      setTimetables(Array.isArray(tt) ? tt : []);
    }

    if (u?.role === 'student') {
      const sid = u.studentProfileId != null ? Number(u.studentProfileId) : null;
      if (sid) {
        try {
          const [attRes, feesRes2, resultsRes] = await Promise.all([
            getStudentAttendance(sid),
            getStudentFees(sid),
            getStudentResults(sid)
          ]);
          setMyAttendance(attRes.data?.attendance || []);
          setMyFees(feesRes2.data?.fees || []);
          setMyResults(resultsRes.data?.marks || []);
        } catch {
          /* ignore */
        }
      }
    }
    if (u?.role === 'teacher') {
      try {
        const examsRes2 = await getExams({ teacherId: u.teacherId || u.id });
        const teacherExams = examsRes2.data?.exams || examsRes2.data || [];
        setExams(teacherExams);
        setTeacherClasses([...new Set(teacherExams.map(e => e.class?.name).filter(Boolean))]);
        setTeacherSubjects([...new Set(teacherExams.map(e => e.subject).filter(Boolean))]);
      } catch {
        /* ignore */
      }
    }

    try {
      if (activeTab === 'attendance' && selectedClass) {
        await fetchClassAttendance(selectedClass);
      }
      if (activeTab === 'timetable' && selectedClass) {
        await fetchClassTimetable(selectedClass);
      }
    } catch {
      /* ignore */
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    if (item) {
      if (type === 'student' || type === 'teacher') {
        const u = userFrom(item);
        setFormData({
          ...item,
          firstName: u?.firstName ?? item.firstName,
          lastName: u?.lastName ?? item.lastName,
          email: u?.email ?? item.email,
          phone: u?.phone ?? item.phone,
          className: item.class?.name ?? item.className
        });
      } else {
        setFormData(item);
      }
    } else {
      setFormData({});
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let dataToSend = { ...formData };
      
      switch (modalType) {
        case 'student':
          // Convert className to classId
          if (formData.className) {
            const selectedClass = classes.find(c => c.name === formData.className);
            if (selectedClass) {
              dataToSend.classId = selectedClass.id;
            }
          }
          // Remove className as it's not needed in API
          delete dataToSend.className;
          // Add default password if not provided
          if (!dataToSend.password) {
            dataToSend.password = 'student123';
          }
          if (editingItem) {
            await updateStudent(editingItem.id, dataToSend);
          } else {
            await createStudent(dataToSend);
          }
          break;
        case 'teacher':
          // Remove className if present
          delete dataToSend.className;
          // Add default password if not provided
          if (!dataToSend.password) {
            dataToSend.password = 'teacher123';
          }
          if (editingItem) {
            await updateTeacher(editingItem.id, dataToSend);
          } else {
            await createTeacher(dataToSend);
          }
          break;
        case 'exam':
          // Convert field names for exam API
          dataToSend = {
            title: formData.name,
            examDate: formData.date,
            totalMarks: parseInt(formData.totalMarks) || 100,
            passingMarks: parseInt(formData.totalMarks) ? parseInt(formData.totalMarks) * 0.4 : 40
          };
          // Convert className to classId
          if (formData.className) {
            const selectedClass = classes.find(c => c.name === formData.className);
            if (selectedClass) {
              dataToSend.classId = selectedClass.id;
            }
          }
          if (editingItem) {
            // Update exam
          } else {
            await createExam(dataToSend);
          }
          break;
        case 'fee':
          // Convert studentId to proper format
          if (!formData.studentId) {
            throw new Error('Student ID is required');
          }
          if (!formData.amount) {
            throw new Error('Amount is required');
          }
          dataToSend.studentId = parseInt(formData.studentId);
          dataToSend.amount = parseFloat(formData.amount);
          if (isNaN(dataToSend.studentId) || isNaN(dataToSend.amount)) {
            throw new Error('Invalid student ID or amount');
          }
          if (editingItem) {
            // Update fee
          } else {
            await createFee(dataToSend);
          }
          break;
        case 'timetable':
          // Convert field names for timetable API
          dataToSend = {
            dayOfWeek: formData.day,
            startTime: formData.startTime,
            endTime: formData.endTime,
            room: formData.room || 'TBD'
          };
          // Convert className to classId
          if (formData.className) {
            const selectedClass = classes.find(c => c.name === formData.className);
            if (selectedClass) {
              dataToSend.classId = selectedClass.id;
            }
          }
          if (editingItem) {
            await updateTimetable(editingItem.id, dataToSend);
          } else {
            await createTimetable(dataToSend);
          }
          break;
        case 'class':
          dataToSend.capacity = parseInt(formData.capacity) || 30;
          if (editingItem) {
            await updateClass(editingItem.id, dataToSend);
          } else {
            await createClass(dataToSend);
          }
          break;
        case 'notification':
          // Notification API expects roles array for announcements
          dataToSend = {
            title: formData.title,
            message: formData.message,
            roles: ['student', 'teacher', 'admin'] // Send to all
          };
          await sendAnnouncement(dataToSend);
          break;
        default:
          break;
      }
      await refreshAfterMutation();
      closeModal();
    } catch (error) {
      alert('Error saving data: ' + (error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || error.message));
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      switch (type) {
        case 'student':
          await deleteStudent(id);
          break;
        case 'teacher':
          await deleteTeacher(id);
          break;
        case 'timetable':
          await deleteTimetable(id);
          break;
        case 'class':
          await deleteClass(id);
          break;
        default:
          break;
      }
      await refreshAfterMutation();
    } catch {
      alert('Error deleting item. Please try again.');
    }
  };

  const handleMarkAttendance = async (studentId, status) => {
    try {
      await markAttendance({
        studentId,
        date: selectedDate,
        status,
        classId: selectedClass
      });
      fetchClassAttendance(selectedClass);
    } catch {
      /* ignore */
    }
  };

  const handleBulkAttendance = async (status) => {
    try {
      const studentIds = students.filter(s => String(s.classId) === String(selectedClass)).map(s => s.id);
      await markBulkAttendance({
        studentIds,
        date: selectedDate,
        status,
        classId: selectedClass
      });
      fetchClassAttendance(selectedClass);
    } catch {
      /* ignore */
    }
  };

  const handleRecordPayment = async (feeId, amount) => {
    try {
      await recordPayment(feeId, { amount: parseFloat(amount), date: new Date().toISOString() });
      await refreshAfterMutation();
    } catch {
      /* ignore */
    }
  };

  const handleEnterMarks = async (examId, studentId, mark) => {
    try {
      await enterMarks(examId, { marks: [{ studentId, marksObtained: parseFloat(mark) }] });
      const resultsRes = await getExamResults(examId);
      setMarks(resultsRes.data?.marks || []);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>School Management</h2>
        <nav>
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          {user?.role === 'admin' && (
            <>
              <button 
                className={activeTab === 'students' ? 'active' : ''} 
                onClick={() => setActiveTab('students')}
              >
                Students
              </button>
              <button 
                className={activeTab === 'teachers' ? 'active' : ''} 
                onClick={() => setActiveTab('teachers')}
              >
                Teachers
              </button>
              <button 
                className={activeTab === 'classes' ? 'active' : ''} 
                onClick={() => setActiveTab('classes')}
              >
                Classes
              </button>
              <button 
                className={activeTab === 'attendance' ? 'active' : ''} 
                onClick={() => setActiveTab('attendance')}
              >
                Attendance
              </button>
              <button 
                className={activeTab === 'exams' ? 'active' : ''} 
                onClick={() => setActiveTab('exams')}
              >
                Exams
              </button>
              <button 
                className={activeTab === 'fees' ? 'active' : ''} 
                onClick={() => setActiveTab('fees')}
              >
                Fees
              </button>
              <button 
                className={activeTab === 'timetable' ? 'active' : ''} 
                onClick={() => setActiveTab('timetable')}
              >
                Timetable
              </button>
              <button 
                className={activeTab === 'notifications' ? 'active' : ''} 
                onClick={() => setActiveTab('notifications')}
              >
                Notifications
              </button>
            </>
          )}
          {user?.role === 'teacher' && (
            <>
              <button 
                className={activeTab === 'my_classes' ? 'active' : ''} 
                onClick={() => setActiveTab('my_classes')}
              >
                My Classes
              </button>
              <button 
                className={activeTab === 'attendance' ? 'active' : ''} 
                onClick={() => setActiveTab('attendance')}
              >
                Attendance
              </button>
              <button 
                className={activeTab === 'exams' ? 'active' : ''} 
                onClick={() => setActiveTab('exams')}
              >
                Marks
              </button>
            </>
          )}
          {user?.role === 'student' && (
            <>
              <button 
                className={activeTab === 'myAttendance' ? 'active' : ''} 
                onClick={() => setActiveTab('myAttendance')}
              >
                My Attendance
              </button>
              <button 
                className={activeTab === 'myResults' ? 'active' : ''} 
                onClick={() => setActiveTab('myResults')}
              >
                My Results
              </button>
              <button 
                className={activeTab === 'myFees' ? 'active' : ''} 
                onClick={() => setActiveTab('myFees')}
              >
                My Fees
              </button>
            </>
          )}
        </nav>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="main-content">
        <header>
          <h1>Welcome, {user?.firstName} {user?.lastName}</h1>
          <span className="role-badge">{user?.role}</span>
        </header>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Students</h3>
                <p className="stat-number">{stats?.totalStudents || students.length || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Total Teachers</h3>
                <p className="stat-number">{stats?.totalTeachers || teachers.length || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Total Classes</h3>
                <p className="stat-number">{stats?.totalClasses || classes.length || 5}</p>
              </div>
              <div className="stat-card">
                <h3>Attendance Today</h3>
                <p className="stat-number">{stats?.attendanceRate || 95}%</p>
              </div>
            </div>

            <div className="recent-section">
              <div className="recent-card">
                <h3>Recent Notifications</h3>
                {notifications.length > 0 ? (
                  <ul>
                    {notifications.slice(0, 5).map((notif, index) => (
                      <li key={index}>
                        <span className="notif-title">{notif.title}</span>
                        <span className="notif-date">{new Date(notif.createdAt).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No notifications</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && user?.role === 'admin' && (
          <div className="admin-content">
            <div className="content-header">
              <h2>Student Management</h2>
              <button className="add-btn" onClick={() => openModal('student')}>+ Add Student</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Class</th>
                  <th>Roll No</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.studentId || student.id}</td>
                    <td>{displayNameFrom(student)}</td>
                    <td>{emailFrom(student)}</td>
                    <td>{classNameFrom(student)}</td>
                    <td>{student.rollNumber ?? '—'}</td>
                    <td>
                      <button onClick={() => openModal('student', student)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete('student', student.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Teachers Tab */}
        {activeTab === 'teachers' && user?.role === 'admin' && (
          <div className="admin-content">
            <div className="content-header">
              <h2>Teacher Management</h2>
              <button className="add-btn" onClick={() => openModal('teacher')}>+ Add Teacher</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Qualification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>{teacher.employeeId}</td>
                    <td>{displayNameFrom(teacher)}</td>
                    <td>{emailFrom(teacher)}</td>
                    <td>{teacher.department ?? '—'}</td>
                    <td>{teacher.qualification ?? '—'}</td>
                    <td>
                      <button onClick={() => openModal('teacher', teacher)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete('teacher', teacher.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && user?.role === 'admin' && (
          <div className="admin-content">
            <div className="content-header">
              <h2>Class Management</h2>
              <button className="add-btn" onClick={() => openModal('class')}>+ Add Class</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Section</th>
                  <th>Room</th>
                  <th>Capacity</th>
                  <th>Academic Year</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls.id}>
                    <td>{cls.name}</td>
                    <td>{cls.section || '-'}</td>
                    <td>{cls.roomNumber || '-'}</td>
                    <td>{cls.capacity}</td>
                    <td>{cls.academicYear || '-'}</td>
                    <td>{cls.students?.length || 0}</td>
                    <td>
                      <button onClick={() => openModal('class', cls)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete('class', cls.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {classes.length === 0 && (
                  <tr>
                    <td colSpan="7">No classes found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="admin-content">
            <h2>Attendance Management</h2>
            <div className="filter-bar">
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
              />
              {(user?.role === 'admin' || user?.role === 'teacher') && (
                <div className="bulk-actions">
                  <button onClick={() => handleBulkAttendance('present')}>Mark All Present</button>
                  <button onClick={() => handleBulkAttendance('absent')}>Mark All Absent</button>
                </div>
              )}
            </div>
            {selectedClass && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => String(s.classId) === String(selectedClass)).map((student) => {
                    const record = attendanceRecords.find(r => r.studentId === student.id);
                    return (
                      <tr key={student.id}>
                        <td>{student.rollNumber}</td>
                        <td>{displayNameFrom(student)}</td>
                        <td>
                          <span className={`status ${record?.status || 'pending'}`}>
                            {record?.status || 'Not Marked'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="present-btn"
                            onClick={() => handleMarkAttendance(student.id, 'present')}
                          >
                            Present
                          </button>
                          <button 
                            className="absent-btn"
                            onClick={() => handleMarkAttendance(student.id, 'absent')}
                          >
                            Absent
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Exams Tab */}
        {activeTab === 'exams' && (
          <div className="admin-content">
            <div className="content-header">
              <h2>Exams & Marks</h2>
              {(user?.role === 'admin' || user?.role === 'teacher') && (
                <button className="add-btn" onClick={() => openModal('exam')}>+ Create Exam</button>
              )}
            </div>
            <div className="exam-list">
              {exams.length > 0 ? exams.map(exam => (
                <div key={exam.id} className="exam-card">
                  <h3>{exam.title}</h3>
                  <p>Subject: {exam.subject?.name ?? '—'}</p>
                  <p>Class: {exam.class?.name ?? '—'}</p>
                  <p>Date: {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : '—'}</p>
                  <p>Total Marks: {exam.totalMarks}</p>
                  {(user?.role === 'teacher' || user?.role === 'admin') && (
                    <button onClick={async () => {
                      const res = await getExamResults(exam.id);
                      setMarks(res.data?.marks || []);
                    }}>
                      Enter/View Marks
                    </button>
                  )}
                </div>
              )) : <p>No exams scheduled</p>}
            </div>
            {marks.length > 0 && (
              <div className="marks-section">
                <h3>Marks for Selected Exam</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Marks</th>
                      {(user?.role === 'teacher' || user?.role === 'admin') && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter(s => marks[0]?.exam?.classId === s.classId).map(student => {
                      const mark = marks.find(m => m.studentId === student.id);
                      return (
                        <tr key={student.id}>
                          <td>{student.rollNumber}</td>
                          <td>{displayNameFrom(student)}</td>
                          <td>{mark?.marksObtained ?? mark?.mark ?? '—'}</td>
                          {(user?.role === 'teacher' || user?.role === 'admin') && (
                            <td>
                              <input 
                                type="number" 
                                placeholder="Enter marks"
                                defaultValue={mark?.marksObtained ?? mark?.mark}
                                onBlur={(e) => handleEnterMarks(exams[0]?.id, student.id, e.target.value)}
                              />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Fees Tab */}
        {activeTab === 'fees' && user?.role === 'admin' && (
          <div className="admin-content">
            <div className="content-header">
              <h2>Fee Management</h2>
              <button className="add-btn" onClick={() => openModal('fee')}>+ Create Fee</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.length > 0 ? fees.map(fee => (
                  <tr key={fee.id}>
                    <td>{displayNameFrom(fee.student)}</td>
                    <td>{classNameFrom(fee.student)}</td>
                    <td>${fee.amount}</td>
                    <td>{new Date(fee.dueDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`status ${fee.status}`}>{fee.status}</span>
                    </td>
                    <td>
                      <button onClick={() => {
                        const amount = prompt('Enter payment amount:');
                        if (amount) handleRecordPayment(fee.id, amount);
                      }}>
                        Record Payment
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6">No fees created yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Timetable Tab */}
        {activeTab === 'timetable' && (
          <div className="admin-content">
            <div className="content-header">
              <h2>Timetable</h2>
              {user?.role === 'admin' && (
                <button className="add-btn" onClick={() => openModal('timetable')}>+ Add Slot</button>
              )}
            </div>
            <div className="filter-bar">
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {selectedClass && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    {user?.role === 'admin' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {timetables.map(slot => (
                    <tr key={slot.id}>
                      <td>{slot.dayOfWeek}</td>
                      <td>{slot.startTime} - {slot.endTime}</td>
                      <td>{slot.subject?.name}</td>
                      <td>{displayNameFrom(slot.teacher)}</td>
                      {user?.role === 'admin' && (
                        <td>
                          <button onClick={() => openModal('timetable', slot)}>Edit</button>
                          <button className="delete-btn" onClick={() => handleDelete('timetable', slot.id)}>Delete</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {timetables.length === 0 && (
                    <tr>
                      <td colSpan="5">No timetable entries</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && user?.role === 'admin' && (
          <div className="admin-content">
            <div className="content-header">
              <h2>Send Announcement</h2>
              <button className="add-btn" onClick={() => openModal('notification')}>+ New Announcement</button>
            </div>
            <div className="notifications-list">
              {notifications.map((notif) => (
                <div key={notif.id} className="notification-card">
                  <h4>{notif.title}</h4>
                  <p>{notif.message}</p>
                  <span className="date">{new Date(notif.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
              {notifications.length === 0 && <p>No notifications</p>}
            </div>
          </div>
        )}

        {/* Teacher: My Classes Tab */}
        {activeTab === 'my_classes' && user?.role === 'teacher' && (
          <div className="admin-content">
            <h2>My Classes</h2>
            <div className="filter-bar">
              <select 
                value={selectedTeacherClass} 
                onChange={(e) => setSelectedTeacherClass(e.target.value)}
              >
                <option value="">All My Classes</option>
                {teacherClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="class-grid">
              {(selectedTeacherClass ? classes.filter(c => c.name === selectedTeacherClass) : classes).map((cls) => (
                <div key={cls.id} className="class-card">
                  <h3>{cls.name}</h3>
                  <p>Section: {cls.section || 'N/A'}</p>
                  <p>Students: {students.filter(s => String(s.classId) === String(cls.id)).length}</p>
                  <div className="class-actions">
                    <button onClick={() => { setSelectedClass(String(cls.id)); setActiveTab('attendance'); }}>
                      Take Attendance
                    </button>
                    <button onClick={() => { setSelectedClass(String(cls.id)); setActiveTab('exams'); }}>
                      Enter Marks
                    </button>
                  </div>
                </div>
              ))}
              {classes.length === 0 && <p>No classes assigned</p>}
            </div>
          </div>
        )}

        {/* Student: My Attendance Tab */}
        {activeTab === 'myAttendance' && user?.role === 'student' && (
          <div className="admin-content">
            <h2>My Attendance</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Days</h3>
                <p className="stat-number">{myAttendance.length}</p>
              </div>
              <div className="stat-card">
                <h3>Present</h3>
                <p className="stat-number">{myAttendance.filter(a => normalizeAttendanceStatus(a.status) === 'present').length}</p>
              </div>
              <div className="stat-card">
                <h3>Absent</h3>
                <p className="stat-number">{myAttendance.filter(a => normalizeAttendanceStatus(a.status) === 'absent').length}</p>
              </div>
              <div className="stat-card">
                <h3>Attendance Rate</h3>
                <p className="stat-number">
                  {myAttendance.length > 0 
                    ? Math.round((myAttendance.filter(a => ['present', 'late', 'excused'].includes(normalizeAttendanceStatus(a.status))).length / myAttendance.length) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Class</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myAttendance.map((record, index) => {
                  const st = normalizeAttendanceStatus(record.status);
                  return (
                  <tr key={record.id ?? index}>
                    <td>{record.date ? new Date(record.date).toLocaleDateString() : '—'}</td>
                    <td>{record.class?.name ?? '—'}</td>
                    <td>
                      <span className={`status ${st}`}>{attendanceStatusLabel(record.status)}</span>
                    </td>
                  </tr>
                  );
                })}
                {myAttendance.length === 0 && (
                  <tr><td colSpan="3">No attendance records</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Student: My Results Tab */}
        {activeTab === 'myResults' && user?.role === 'student' && (
          <div className="admin-content">
            <h2>My Results</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Exams</h3>
                <p className="stat-number">{myResults.length}</p>
              </div>
              <div className="stat-card">
                <h3>Average Marks</h3>
                <p className="stat-number">
                  {myResults.length > 0 
                    ? Math.round(myResults.reduce((sum, r) => sum + markScore(r), 0) / myResults.length) 
                    : 0}
                </p>
              </div>
              <div className="stat-card">
                <h3>Highest Marks</h3>
                <p className="stat-number">
                  {myResults.length > 0 ? Math.max(...myResults.map(r => markScore(r))) : 0}
                </p>
              </div>
              <div className="stat-card">
                <h3>Grade</h3>
                <p className="stat-number">
                  {myResults.length > 0 
                    ? (() => {
                        const avg = myResults.reduce((sum, r) => sum + markScore(r), 0) / myResults.length;
                        return avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : avg >= 60 ? 'D' : 'F';
                      })() 
                    : 'N/A'}
                </p>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Marks</th>
                  <th>Total Marks</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {myResults.map((result, index) => {
                  const score = result.marksObtained != null ? Number(result.marksObtained) : Number(result.mark) || 0;
                  const total = result.exam?.totalMarks ?? result.totalMarks ?? 100;
                  return (
                  <tr key={index}>
                    <td>{result.exam?.title ?? '—'}</td>
                    <td>{result.exam?.subject?.name ?? '—'}</td>
                    <td>{score}</td>
                    <td>{total}</td>
                    <td>
                      <span className={`status ${score >= 60 ? 'present' : 'absent'}`}>
                        {score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'}
                      </span>
                    </td>
                  </tr>
                  );
                })}
                {myResults.length === 0 && (
                  <tr><td colSpan="5">No results available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Student: My Fees Tab */}
        {activeTab === 'myFees' && user?.role === 'student' && (
          <div className="admin-content">
            <h2>My Fees</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Fee</h3>
                <p className="stat-number">${myFees.reduce((sum, f) => sum + (f.amount || 0), 0)}</p>
              </div>
              <div className="stat-card">
                <h3>Total Paid</h3>
                <p className="stat-number">${myFees.reduce((sum, f) => sum + (f.paidAmount || 0), 0)}</p>
              </div>
              <div className="stat-card">
                <h3>Balance</h3>
                <p className="stat-number">
                  ${myFees.reduce((sum, f) => sum + (f.amount || 0), 0) - myFees.reduce((sum, f) => sum + (f.paidAmount || 0), 0)}
                </p>
              </div>
              <div className="stat-card">
                <h3>Status</h3>
                <p className="stat-number">
                  {myFees.every(f => f.status === 'paid') ? 'Paid' : 'Pending'}
                </p>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fee Type</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Paid Amount</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {myFees.map((fee, index) => (
                  <tr key={index}>
                    <td>Tuition Fee</td>
                    <td>${fee.amount}</td>
                    <td>{new Date(fee.dueDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`status ${fee.status}`}>{fee.status}</span>
                    </td>
                    <td>${fee.paidAmount || 0}</td>
                    <td>${(fee.amount || 0) - (fee.paidAmount || 0)}</td>
                  </tr>
                ))}
                {myFees.length === 0 && (
                  <tr><td colSpan="6">No fee records</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? 'Edit' : 'Add'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h3>
            <form onSubmit={handleSubmit}>
              {modalType === 'student' && (
                <>
                  <input
                    type="text"
                    placeholder="First Name *"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name *"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password (default: student123)"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <select
                    value={formData.className || ''}
                    onChange={(e) => setFormData({...formData, className: e.target.value})}
                    required
                  >
                    <option value="">Select Class *</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Roll Number *"
                    value={formData.rollNumber || ''}
                    onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Student ID (optional - auto-generated if empty)"
                    value={formData.studentId || ''}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  />
                  <input
                    type="date"
                    placeholder="Date of Birth"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Guardian Name"
                    value={formData.guardianName || ''}
                    onChange={(e) => setFormData({...formData, guardianName: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Guardian Phone"
                    value={formData.guardianPhone || ''}
                    onChange={(e) => setFormData({...formData, guardianPhone: e.target.value})}
                  />
                </>
              )}
              {modalType === 'teacher' && (
                <>
                  <input
                    type="text"
                    placeholder="First Name *"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name *"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password (default: teacher123)"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Department *"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Qualification"
                    value={formData.qualification || ''}
                    onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Experience (years)"
                    value={formData.experience || ''}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  />
                </>
              )}
              {modalType === 'exam' && (
                <>
                  <input
                    type="text"
                    placeholder="Exam Name *"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Subject *"
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                  <input
                    type="date"
                    placeholder="Date *"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                  <select
                    value={formData.className || ''}
                    onChange={(e) => setFormData({...formData, className: e.target.value})}
                    required
                  >
                    <option value="">Select Class *</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <input
                    type="number"
                    placeholder="Total Marks"
                    value={formData.totalMarks || ''}
                    onChange={(e) => setFormData({...formData, totalMarks: e.target.value})}
                  />
                </>
              )}
              {modalType === 'fee' && (
                <>
                  <select
                    value={formData.studentId || ''}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                    required
                  >
                    <option value="">Select Student *</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {displayNameFrom(student)} (ID: {student.id})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Amount *"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                  <input
                    type="date"
                    placeholder="Due Date *"
                    value={formData.dueDate || ''}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </>
              )}
              {modalType === 'timetable' && (
                <>
                  <select
                    value={formData.day || ''}
                    onChange={(e) => setFormData({...formData, day: e.target.value})}
                    required
                  >
                    <option value="">Select Day *</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                  <input
                    type="time"
                    placeholder="Start Time *"
                    value={formData.startTime || ''}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required
                  />
                  <input
                    type="time"
                    placeholder="End Time *"
                    value={formData.endTime || ''}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Subject *"
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                  <select
                    value={formData.className || ''}
                    onChange={(e) => setFormData({...formData, className: e.target.value})}
                    required
                  >
                    <option value="">Select Class *</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </>
              )}
              {modalType === 'class' && (
                <>
                  <input
                    type="text"
                    placeholder="Class Name (e.g., Grade 10)"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Section (e.g., A)"
                    value={formData.section || ''}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Room Number"
                    value={formData.roomNumber || ''}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="Capacity"
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Academic Year (e.g., 2024-2025)"
                    value={formData.academicYear || ''}
                    onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                  />
                </>
              )}
              {modalType === 'notification' && (
                <>
                  <input
                    type="text"
                    placeholder="Title *"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                  <textarea
                    placeholder="Message *"
                    value={formData.message || ''}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                  />
                  <select
                    value={formData.type || 'general'}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="general">General</option>
                    <option value="urgent">Urgent</option>
                    <option value="event">Event</option>
                  </select>
                </>
              )}
              <div className="modal-actions">
                <button type="submit" className="save-btn">Save</button>
                <button type="button" onClick={closeModal} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
