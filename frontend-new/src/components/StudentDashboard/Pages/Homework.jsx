import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, Clock, Calendar, Filter, MoreVertical, Paperclip, MessageSquare } from 'lucide-react';
import "./Homework.css";

const Homework = () => {
  const [filter, setFilter] = useState('all');
  
  const homeworks = [
    { 
      id: 1, 
      title: 'SEO Analysis Report', 
      course: 'Digital Marketing', 
      courseCode: 'DM-301',
      due: 'Jan 20, 2026', 
      time: '11:59 PM',
      status: 'pending', 
      submitted: false,
      grade: null,
      feedback: null,
      attachments: 2
    },
    { 
      id: 2, 
      title: 'Logo Design Project', 
      course: 'Graphic Design',
      courseCode: 'GD-201', 
      due: 'Jan 18, 2026', 
      time: '5:00 PM',
      status: 'submitted', 
      submitted: true,
      grade: 'A',
      feedback: 'Excellent work on color theory',
      attachments: 1
    },
    { 
      id: 3, 
      title: 'Client Proposal Draft', 
      course: 'Freelancing',
      courseCode: 'FL-401', 
      due: 'Jan 22, 2026', 
      time: '11:59 PM',
      status: 'pending', 
      submitted: false,
      grade: null,
      feedback: null,
      attachments: 0
    },
    { 
      id: 4, 
      title: 'Market Research Summary', 
      course: 'Business Strategy',
      courseCode: 'BS-101', 
      due: 'Jan 15, 2026', 
      time: '10:00 AM',
      status: 'graded', 
      submitted: true,
      grade: 'B+',
      feedback: 'Good analysis, expand on section 3',
      attachments: 3
    }
  ];

  const filteredHomeworks = homeworks.filter(hw => {
    if (filter === 'all') return true;
    return hw.status === filter;
  });

  const stats = {
    total: homeworks.length,
    pending: homeworks.filter(h => h.status === 'pending').length,
    submitted: homeworks.filter(h => h.status === 'submitted').length,
    graded: homeworks.filter(h => h.status === 'graded').length
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        color: '#dc2626', 
        bg: '#fee2e2', 
        label: 'To Do',
        icon: Clock 
      },
      submitted: { 
        color: '#0284c7', 
        bg: '#e0f2fe', 
        label: 'Submitted',
        icon: CheckCircle 
      },
      graded: { 
        color: '#059669', 
        bg: '#d1fae5', 
        label: 'Graded',
        icon: CheckCircle 
      }
    };
    return configs[status] || configs.pending;
  };

  return (
    <div className="homework-page">
      {/* Header */}
      <header className="homework-header">
        <div className="header-content">
          <h1>Homework</h1>
          <p>Manage assignments, track submissions, and view feedback</p>
        </div>
        <button className="new-task-btn">
          <span>+</span> New Task
        </button>
      </header>

      {/* Stats Overview */}
      <div className="stats-bar">
        <div className="stat-pill">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-pill pending">
          <span className="stat-num">{stats.pending}</span>
          <span className="stat-label">To Do</span>
        </div>
        <div className="stat-pill submitted">
          <span className="stat-num">{stats.submitted}</span>
          <span className="stat-label">Submitted</span>
        </div>
        <div className="stat-pill graded">
          <span className="stat-num">{stats.graded}</span>
          <span className="stat-label">Graded</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-toolbar">
        <div className="filter-tabs">
          {['all', 'pending', 'submitted', 'graded'].map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="count-badge">
                {tab === 'all' ? stats.total : stats[tab]}
              </span>
            </button>
          ))}
        </div>
        <button className="filter-btn">
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Homework List */}
      <div className="homework-list">
        {filteredHomeworks.map((hw) => {
          const status = getStatusConfig(hw.status);
          const StatusIcon = status.icon;
          
          return (
            <div key={hw.id} className={`homework-row ${hw.status}`}>
              {/* Left Section */}
              <div className="row-left">
                <div className="file-icon">
                  <FileText size={22} />
                </div>
                <div className="homework-info">
                  <div className="title-row">
                    <h3>{hw.title}</h3>
                    {hw.grade && (
                      <span className="grade-badge">Grade: {hw.grade}</span>
                    )}
                  </div>
                  <div className="course-line">
                    <span className="course-code">{hw.courseCode}</span>
                    <span className="course-name">{hw.course}</span>
                  </div>
                  {hw.feedback && (
                    <div className="feedback-preview">
                      <MessageSquare size={12} />
                      <span>{hw.feedback}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Center Section - Due Date */}
              <div className="row-center">
                <div className="due-info">
                  <Calendar size={14} />
                  <div className="due-details">
                    <span className="due-date">{hw.due}</span>
                    <span className="due-time">{hw.time}</span>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="row-right">
                <div 
                  className="status-chip"
                  style={{ color: status.color, backgroundColor: status.bg }}
                >
                  <StatusIcon size={14} />
                  {status.label}
                </div>

                {hw.attachments > 0 && (
                  <div className="attachment-hint">
                    <Paperclip size={14} />
                    <span>{hw.attachments}</span>
                  </div>
                )}

                {hw.status === 'pending' ? (
                  <button className="action-btn submit">
                    <Upload size={16} />
                    Submit
                  </button>
                ) : (
                  <button className="action-btn view">
                    View
                  </button>
                )}

                <button className="menu-btn">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredHomeworks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <CheckCircle size={48} />
          </div>
          <h3>All caught up!</h3>
          <p>No homework found in this category.</p>
        </div>
      )}
    </div>
  );
};

export default Homework;