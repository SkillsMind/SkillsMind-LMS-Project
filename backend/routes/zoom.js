const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const zoomService = require('../services/zoomService');
const ZoomMeeting = require('../models/ZoomMeeting');
const Schedule = require('../models/Schedule');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// ==========================================
// CREATE ZOOM MEETING (Admin Only)
// ==========================================
router.post('/create-meeting/:scheduleId', auth, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { scheduleId } = req.params;
    
    // Get schedule details
    const schedule = await Schedule.findById(scheduleId).populate('courseId');
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    // 🔥 FIXED: Check if meeting already exists in ZoomMeeting collection
    let existingMeeting = await ZoomMeeting.findOne({ scheduleId });
    
    // Also check if schedule already has zoom meeting linked
    if (!existingMeeting && schedule.zoomMeetingId && schedule.isZoomEnabled) {
      // Try to find by zoomMeetingId
      existingMeeting = await ZoomMeeting.findOne({ zoomMeetingId: schedule.zoomMeetingId });
    }

    if (existingMeeting) {
      console.log('Meeting already exists, returning existing:', existingMeeting.zoomMeetingId);
      return res.json({
        success: true,
        message: 'Meeting already exists',
        data: {
          meeting: existingMeeting,
          startUrl: existingMeeting.startUrl,
          joinUrl: existingMeeting.joinUrl
        }
      });
    }

    // Create Zoom meeting via API
    const zoomData = await zoomService.createMeeting({
      title: `${schedule.title} - ${schedule.topic}`,
      sessionDate: schedule.sessionDate,
      time: schedule.time,
      duration: schedule.duration
    });

    // Save to database
    const meeting = new ZoomMeeting({
      scheduleId: schedule._id,
      courseId: schedule.courseId._id,
      zoomMeetingId: zoomData.meetingId,
      zoomMeetingNumber: zoomData.meetingNumber,
      joinUrl: zoomData.joinUrl,
      startUrl: zoomData.startUrl,
      password: zoomData.password,
      hostEmail: zoomData.hostEmail,
      status: 'waiting'
    });

    await meeting.save();

    // 🔥 FIXED: Update schedule with meeting link (zoomMeetingId as String)
    schedule.meetingLink = zoomData.joinUrl;
    schedule.zoomMeetingId = zoomData.meetingId; // String ID from Zoom
    schedule.isZoomEnabled = true;
    await schedule.save();

    // Notify students via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`course_${schedule.courseId._id}`).emit('zoomMeetingCreated', {
        scheduleId: schedule._id,
        meetingId: meeting._id,
        joinUrl: zoomData.joinUrl,
        startTime: schedule.sessionDate,
        message: 'Live class scheduled! Link will be available 15 minutes before class.'
      });
    }

    res.json({
      success: true,
      message: 'Zoom meeting created successfully',
      data: {
        meeting: meeting,
        startUrl: zoomData.startUrl,
        joinUrl: zoomData.joinUrl
      }
    });

  } catch (err) {
    console.error('Create Zoom Meeting Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// START MEETING (Admin/Teacher)
// ==========================================
router.post('/start-meeting/:meetingId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const meeting = await ZoomMeeting.findById(req.params.meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Update status
    meeting.status = 'live';
    meeting.startedAt = new Date();
    await meeting.save();

    // Update schedule status
    await Schedule.findByIdAndUpdate(meeting.scheduleId, { status: 'ongoing' });

    // Notify students
    const io = req.app.get('io');
    if (io) {
      io.to(`course_${meeting.courseId}`).emit('classStarted', {
        meetingId: meeting._id,
        zoomMeetingId: meeting.zoomMeetingId,
        joinUrl: meeting.joinUrl,
        message: 'Class has started! Join now.'
      });
    }

    res.json({
      success: true,
      message: 'Meeting started',
      data: {
        startUrl: meeting.startUrl,
        joinUrl: meeting.joinUrl
      }
    });

  } catch (err) {
    console.error('Start Meeting Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// END MEETING (Admin Only)
// ==========================================
router.post('/end-meeting/:meetingId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const meeting = await ZoomMeeting.findById(req.params.meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Try to end meeting via Zoom API (optional)
    try {
      await zoomService.endMeeting(meeting.zoomMeetingId);
    } catch (zoomErr) {
      console.log('Zoom API end meeting error (continuing):', zoomErr.message);
    }

    // Update meeting status
    meeting.status = 'ended';
    meeting.endedAt = new Date();
    await meeting.save();

    // Update schedule status
    await Schedule.findByIdAndUpdate(meeting.scheduleId, { status: 'completed' });

    // Calculate final attendance
    await calculateFinalAttendance(meeting.scheduleId);

    // Notify students
    const io = req.app.get('io');
    if (io) {
      io.to(`course_${meeting.courseId}`).emit('classEnded', {
        meetingId: meeting._id,
        message: 'Class has ended'
      });
    }

    res.json({
      success: true,
      message: 'Meeting ended successfully'
    });

  } catch (err) {
    console.error('End Meeting Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// GET MEETING BY SCHEDULE ID (For checking existing)
// ==========================================
router.get('/meeting-by-schedule/:scheduleId', auth, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    // First check ZoomMeeting collection
    let meeting = await ZoomMeeting.findOne({ scheduleId });
    
    // If not found, check if schedule has meeting linked
    if (!meeting) {
      const schedule = await Schedule.findById(scheduleId);
      if (schedule && schedule.zoomMeetingId) {
        meeting = await ZoomMeeting.findOne({ zoomMeetingId: schedule.zoomMeetingId });
      }
    }

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    res.json({
      success: true,
      data: {
        meeting: meeting,
        startUrl: meeting.startUrl,
        joinUrl: meeting.joinUrl,
        status: meeting.status
      }
    });

  } catch (err) {
    console.error('Get Meeting Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// CHECK IF MEETING EXISTS (For frontend button state)
// ==========================================
router.get('/check-meeting/:scheduleId', auth, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    const meeting = await ZoomMeeting.findOne({ scheduleId });
    
    res.json({
      success: true,
      exists: !!meeting,
      meeting: meeting || null
    });

  } catch (err) {
    console.error('Check Meeting Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// STUDENT JOIN MEETING (Create Attendance Here)
// ==========================================
router.post('/join-meeting/:scheduleId', auth, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const studentId = req.user.id;

    // Get schedule details
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    // Get meeting details
    const meeting = await ZoomMeeting.findOne({ scheduleId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Check if student is enrolled
    const user = await User.findById(studentId);
    const isEnrolled = user.enrolledCourses.some(
      courseId => courseId.toString() === schedule.courseId.toString()
    );

    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    // Create or Update Attendance when student joins
    let attendance = await Attendance.findOne({
      studentId: studentId,
      scheduleId: scheduleId
    });

    const now = new Date();

    if (!attendance) {
      // First time joining - Create new attendance record
      attendance = new Attendance({
        studentId: studentId,
        scheduleId: scheduleId,
        courseId: schedule.courseId,
        zoomMeetingId: meeting.zoomMeetingId,
        scheduledDate: schedule.sessionDate,
        scheduledTime: schedule.time,
        status: 'present',
        joinedAt: now,
        firstJoinedAt: now,
        lastPingAt: now,
        sessionHistory: [{
          action: 'join',
          timestamp: now
        }]
      });
      await attendance.save();
      console.log(`✅ Attendance created for student ${studentId} in schedule ${scheduleId}`);
    } else {
      // Rejoining - Update existing record
      attendance.joinedAt = now;
      attendance.lastPingAt = now;
      attendance.status = 'present';
      attendance.sessionHistory.push({
        action: 'rejoin',
        timestamp: now
      });
      await attendance.save();
      console.log(`🔄 Attendance updated for student ${studentId} (rejoined)`);
    }

    res.json({
      success: true,
      message: 'Joined successfully',
      data: {
        meetingId: meeting._id,
        zoomMeetingId: meeting.zoomMeetingId,
        joinUrl: meeting.joinUrl,
        password: meeting.password,
        attendanceId: attendance._id
      }
    });

  } catch (err) {
    console.error('Join Meeting Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// STUDENT LEAVE MEETING (Update Duration)
// ==========================================
router.post('/leave-meeting/:scheduleId', auth, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const studentId = req.user.id;

    const attendance = await Attendance.findOne({
      studentId: studentId,
      scheduleId: scheduleId
    });

    if (attendance && attendance.joinedAt) {
      const now = new Date();
      const duration = Math.round((now - attendance.joinedAt) / 60000); // minutes

      attendance.leftAt = now;
      attendance.totalDuration += duration;
      attendance.lastPingAt = now;
      
      attendance.sessionHistory.push({
        action: 'leave',
        timestamp: now,
        duration: duration
      });
      
      await attendance.save();
      
      console.log(`👋 Student ${studentId} left. Duration: ${duration} minutes`);
    }

    res.json({ success: true, message: 'Left meeting' });

  } catch (err) {
    console.error('Leave Meeting Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// GET MEETING FOR STUDENT (with time check)
// ==========================================
router.get('/student-meeting/:scheduleId', auth, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const studentId = req.user.id;

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const meeting = await ZoomMeeting.findOne({ scheduleId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not scheduled yet' });
    }

    // Check if link should be visible (15 minutes before class)
    const now = new Date();
    const classTime = new Date(schedule.sessionDate);
    const [hours, minutes] = schedule.time.split(':');
    classTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const linkVisibleTime = new Date(classTime.getTime() - (15 * 60000));

    if (now < linkVisibleTime) {
      return res.json({
        success: true,
        data: {
          visible: false,
          availableAt: linkVisibleTime,
          message: `Link will be available at ${linkVisibleTime.toLocaleTimeString()}`,
          status: meeting.status
        }
      });
    }

    // Check if student is enrolled
    const user = await User.findById(studentId);
    const isEnrolled = user.enrolledCourses.some(
      courseId => courseId.toString() === schedule.courseId.toString()
    );

    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    res.json({
      success: true,
      data: {
        visible: true,
        meetingId: meeting._id,
        zoomMeetingId: meeting.zoomMeetingId,
        joinUrl: meeting.joinUrl,
        password: meeting.password,
        status: meeting.status,
        startedAt: meeting.startedAt
      }
    });

  } catch (err) {
    console.error('Get Student Meeting Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Calculate final attendance status
async function calculateFinalAttendance(scheduleId) {
  try {
    const attendances = await Attendance.find({ scheduleId });
    const schedule = await Schedule.findById(scheduleId);

    for (const attendance of attendances) {
      // If never joined, stays not_marked or absent
      if (!attendance.joinedAt) {
        attendance.status = 'absent';
      } else {
        const totalMinutes = attendance.totalDuration;
        const classDuration = schedule.duration || 60;
        
        const percentage = (totalMinutes / classDuration) * 100;
        
        if (percentage >= 75) {
          attendance.status = 'present';
        } else if (percentage >= 50) {
          attendance.status = 'late';
        } else {
          attendance.status = 'absent';
        }
      }
      
      attendance.calculatedAt = new Date();
      await attendance.save();
    }

  } catch (err) {
    console.error('Calculate Final Attendance Error:', err);
  }
}

module.exports = router;