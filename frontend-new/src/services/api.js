import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Request Interceptor - Token add kare har request mein
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 🔥 FIXED: Response Interceptor - Token expire check kare
API.interceptors.response.use(
    (response) => response,
    (error) => {
        // Agar 401 error hai (Unauthorized) ya token expired hai
        if (error.response?.status === 401) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || '';
            
            console.log('🔴 401 Error:', errorMessage);
            
            // Check karein ke error token expired ka hai ya nahi
            const isTokenExpired = 
                errorMessage.toLowerCase().includes('expired') || 
                errorMessage.toLowerCase().includes('jwt expired') ||
                errorMessage.toLowerCase().includes('token expired') ||
                errorMessage.toLowerCase().includes('token is not valid') ||
                errorMessage.toLowerCase().includes('authorization denied');
            
            if (isTokenExpired) {
                console.log('🔴 Token Expired/Invalid! Logging out...');
                
                // Toast notification dikhaein
                toast.error('Your session has expired. Please login again.', {
                    duration: 4000,
                    position: 'top-center',
                    style: {
                        border: '1px solid #E30613',
                        padding: '16px',
                        color: '#000B29',
                        background: '#ffffff',
                        borderRadius: '8px',
                        fontWeight: '600'
                    }
                });
                
                // LocalStorage clear karein
                localStorage.removeItem('token');
                localStorage.removeItem('authToken');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                localStorage.removeItem('studentId');
                
                // 🔥 Redirect to login page
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500); // 1.5 second baad redirect taake toast dikhe
                
                return Promise.reject(error);
            }
            
            // Agar sirf 401 hai (token invalid ya missing) - Generic case
            toast.error('Please login to continue', {
                duration: 3000,
                position: 'top-center'
            });
            
            // Clear storage
            localStorage.clear();
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        }
        
        // Network errors
        if (!error.response) {
            toast.error('Network error! Please check your connection.', {
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
    
    // Attendance
    markAttendance: (data) => API.post('/attendance/mark', data),
    getAttendanceByCourse: (courseId, date) => 
        API.get(`/attendance/${courseId}?date=${date}`),
    
    // 🔥 Quiz Management APIs
    createQuiz: (data) => API.post('/quizzes', data),
    getAllQuizzes: () => API.get('/quizzes'),
    updateQuiz: (quizId, data) => API.put(`/quizzes/${quizId}`, data),
    deleteQuiz: (quizId) => API.delete(`/quizzes/${quizId}`),
    toggleQuizStatus: (quizId, status) => API.patch(`/quizzes/${quizId}/status`, { status }),
    getQuizSubmissions: (quizId) => API.get(`/quizzes/${quizId}/submissions`),
    
    // 🔥 Quiz Report & Result APIs
    getQuizReport: (quizId) => API.get(`/quizzes/${quizId}/report`),
    downloadResultPDF: (quizId, studentId) => 
        API.get(`/quizzes/${quizId}/result-pdf/${studentId}`, {
            responseType: 'blob' // Important for PDF download
        }),
    sendResultEmail: (quizId, studentId) => 
        API.post(`/quizzes/${quizId}/send-result`, { studentId }),
    
    // 🔥 NEW: Schedule Management APIs
    getSchedules: () => API.get('/schedules'),
    getSchedule: (id) => API.get(`/schedules/${id}`),
    createSchedule: (data) => API.post('/schedules', data),
    updateSchedule: (id, data) => API.put(`/schedules/${id}`, data),
    deleteSchedule: (id) => API.delete(`/schedules/${id}`),
    
    // 🔥 NEW: Batch Schedule APIs - Updated for week-wise structure
    createBatchSchedule: (data) => API.post('/schedules/batch-create', data),
    deleteBatch: (batchId) => API.delete(`/schedules/batch/${batchId}`),
    getBatchSchedules: (batchId) => API.get(`/schedules/batch/${batchId}`),
    
    // 🔥 NEW: Get Courses for dropdown
    getCourses: () => API.get('/courses/for-assignments'),
    
    // 🔥 NEW: Get students enrolled in a course
    getCourseStudents: (courseId) => API.get(`/courses/${courseId}/students`),
    
    // Notices
    createNotice: (data) => API.post('/announcements', data),
    
    // Get students by course (for dropdown)
    getEnrolledStudents: (courseId) => 
        API.get(`/courses/${courseId}/students`),
    
    // ==========================================
    // 🔥 NEW: DYNAMIC SYSTEM - ADMIN APIs
    // ==========================================
    
    // Important Links Management
    createImportantLink: (data) => API.post('/important-links', data),
    getAllImportantLinks: () => API.get('/important-links'),
    updateImportantLink: (id, data) => API.put(`/important-links/${id}`, data),
    deleteImportantLink: (id) => API.delete(`/important-links/${id}`),
    
    // Notice Board Management
    createNoticeBoard: (data) => API.post('/notices', data),
    getAllNotices: () => API.get('/notices'),
    updateNotice: (id, data) => API.put(`/notices/${id}`, data),
    deleteNotice: (id) => API.delete(`/notices/${id}`),
    
    // Jobs & Internships Management
    createJobInternship: (data) => API.post('/jobs-internships', data),
    getAllJobsInternships: () => API.get('/jobs-internships'),
    updateJobInternship: (id, data) => API.put(`/jobs-internships/${id}`, data),
    deleteJobInternship: (id) => API.delete(`/jobs-internships/${id}`)
};

// ================= STUDENT APIs =================
export const studentAPI = {
    // Student ki enrollments
    getMyCourses: (studentId) => API.get(`/student-courses/${studentId}`),
    
    // Assignments - SIRF meri courses ki
    getMyAssignments: (studentId) => API.get(`/assignments/student/${studentId}`),
    
    submitAssignment: (assignmentId, data) => 
        API.post(`/assignments/${assignmentId}/submit`, data),
    
    // Attendance - SIRF meri courses ki
    getMyAttendance: (studentId, month, year) => 
        API.get(`/attendance/student/${studentId}?month=${month}&year=${year}`),
    
    // Comprehensive Attendance Data
    getAttendance: (studentId, params = {}) => {
        const { range, courseId, month, year } = params;
        let queryParams = new URLSearchParams();
        
        if (range) queryParams.append('range', range);
        if (courseId && courseId !== 'all') queryParams.append('courseId', courseId);
        if (month) queryParams.append('month', month);
        if (year) queryParams.append('year', year);
        
        const queryString = queryParams.toString();
        return API.get(`/attendance/student/${studentId}${queryString ? '?' + queryString : ''}`);
    },
    
    // 🔥 NEW: Student Schedule APIs - WITH LINK VISIBILITY
    getMySchedules: () => API.get('/schedules/my-schedules/student'), // 🔥 Updated route
    getCourseSchedule: (courseId) => API.get(`/schedules/course/${courseId}`),
    
    // Quizzes - SIRF meri courses ke
    getMyQuizzes: () => API.get('/quizzes/my-quizzes'),
    startQuiz: (quizId) => API.get(`/quizzes/${quizId}/take`),
    submitQuiz: (quizId, data) => API.post(`/quizzes/${quizId}/submit`, data),
    
    // Results - SIRF mere
    getMyResults: () => API.get('/quizzes/my-results'),
    
    // Notices - JO mujhe relevant hain
    getMyNotices: (studentId) => API.get(`/announcements/student/${studentId}`),
    
    // Notes (Personal)
    getMyNotes: (studentId) => API.get(`/notes/student/${studentId}`),
    createNote: (data) => API.post('/notes', data),
    updateNote: (noteId, data) => API.put(`/notes/${noteId}`, data),
    deleteNote: (noteId) => API.delete(`/notes/${noteId}`),
    
    // ==========================================
    // 🔥 NEW: DYNAMIC SYSTEM - STUDENT APIs
    // ==========================================
    
    // Important Links - Student ke enrolled courses ke liye
    getMyImportantLinks: () => API.get('/important-links/student/my-links'),
    getImportantLinksByCourse: (courseId) => API.get(`/important-links/course/${courseId}`),
    
    // Notices - Student ke liye relevant
    getMyNoticesBoard: () => API.get('/notices/student/my-notices'),
    
    // Jobs & Internships - Student ke courses ke hisaab se
    getMyJobsInternships: () => API.get('/jobs-internships/student/my-jobs'),
    getJobsByType: (type) => API.get(`/jobs-internships/student/by-type/${type}`)
};

export default API;