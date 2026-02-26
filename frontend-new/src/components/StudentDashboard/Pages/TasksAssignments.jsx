import React, { useState } from 'react';
import { Calendar, CheckCircle, Clock, AlertCircle, FileText, Upload, Eye, MessageSquare } from 'lucide-react';
import './TasksAssignments.css';

const TasksAssignments = () => {
  const [activeTab, setActiveTab] = useState('pending');
  
  const assignments = [
    {
      id: 1,
      title: 'SEO Keyword Research Report',
      course: 'Digital Marketing',
      type: 'Assignment',
      dueDate: '2024-01-15',
      status: 'pending',
      maxMarks: 100,
      description: 'Research and analyze 50 keywords for an e-commerce website. Submit a detailed report with search volume and competition analysis.',
      attachments: 2,
      submitted: false
    },
    {
      id: 2,
      title: 'Logo Design Project',
      course: 'Graphic Design',
      type: 'Project',
      dueDate: '2024-01-18',
      status: 'submitted',
      maxMarks: 150,
      description: 'Create 3 unique logo concepts for a tech startup. Include brand guidelines and color palette.',
      attachments: 5,
      submitted: true,
      submittedDate: '2024-01-14',
      grade: null
    },
    {
      id: 3,
      title: 'Client Communication Quiz',
      course: 'Freelancing',
      type: 'Quiz',
      dueDate: '2024-01-10',
      status: 'graded',
      maxMarks: 50,
      description: 'Multiple choice quiz covering client handling, negotiation, and communication ethics.',
      submitted: true,
      submittedDate: '2024-01-10',
      grade: 45,
      feedback: 'Excellent understanding of client psychology. Minor improvement needed in negotiation scenarios.'
    },
    {
      id: 4,
      title: 'WordPress Website Setup',
      course: 'Web Development',
      type: 'Hands-on Lab',
      dueDate: '2024-01-20',
      status: 'pending',
      maxMarks: 75,
      description: 'Install WordPress, configure basic settings, and create a landing page.',
      attachments: 1,
      submitted: false,
      urgent: true
    }
  ];

  const filteredAssignments = assignments.filter(a => {
    if (activeTab === 'pending') return a.status === 'pending';
    if (activeTab === 'submitted') return a.status === 'submitted' || a.status === 'graded';
    if (activeTab === 'missed') return new Date(a.dueDate) < new Date() && !a.submitted;
    return true;
  });

  const getStatusIcon = (status) => {
    switch(status) {
      case 'graded': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'submitted': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'pending': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default: return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Tasks & Assignments</h1>
          <p>Track, submit and view your grades</p>
        </div>
        <div className="header-stats">
          <div className="stat-box">
            <span className="stat-num">85%</span>
            <span className="stat-label">Avg. Score</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">12</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      <div className="tasks-tabs">
        {['pending', 'submitted', 'missed', 'all'].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'pending' && <span className="badge">2</span>}
          </button>
        ))}
      </div>

      <div className="assignments-list">
        {filteredAssignments.map((task) => (
          <div key={task.id} className={`assignment-card ${task.status} ${task.urgent ? 'urgent' : ''}`}>
            <div className="assignment-header">
              <div className="task-type-icon">
                <FileText className="w-6 h-6" />
              </div>
              <div className="task-meta">
                <div className="task-title-row">
                  <h3>{task.title}</h3>
                  {getStatusIcon(task.status)}
                </div>
                <div className="task-tags">
                  <span className="course-tag">{task.course}</span>
                  <span className="type-tag">{task.type}</span>
                  <span className="marks-tag">{task.maxMarks} Marks</span>
                  {task.urgent && <span className="urgent-tag">URGENT</span>}
                </div>
              </div>
              <div className="due-date">
                <Calendar className="w-4 h-4" />
                <div>
                  <span className="date-label">Due Date</span>
                  <span className="date-value">{task.dueDate}</span>
                </div>
              </div>
            </div>

            <div className="assignment-body">
              <p className="description">{task.description}</p>
              
              {task.attachments > 0 && (
                <div className="attachments">
                  <FileText className="w-4 h-4" />
                  <span>{task.attachments} Attachments</span>
                </div>
              )}
            </div>

            <div className="assignment-footer">
              {task.status === 'graded' ? (
                <div className="grade-display">
                  <div className="score">
                    <span className="obtained">{task.grade}</span>
                    <span className="total">/{task.maxMarks}</span>
                  </div>
                  <div className="grade-actions">
                    <button className="feedback-btn">
                      <MessageSquare className="w-4 h-4" />
                      View Feedback
                    </button>
                  </div>
                </div>
              ) : task.status === 'submitted' ? (
                <div className="submitted-info">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  <span>Submitted on {task.submittedDate}</span>
                  <span className="pending-grade">Grading pending...</span>
                </div>
              ) : (
                <div className="action-buttons">
                  <button className="view-btn">
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button className="submit-btn">
                    <Upload className="w-4 h-4" />
                    Submit Assignment
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksAssignments;