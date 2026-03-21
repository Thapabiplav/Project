import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const login = (data) => api.post("/auth/login", data);
export const register = (data) => api.post("/auth/register", data);
export const getProfile = () => api.get("/auth/profile");

export const getStudents = (params) => api.get("/students", { params });
export const getStudent = (id) => api.get(`/students/${id}`);
export const createStudent = (data) => api.post("/students", data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

export const getTeachers = (params) => api.get("/teachers", { params });
export const getTeacher = (id) => api.get(`/teachers/${id}`);
export const createTeacher = (data) => api.post("/teachers", data);
export const updateTeacher = (id, data) => api.put(`/teachers/${id}`, data);
export const deleteTeacher = (id) => api.delete(`/teachers/${id}`);

export const markAttendance = (data) => api.post("/attendance", data);
export const markBulkAttendance = (data) => api.post("/attendance/bulk", data);
export const getStudentAttendance = (id, params) => api.get(`/attendance/student/${id}`, { params });
export const getClassAttendance = (id, params) => api.get(`/attendance/class/${id}`, { params });

export const getExams = (params) => api.get("/exams", { params });
export const getExam = (id) => api.get(`/exams/${id}`);
export const createExam = (data) => api.post("/exams", data);
export const enterMarks = (examId, data) => api.post(`/exams/${examId}/marks`, data);
export const getExamResults = (id) => api.get(`/exams/${id}/results`);
export const getStudentResults = (studentId, params) => api.get(`/exams/results/student/${studentId}`, { params });

export const getTimetables = (params) => api.get("/timetable", { params });
export const getClassTimetable = (classId, params) => api.get(`/timetable/class/${classId}`, { params });
export const createTimetable = (data) => api.post("/timetable", data);
export const updateTimetable = (id, data) => api.put(`/timetable/${id}`, data);
export const deleteTimetable = (id) => api.delete(`/timetable/${id}`);

export const getFees = (params) => api.get("/fees", { params });
export const getPendingFees = (params) => api.get("/fees/pending", { params });
export const createFee = (data) => api.post("/fees", data);
export const recordPayment = (id, data) => api.post(`/fees/${id}/payment`, data);
export const getStudentFees = (studentId) => api.get(`/fees/student/${studentId}`);

export const getNotifications = (params) => api.get("/notifications", { params });
export const markAsRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllAsRead = () => api.put("/notifications/read-all");
export const sendAnnouncement = (data) => api.post("/notifications/announcement", data);

export const getDashboardStats = () => api.get("/analytics/dashboard");
export const getEnrollmentStats = () => api.get("/analytics/enrollment");
export const getAttendanceStats = (params) => api.get("/analytics/attendance", { params });
export const getExamPerformance = (params) => api.get("/analytics/performance", { params });
export const getFeeStats = (params) => api.get("/analytics/fees", { params });
export const getMonthlyTrends = (params) => api.get("/analytics/trends", { params });

export const getClasses = (params) => api.get("/classes", { params });
export const getClass = (id) => api.get(`/classes/${id}`);
export const createClass = (data) => api.post("/classes", data);
export const updateClass = (id, data) => api.put(`/classes/${id}`, data);
export const deleteClass = (id) => api.delete(`/classes/${id}`);

export default api;