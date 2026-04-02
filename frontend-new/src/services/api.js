import axios from 'axios';
import toast from 'react-hot-toast';

// ==========================================
// 🔧 PRODUCTION READY: Hardcoded Railway URL
// ==========================================
// Testing ke liye hardcoded URL - Environment variable baad mein wapas lagana

const RAILWAY_API_URL = 'https://skillsmind-lms-project-production.up.railway.app/api';

const API = axios.create({
    baseURL: RAILWAY_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

// ==========================================
// Request Interceptor
// ==========================================
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || 
                       localStorage.getItem('authToken') || 
                       localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Console log for debugging
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ==========================================
// Response Interceptor
// ==========================================
API.interceptors.response.use(
    (response) => {
        console.log(`✅ API Success: ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('🔴 API Error:', error.message);
        
        // 401 Unauthorized
        if (error.response?.status === 401) {
            const errorMessage = error.response?.data?.message || '';
            
            const isTokenExpired = 
                errorMessage.toLowerCase().includes('expired') || 
                errorMessage.toLowerCase().includes('jwt expired') ||
                errorMessage.toLowerCase().includes('token expired') ||
                errorMessage.toLowerCase().includes('authorization denied') ||
                errorMessage.toLowerCase().includes('no token') ||
                errorMessage.toLowerCase().includes('invalid token');
            
            if (isTokenExpired) {
                toast.error('Session expired. Please login again.', {
                    duration: 4000,
                    position: 'top-center'
                });
                
                localStorage.removeItem('token');
                localStorage.removeItem('authToken');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                localStorage.removeItem('studentId');
                
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
                
                return Promise.reject(error);
            }
            
            toast.error('Please login to continue', {
                duration: 3000,
                position: 'top-center'
            });
            
            localStorage.clear();
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        }
        
        // 403 Forbidden
        if (error.response?.status === 403) {
            toast.error('Access denied. You do not have permission.', {
                duration: 3000,
                position: 'top-center'
            });
        }
        
        // 404 Not Found
        if (error.response?.status === 404) {
            console.warn('🔴 404 Error: Resource not found', error.config?.url);
        }
        
        // Network error / Server down
        if (!error.response) {
            toast.error('Cannot connect to server! Please try again.', {
                duration: 3000,
                position: 'top-center'
            });
        }
        
        // 500 Server Error
        if (error.response?.status >= 500) {
            toast.error('Server error! Please try again later.', {
                duration: 3000,
                position: 'top-center'
            });
        }
        
        return Promise.reject(error);
    }
);

// ================= ADMIN APIs =================
export const adminAPI = {
    // Assignments
    createAssignment: (data) => API.post('/assignments', data),
    getAllAssignments: () => API.get('/assignments'),
    
    // Zoom Live Class APIs (Admin)
    createZoomMeeting: (scheduleId) => API.post(`/zoom/create-meeting/${scheduleId}`),
    startZoomMeeting: (meetingId) => API.post(`/zoom/start-meeting/${meetingId}`),
    endZoomMeeting: (meetingId) => API.post(`/zoom/end-meeting/${meetingId}`),
    getZoomParticipants: (meetingId) => API.get(`/zoom/participants/${meetingId}`),
    getZoomMeetingDetails: (scheduleId) => API.get(`/zoom/meeting-by-schedule/${scheduleId}`),
    checkZoomMeeting: (scheduleId) => API.get(`/zoom/check-meeting/${scheduleId}`),
    getAllZoomMeetings: () => API.get('/zoom/meetings'),
    
    // Attendance System APIs (Admin)
    getCourseAttendance: (courseId, date) => API.get(`/attendance/course/${courseId}?date=${date}`),
    getAttendanceReport: (courseId, params) => API.get(`/attendance/report/${courseId}`, { params }),
    updateAttendance: (attendanceId, data) => API.put(`/attendance/${attendanceId}`, data),
    getStudentAttendanceDetails: (studentId, courseId) => API.get(`/attendance/student/${studentId}/course/${courseId}`),
    getLiveAttendance: (meetingId) => API.get(`/attendance/live/${meetingId}`),
    
    // Quiz Management APIs
    createQuiz: (data) => API.post('/quizzes', data),
    getAllQuizzes: () => API.get('/quizzes'),
    updateQuiz: (quizId, data) => API.put(`/quizzes/${quizId}`, data),
    deleteQuiz: (quizId) => API.delete(`/quizzes/${quizId}`),
    toggleQuizStatus: (quizId, status) => API.patch(`/quizzes/${quizId}/status`, { status }),
    getQuizSubmissions: (quizId) => API.get(`/quizzes/${quizId}/submissions`),
    
    // Quiz Report & Result APIs
    getQuizReport: (quizId) => API.get(`/quizzes/${quizId}/report`),
    downloadResultPDF: (quizId, studentId) => 
        API.get(`/quizzes/${quizId}/result-pdf/${studentId}`, {
            responseType: 'blob'
        }),
    sendResultEmail: (quizId, studentId) => 
        API.post(`/quizzes/${quizId}/send-result`, { studentId }),
    
    // Schedule Management APIs
    getSchedules: () => API.get('/schedules'),
    getSchedule: (id) => API.get(`/schedules/${id}`),
    createSchedule: (data) => API.post('/schedules', data),
    updateSchedule: (id, data) => API.put(`/schedules/${id}`, data),
    deleteSchedule: (id) => API.delete(`/schedules/${id}`),
    getBatchSchedules: (batchId) => API.get(`/schedules/batch/${batchId}`),
    getSchedulesByCourse: (courseId) => API.get(`/schedules/course/${courseId}`),
    createBatchSchedule: (data) => API.post('/schedules/batch-create', data),
    
    // Week Update API (Fixed for Edit Week functionality)
    updateWeekSchedules: (courseId, weekNumber, data) => 
        API.post(`/schedules/week-update/${courseId}/${weekNumber}`, data),
    
    // Get Week Schedules (for Edit Week)
    getWeekSchedules: (courseId, weekNumber) => 
        API.get(`/schedules/course/${courseId}/week/${weekNumber}`),
    
    deleteBatch: (batchId) => API.delete(`/schedules/batch/${batchId}`),
    
    // Schedule Conflict Check API
    checkScheduleConflict: (data) => API.post('/schedules/check-conflict', data),
    
    // Get Upcoming Schedules for Dashboard
    getUpcomingSchedules: () => API.get('/schedules/dashboard/upcoming'),
    
    getCourses: () => API.get('/courses/for-assignments'),
    getCourseStudents: (courseId) => API.get(`/courses/${courseId}/students`),

    // Notices (Old - Announcements)
    createNotice: (data) => API.post('/announcements', data),
    getEnrolledStudents: (courseId) => API.get(`/courses/${courseId}/students`),
    
    // IMPORTANT LINKS - ADMIN APIs
    createImportantLink: (data) => API.post('/important-links', data),
    getAllImportantLinks: () => API.get('/important-links'),
    updateImportantLink: (id, data) => API.put(`/important-links/${id}`, data),
    deleteImportantLink: (id) => API.delete(`/important-links/${id}`),
    
    // NOTICES BOARD - ADMIN APIs
    getNoticeCourses: () => API.get('/notices/courses'),
    createNoticeBoard: (data) => API.post('/notices', data),
    getAllNotices: () => API.get('/notices'),
    updateNotice: (id, data) => API.put(`/notices/${id}`, data),
    deleteNotice: (id) => API.delete(`/notices/${id}`),
    
    // JOBS & INTERNSHIPS - ADMIN APIs
    createJob: (data) => API.post('/jobs', data),
    getAllJobs: () => API.get('/jobs'),
    getJob: (id) => API.get(`/jobs/${id}`),
    updateJob: (id, data) => API.put(`/jobs/${id}`, data),
    deleteJob: (id) => API.delete(`/jobs/${id}`),
    getJobsByCourse: (courseId) => API.get(`/jobs/course/${courseId}`),
    getJobsByType: (type) => API.get(`/jobs/type/${type}`)
};

// ================= STUDENT APIs =================
export const studentAPI = {
    // Student ki enrollments
    getMyCourses: (studentId) => API.get(`/student-courses/${studentId}`),
    
    // Assignments
    getMyAssignments: (studentId) => API.get(`/assignments/student/${studentId}`),
    submitAssignment: (assignmentId, data) => 
        API.post(`/assignments/${assignmentId}/submit`, data),
    
    // Zoom Live Class APIs (Student)
    getZoomMeeting: (scheduleId) => API.get(`/zoom/student-meeting/${scheduleId}`),
    joinZoomMeeting: (scheduleId) => API.post(`/zoom/join-meeting/${scheduleId}`),
    leaveZoomMeeting: (scheduleId) => API.post(`/zoom/leave-meeting/${scheduleId}`),
    
    // Attendance APIs (Student)
    getMyAttendance: (studentId, params = {}) => {
        const { range, courseId, month, year } = params;
        const queryParams = new URLSearchParams();
        
        if (range) queryParams.append('range', range);
        if (courseId && courseId !== 'all') queryParams.append('courseId', courseId);
        if (month) queryParams.append('month', month);
        if (year) queryParams.append('year', year);
        
        const queryString = queryParams.toString();
        return API.get(`/attendance/student/${studentId}${queryString ? '?' + queryString : ''}`);
    },
    
    // Mark attendance attempt (when student clicks join)
    markAttendanceAttempt: (scheduleId) => API.post('/attendance/mark-attempt', { scheduleId }),
    
    // Get attendance status for specific schedule
    getAttendanceStatus: (scheduleId) => API.get(`/attendance/status/${scheduleId}`),
    
    // Student Schedule APIs
    getMySchedules: () => API.get('/schedules/my-schedules/student'),
    getCourseSchedule: (courseId) => API.get(`/schedules/course/${courseId}`),
    
    // Quizzes
    getMyQuizzes: () => API.get('/quizzes/my-quizzes'),
    startQuiz: (quizId) => API.get(`/quizzes/${quizId}/take`),
    submitQuiz: (quizId, data) => API.post(`/quizzes/${quizId}/submit`, data),
    getMyResults: () => API.get('/quizzes/my-results'),
    
    // Notices (Old)
    getMyNotices: (studentId) => API.get(`/announcements/student/${studentId}`),
    
    // Notes
    getMyNotes: (studentId) => API.get(`/notes/student/${studentId}`),
    createNote: (data) => API.post('/notes', data),
    updateNote: (noteId, data) => API.put(`/notes/${noteId}`, data),
    deleteNote: (noteId) => API.delete(`/notes/${noteId}`),
    
    // IMPORTANT LINKS - STUDENT APIs
    getMyImportantLinks: () => API.get('/important-links/student/my-links'),
    getImportantLinksByCourse: (courseId) => API.get(`/important-links/course/${courseId}`),
    
    // NOTICES BOARD - STUDENT APIs
    getMyNoticesBoard: () => API.get('/notices/student/my-notices'),
    markNoticeAsRead: (id) => API.put(`/notices/${id}/read`),
    
    // JOBS & INTERNSHIPS - STUDENT APIs
    getMyJobs: () => API.get('/student-dashboard/jobs'),
    getAvailableJobs: () => API.get('/jobs/student/available'),
    getJobsByType: (type) => API.get(`/jobs/student/by-type/${type}`),
    markJobAsViewed: (id) => API.put(`/jobs/${id}/view`)
};

// STANDALONE NOTICES API
export const noticesAPI = {
    getAllNotices: () => API.get('/notices'),
    createNotice: (data) => API.post('/notices', data),
    updateNotice: (id, data) => API.put(`/notices/${id}`, data),
    deleteNotice: (id) => API.delete(`/notices/${id}`),
    getNoticeCourses: () => API.get('/notices/courses'),
    getMyNotices: () => API.get('/notices/student/my-notices'),
    markAsRead: (id) => API.put(`/notices/${id}/read`)
};

// STANDALONE JOBS API
export const jobsAPI = {
    createJob: (data) => API.post('/jobs', data),
    getAllJobs: () => API.get('/jobs'),
    getJob: (id) => API.get(`/jobs/${id}`),
    updateJob: (id, data) => API.put(`/jobs/${id}`, data),
    deleteJob: (id) => API.delete(`/jobs/${id}`),
    getJobsByCourse: (courseId) => API.get(`/jobs/course/${courseId}`),
    getJobsByType: (type) => API.get(`/jobs/type/${type}`),
    getMyJobs: () => API.get('/student-dashboard/jobs'),
    getAvailableJobs: () => API.get('/jobs/student/available'),
    getStudentJobsByType: (type) => API.get(`/jobs/student/by-type/${type}`),
    markAsViewed: (id) => API.put(`/jobs/${id}/view`)
};

// ZOOM API (Standalone)
export const zoomAPI = {
    // Admin
    createMeeting: (scheduleId) => API.post(`/zoom/create-meeting/${scheduleId}`),
    startMeeting: (meetingId) => API.post(`/zoom/start-meeting/${meetingId}`),
    endMeeting: (meetingId) => API.post(`/zoom/end-meeting/${meetingId}`),
    getParticipants: (meetingId) => API.get(`/zoom/participants/${meetingId}`),
    getMeetingDetails: (meetingId) => API.get(`/zoom/meeting/${meetingId}`),
    getAllMeetings: () => API.get('/zoom/meetings'),
    
    // Student
    getStudentMeeting: (scheduleId) => API.get(`/zoom/student-meeting/${scheduleId}`),
    joinMeeting: (scheduleId) => API.post(`/zoom/join-meeting/${scheduleId}`),
    leaveMeeting: (scheduleId) => API.post(`/zoom/leave-meeting/${scheduleId}`),
    
    // Webhook (Server-side only)
    handleWebhook: (data) => API.post('/zoom/webhook', data)
};

// ATTENDANCE API (Standalone)
export const attendanceAPI = {
    // Student
    getMyAttendance: (studentId, params) => {
        const queryParams = new URLSearchParams();
        if (params?.range) queryParams.append('range', params.range);
        if (params?.courseId && params.courseId !== 'all') queryParams.append('courseId', params.courseId);
        
        const queryString = queryParams.toString();
        return API.get(`/attendance/student/${studentId}${queryString ? '?' + queryString : ''}`);
    },
    getMyStats: () => API.get('/attendance/my-stats'),
    markAttempt: (scheduleId) => API.post('/attendance/mark-attempt', { scheduleId }),
    getStatus: (scheduleId) => API.get(`/attendance/status/${scheduleId}`),
    
    // Admin
    getCourseAttendance: (courseId, date) => API.get(`/attendance/course/${courseId}?date=${date}`),
    getReport: (courseId, params) => API.get(`/attendance/report/${courseId}`, { params }),
    updateAttendance: (attendanceId, data) => API.put(`/attendance/${attendanceId}`, data),
    getStudentDetails: (studentId, courseId) => API.get(`/attendance/student/${studentId}/course/${courseId}`),
    getLiveAttendance: (meetingId) => API.get(`/attendance/live/${meetingId}`)
};

// SCHEDULE API (Standalone)
export const scheduleAPI = {
    // Admin
    getAll: () => API.get('/schedules'),
    getById: (id) => API.get(`/schedules/${id}`),
    create: (data) => API.post('/schedules', data),
    update: (id, data) => API.put(`/schedules/${id}`, data),
    delete: (id) => API.delete(`/schedules/${id}`),
    
    // Batch operations
    createBatch: (data) => API.post('/schedules/batch-create', data),
    getBatch: (batchId) => API.get(`/schedules/batch/${batchId}`),
    deleteBatch: (batchId) => API.delete(`/schedules/batch/${batchId}`),
    
    // Week Update (for Edit Week functionality)
    updateWeek: (courseId, weekNumber, data) => 
        API.post(`/schedules/week-update/${courseId}/${weekNumber}`, data),
    
    // Get Week Schedules
    getWeekSchedules: (courseId, weekNumber) => 
        API.get(`/schedules/course/${courseId}/week/${weekNumber}`),
    
    // Course specific
    getByCourse: (courseId) => API.get(`/schedules/course/${courseId}`),
    
    // Conflict Check
    checkConflict: (data) => API.post('/schedules/check-conflict', data),
    
    // Upcoming for Dashboard
    getUpcoming: () => API.get('/schedules/dashboard/upcoming'),
    
    // Student
    getMySchedules: () => API.get('/schedules/my-schedules/student')
};

export default API;