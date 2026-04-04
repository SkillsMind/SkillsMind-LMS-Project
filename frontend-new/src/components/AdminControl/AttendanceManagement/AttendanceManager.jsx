import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaClock,
  FaSearch, FaDownload, FaSave, FaUsers,
  FaGraduationCap, FaCalendarCheck, FaChartPie
} from 'react-icons/fa';
import './AttendanceManager.css';

const AttendanceManager = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [view, setView] = useState('mark');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE = '${import.meta.env.VITE_API_URL}/api';
  const toastStyle = {
    border: '1px solid #e31e24',
    padding: '16px',
    color: '#1e293b',
    background: '#ffffff',
    borderRadius: '12px'
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  
  useEffect(() => {
    fetchCourses();
    // Saved attendance load karo
    const saved = localStorage.getItem('skillsmind_attendance');
    if (saved) {
      setAttendanceRecords(JSON.parse(saved));
    }
  }, []);

  // ==========================================
  // FETCH COURSES (Dummy data se fallback)
  // ==========================================
  
  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/courses`);
      if (res.data && res.data.length > 0) {
        setCourses(res.data);
      } else {
        throw new Error('No courses');
      }
    } catch (err) {
      // Dummy courses jab tak API ready ni
      setCourses([
        { _id: 'course1', title: 'UI/UX Design' },
        { _id: 'course2', title: 'Web Development' },
        { _id: 'course3', title: 'Shopify Development' },
        { _id: 'course4', title: 'Digital Marketing' }
      ]);
    }
  };

  // ==========================================
  // LOAD STUDENTS (Real enrolled students)
  // ==========================================
  
  const loadStudents = async () => {
    if (!selectedCourse) {
      toast.error('Please select a course first!', { style: toastStyle });
      return;
    }

    setLoading(true);
    
    try {
      // API call try karo
      const res = await axios.get(`${API_BASE}/admin/students-by-course/${selectedCourse}`);
      
      if (res.data && res.data.length > 0) {
        setStudents(res.data);
        // Initialize attendance
        const initial = {};
        res.data.forEach(s => {
          initial[s._id] = 'present';
        });
        setAttendanceData(initial);
      } else {
        throw new Error('No students');
      }
    } catch (err) {
      // TEMPORARY: Dummy students for testing
      const dummyStudents = [
        { _id: 's1', name: 'Ahmad Khan', email: 'ahmad@email.com' },
        { _id: 's2', name: 'Sara Ali', email: 'sara@email.com' },
        { _id: 's3', name: 'Usman Tariq', email: 'usman@email.com' },
        { _id: 's4', name: 'Fatima Zahra', email: 'fatima@email.com' },
        { _id: 's5', name: 'Bilal Ahmed', email: 'bilal@email.com' }
      ];
      
      setStudents(dummyStudents);
      const initial = {};
      dummyStudents.forEach(s => {
        initial[s._id] = 'present';
      });
      setAttendanceData(initial);
      
      toast.success('Students loaded (Demo Mode)', { style: toastStyle });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLE ATTENDANCE CHANGE
  // ==========================================
  
  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // ==========================================
  // SAVE ATTENDANCE
  // ==========================================
  
  const handleSubmit = async () => {
    if (!selectedCourse || students.length === 0) {
      toast.error('No students to mark attendance!', { style: toastStyle });
      return;
    }

    const load = toast.loading('Saving attendance...', { style: toastStyle });

    try {
      const payload = {
        courseId: selectedCourse,
        courseName: courses.find(c => c._id === selectedCourse)?.title,
        date: selectedDate,
        records: Object.entries(attendanceData).map(([studentId, status]) => ({
          studentId,
          studentName: students.find(s => s._id === studentId)?.name,
          status
        }))
      };

      // API call (commented until ready)
      // await axios.post(`${API_BASE}/admin/attendance/mark`, payload);

      // Local save
      const newRecord = {
        _id: Date.now().toString(),
        ...payload,
        createdAt: new Date().toISOString()
      };
      
      const updated = [newRecord, ...attendanceRecords];
      setAttendanceRecords(updated);
      localStorage.setItem('skillsmind_attendance', JSON.stringify(updated));

      toast.success('Attendance saved successfully!', { id: load, style: toastStyle });
      
      // Reset
      setStudents([]);
      setAttendanceData({});
      setSelectedCourse('');
      
    } catch (err) {
      toast.error('Failed to save: ' + err.message, { id: load, style: toastStyle });
    }
  };

  // ==========================================
  // REPORT STATS
  // ==========================================
  
  const getStats = () => {
    const total = attendanceRecords.reduce((acc, rec) => acc + rec.records.length, 0);
    const present = attendanceRecords.reduce((acc, rec) => 
      acc + rec.records.filter(r => r.status === 'present').length, 0);
    const absent = attendanceRecords.reduce((acc, rec) => 
      acc + rec.records.filter(r => r.status === 'absent').length, 0);
    const late = attendanceRecords.reduce((acc, rec) => 
      acc + rec.records.filter(r => r.status === 'late').length, 0);
    
    return { total, present, absent, late, percentage: total ? Math.round((present + late) / total * 100) : 0 };
  };

  const stats = getStats();

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==========================================
  // MARK ATTENDANCE VIEW
  // ==========================================
  
  if (view === 'mark') {
    return (
      <div className="atm-container">
        <div className="atm-header">
          <div className="atm-header-title">
            <h1><FaCalendarCheck /> Mark Attendance</h1>
            <p>Record daily attendance for enrolled students</p>
          </div>
          <div className="atm-view-toggle">
            <button className="active">Mark Attendance</button>
            <button onClick={() => setView('report')}>View Reports</button>
          </div>
        </div>

        <div className="atm-controls">
          <div className="atm-control-group">
            <label><FaGraduationCap /> Select Course</label>
            <select 
              value={selectedCourse} 
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">Choose a course</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="atm-control-group">
            <label><FaCalendarAlt /> Date</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <button className="atm-btn-refresh" onClick={loadStudents}>
            <FaDownload /> Load Students
          </button>
        </div>

        {students.length > 0 && (
          <>
            <div className="atm-search-bar">
              <FaSearch />
              <input 
                type="text" 
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="atm-count">{filteredStudents.length} students</span>
            </div>

            <div className="atm-student-list">
              {filteredStudents.map(student => (
                <div key={student._id} className="atm-student-card">
                  <div className="atm-student-info">
                    <div className="atm-avatar">{student.name?.charAt(0)}</div>
                    <div className="atm-student-details">
                      <strong>{student.name}</strong>
                      <span>{student.email}</span>
                    </div>
                  </div>

                  <div className="atm-status-selector">
                    <button 
                      className={`atm-status-btn present ${attendanceData[student._id] === 'present' ? 'active' : ''}`}
                      onClick={() => handleAttendanceChange(student._id, 'present')}
                    >
                      <FaCheckCircle /> Present
                    </button>
                    <button 
                      className={`atm-status-btn absent ${attendanceData[student._id] === 'absent' ? 'active' : ''}`}
                      onClick={() => handleAttendanceChange(student._id, 'absent')}
                    >
                      <FaTimesCircle /> Absent
                    </button>
                    <button 
                      className={`atm-status-btn late ${attendanceData[student._id] === 'late' ? 'active' : ''}`}
                      onClick={() => handleAttendanceChange(student._id, 'late')}
                    >
                      <FaClock /> Late
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="atm-submit-bar">
              <div className="atm-summary">
                Present: {Object.values(attendanceData).filter(v => v === 'present').length} | 
                Absent: {Object.values(attendanceData).filter(v => v === 'absent').length} | 
                Late: {Object.values(attendanceData).filter(v => v === 'late').length}
              </div>
              <button className="atm-btn-save" onClick={handleSubmit}>
                <FaSave /> Save Attendance
              </button>
            </div>
          </>
        )}

        {loading && (
          <div className="atm-loading">
            <div className="atm-spinner"></div>
            <p>Loading students...</p>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // REPORT VIEW
  // ==========================================
  
  return (
    <div className="atm-container">
      <div className="atm-header">
        <div className="atm-header-title">
          <h1><FaChartPie /> Attendance Reports</h1>
          <p>View and analyze attendance records</p>
        </div>
        <div className="atm-view-toggle">
          <button onClick={() => setView('mark')}>Mark Attendance</button>
          <button className="active">View Reports</button>
        </div>
      </div>

      {attendanceRecords.length > 0 && (
        <div className="atm-stats-grid">
          <div className="atm-stat-card">
            <span className="atm-stat-value">{stats.total}</span>
            <span className="atm-stat-label">Total Records</span>
          </div>
          <div className="atm-stat-card present">
            <span className="atm-stat-value">{stats.present}</span>
            <span className="atm-stat-label">Present</span>
          </div>
          <div className="atm-stat-card absent">
            <span className="atm-stat-value">{stats.absent}</span>
            <span className="atm-stat-label">Absent</span>
          </div>
          <div className="atm-stat-card late">
            <span className="atm-stat-value">{stats.late}</span>
            <span className="asm-stat-label">Late</span>
          </div>
        </div>
      )}

      <div className="atm-report-table">
        {attendanceRecords.length > 0 ? (
          attendanceRecords.map((record, idx) => (
            <div key={idx} className="atm-report-day">
              <h3>{record.courseName} - {new Date(record.date).toLocaleDateString()}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {record.records.map((r, i) => (
                    <tr key={i}>
                      <td>{r.studentName}</td>
                      <td>
                        <span className={`atm-badge ${r.status}`}>
                          {r.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <div className="atm-empty">
            <FaCalendarAlt size={48} />
            <h3>No attendance records</h3>
            <p>Mark attendance to see records here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceManager;