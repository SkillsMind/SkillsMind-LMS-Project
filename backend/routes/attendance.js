const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Schedule = require('../models/Schedule');

// ==========================================
// GET STUDENT ATTENDANCE (Student View)
// ==========================================
router.get('/my-attendance', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId, month, year } = req.query;

    let query = { studentId };
    
    if (courseId && courseId !== 'all') {
      query.courseId = courseId;
    }
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.scheduledDate = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query)
      .populate('scheduleId', 'title topic weekNumber')
      .populate('courseId', 'title')
      .sort({ scheduledDate: -1 });

    // Calculate statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      percentage: 0
    };

    if (stats.total > 0) {
      stats.percentage = Math.round(((stats.present + stats.late) / stats.total) * 100);
    }

    res.json({
      success: true,
      data: attendance,
      stats: stats
    });

  } catch (err) {
    console.error('Get My Attendance Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// GET COURSE ATTENDANCE (Admin View)
// ==========================================
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { courseId } = req.params;
    const { date } = req.query;

    let query = { courseId };
    if (date) {
      query.scheduledDate = new Date(date);
    }

    const attendance = await Attendance.find(query)
      .populate('studentId', 'name email')
      .populate('scheduleId', 'title topic time')
      .sort({ 'studentId.name': 1 });

    res.json({
      success: true,
      data: attendance
    });

  } catch (err) {
    console.error('Get Course Attendance Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// MANUAL ATTENDANCE UPDATE (Admin Only)
// ==========================================
router.put('/:attendanceId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { status, reason } = req.body;
    
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.attendanceId,
      {
        status: status,
        'manualOverride.isOverridden': true,
        'manualOverride.overriddenBy': req.user.id,
        'manualOverride.overriddenAt': new Date(),
        'manualOverride.reason': reason || ''
      },
      { new: true }
    );

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    res.json({
      success: true,
      message: 'Attendance updated',
      data: attendance
    });

  } catch (err) {
    console.error('Update Attendance Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// GET ATTENDANCE REPORT (Admin)
// ==========================================
router.get('/report/:courseId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        scheduledDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const attendance = await Attendance.find({ courseId, ...dateQuery })
      .populate('studentId', 'name email')
      .populate('scheduleId', 'title topic weekNumber sessionDate');

    // Group by student
    const studentReport = {};
    
    attendance.forEach(record => {
      const studentId = record.studentId._id.toString();
      
      if (!studentReport[studentId]) {
        studentReport[studentId] = {
          student: record.studentId,
          records: [],
          stats: { present: 0, absent: 0, late: 0, total: 0 }
        };
      }
      
      studentReport[studentId].records.push(record);
      studentReport[studentId].stats[record.status]++;
      studentReport[studentId].stats.total++;
    });

    // Calculate percentages
    Object.values(studentReport).forEach(report => {
      const { present, late, total } = report.stats;
      report.stats.percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    });

    res.json({
      success: true,
      data: Object.values(studentReport)
    });

  } catch (err) {
    console.error('Get Attendance Report Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;