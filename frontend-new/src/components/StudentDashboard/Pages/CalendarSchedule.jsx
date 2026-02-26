import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Video, FileText, AlertCircle } from 'lucide-react';
import './CalendarSchedule.css';

const CalendarSchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const events = [
    { id: 1, title: 'Live Session: React Hooks', time: '2:00 PM', type: 'live', course: 'Web Development', duration: '1 hour' },
    { id: 2, title: 'Assignment Due: SEO Report', time: '11:59 PM', type: 'deadline', course: 'Digital Marketing', urgent: true },
    { id: 3, title: 'Quiz: JavaScript Basics', time: '4:00 PM', type: 'quiz', course: 'Programming', duration: '30 mins' },
    { id: 4, title: 'Mentor Session: Career Guidance', time: '6:00 PM', type: 'mentoring', course: 'Career Development', duration: '45 mins' }
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const hasEvent = [12, 15, 18, 22].includes(i);
      const isToday = i === new Date().getDate();
      
      days.push(
        <div key={i} className={`calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`}>
          <span className="day-number">{i}</span>
          {hasEvent && <div className="event-dot"></div>}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="calendar-page">
      <div className="calendar-layout">
        <div className="calendar-section">
          <div className="calendar-header">
            <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <div className="calendar-nav">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="today-btn">Today</button>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            {days.map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
            {renderCalendar()}
          </div>
        </div>

        <div className="events-section">
          <h3>Today's Schedule</h3>
          <div className="events-timeline">
            {events.map((event) => (
              <div key={event.id} className={`timeline-item ${event.type} ${event.urgent ? 'urgent' : ''}`}>
                <div className="time-column">
                  <span className="time">{event.time}</span>
                  <span className="duration">{event.duration}</span>
                </div>
                <div className="event-content">
                  <div className="event-icon">
                    {event.type === 'live' && <Video className="w-5 h-5" />}
                    {event.type === 'deadline' && <AlertCircle className="w-5 h-5" />}
                    {event.type === 'quiz' && <FileText className="w-5 h-5" />}
                    {event.type === 'mentoring' && <Clock className="w-5 h-5" />}
                  </div>
                  <div className="event-details">
                    <h4>{event.title}</h4>
                    <p>{event.course}</p>
                    {event.urgent && <span className="urgent-badge">Due Today</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="upcoming-section">
            <h3>Upcoming This Week</h3>
            <div className="upcoming-list">
              <div className="upcoming-item">
                <div className="date-box">
                  <span className="day">15</span>
                  <span className="month">Jan</span>
                </div>
                <div className="upcoming-info">
                  <h4>Group Project Submission</h4>
                  <p>Graphic Design Course</p>
                </div>
              </div>
              <div className="upcoming-item">
                <div className="date-box">
                  <span className="day">18</span>
                  <span className="month">Jan</span>
                </div>
                <div className="upcoming-info">
                  <h4>Mid-term Examination</h4>
                  <p>All Courses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSchedule;