import React, { useState } from 'react';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Clock, 
  Calendar,
  ChevronDown,
  BookOpen,
  Flame,
  Star,
  ArrowUpRight,
  MoreHorizontal
} from 'lucide-react';
import './Progress.css';

const Progress = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [activeCourse, setActiveCourse] = useState(0);

  const stats = [
    { 
      label: 'Course Completion', 
      value: '75%', 
      change: '+12%',
      icon: Target, 
      color: '#3b82f6',
      bgColor: '#eff6ff'
    },
    { 
      label: 'Certificates', 
      value: '12', 
      change: '+3',
      icon: Award, 
      color: '#10b981',
      bgColor: '#ecfdf5'
    },
    { 
      label: 'Study Hours', 
      value: '156h', 
      change: '+24h',
      icon: Clock, 
      color: '#f59e0b',
      bgColor: '#fffbeb'
    },
    { 
      label: 'Average Score', 
      value: '92%', 
      change: '+5%',
      icon: TrendingUp, 
      color: '#8b5cf6',
      bgColor: '#f5f3ff'
    }
  ];

  const weeklyData = [
    { day: 'Mon', hours: 2.5, score: 85 },
    { day: 'Tue', hours: 3.8, score: 88 },
    { day: 'Wed', hours: 1.5, score: 82 },
    { day: 'Thu', hours: 4.2, score: 90 },
    { day: 'Fri', hours: 3.0, score: 87 },
    { day: 'Sat', hours: 5.5, score: 94 },
    { day: 'Sun', hours: 2.0, score: 89 }
  ];

  const courses = [
    { 
      name: 'Complete Web Development Bootcamp', 
      progress: 85, 
      totalLessons: 120,
      completedLessons: 102,
      lastAccessed: '2 hours ago',
      instructor: 'Sir Ali Ahmad'
    },
    { 
      name: 'Digital Marketing Mastery', 
      progress: 60, 
      totalLessons: 80,
      completedLessons: 48,
      lastAccessed: '1 day ago',
      instructor: 'Mam Sarah Khan'
    },
    { 
      name: 'UI/UX Design Fundamentals', 
      progress: 100, 
      totalLessons: 45,
      completedLessons: 45,
      lastAccessed: 'Completed',
      instructor: 'Sir Usman Ali'
    },
    { 
      name: 'React & Next.js Advanced', 
      progress: 35, 
      totalLessons: 60,
      completedLessons: 21,
      lastAccessed: '3 days ago',
      instructor: 'Sir Bilal Qadir'
    }
  ];

  const achievements = [
    { title: '7-Day Streak', desc: 'Learned 7 days in a row', icon: Flame, color: '#ef4444' },
    { title: 'Perfect Week', desc: 'Completed all daily goals', icon: Star, color: '#f59e0b' },
    { title: 'Fast Learner', desc: 'Finished course in 2 weeks', icon: TrendingUp, color: '#10b981' }
  ];

  const maxHours = Math.max(...weeklyData.map(d => d.hours));

  return (
    <div className="progress-page">
      {/* Header */}
      <header className="progress-header">
        <div className="header-content">
          <div>
            <h1>My Progress</h1>
            <p>Track your learning journey and achievements</p>
          </div>
          <div className="time-filter">
            <button 
              className={`filter-btn ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimeRange('week')}
            >
              This Week
            </button>
            <button 
              className={`filter-btn ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              This Month
            </button>
            <button 
              className={`filter-btn ${timeRange === 'year' ? 'active' : ''}`}
              onClick={() => setTimeRange('year')}
            >
              This Year
            </button>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-section">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="stat-card" style={{ '--stat-color': stat.color }}>
              <div className="stat-header">
                <div 
                  className="stat-icon-box" 
                  style={{ backgroundColor: stat.bgColor, color: stat.color }}
                >
                  <Icon size={22} />
                </div>
                <span className="stat-change positive">
                  <ArrowUpRight size={14} />
                  {stat.change}
                </span>
              </div>
              <div className="stat-body">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
              <div className="stat-progress">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: stat.value.includes('%') ? stat.value : '75%',
                    backgroundColor: stat.color 
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="progress-grid">
        {/* Chart Section */}
        <div className="chart-card">
          <div className="card-header">
            <div>
              <h3>Study Activity</h3>
              <p>Hours spent learning this week</p>
            </div>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="dot blue"></span>
                Study Hours
              </span>
            </div>
          </div>
          
          <div className="chart-container">
            <div className="bar-chart">
              {weeklyData.map((data, idx) => (
                <div key={idx} className="bar-group">
                  <div className="bar-wrapper">
                    <div 
                      className="bar" 
                      style={{ 
                        height: `${(data.hours / maxHours) * 100}%`,
                        backgroundColor: data.hours >= 4 ? '#3b82f6' : '#93c5fd'
                      }}
                    >
                      <span className="bar-value">{data.hours}h</span>
                    </div>
                  </div>
                  <span className="bar-label">{data.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-summary">
            <div className="summary-item">
              <span className="summary-value">22.5h</span>
              <span className="summary-label">Total Hours</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">3.2h</span>
              <span className="summary-label">Daily Average</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">88%</span>
              <span className="summary-label">Avg Score</span>
            </div>
          </div>
        </div>

        {/* Courses Progress */}
        <div className="courses-card">
          <div className="card-header">
            <div>
              <h3>Course Progress</h3>
              <p>{courses.length} active courses</p>
            </div>
            <button className="view-all-btn">View All</button>
          </div>

          <div className="courses-list">
            {courses.map((course, idx) => (
              <div 
                key={idx} 
                className={`course-item ${activeCourse === idx ? 'active' : ''}`}
                onClick={() => setActiveCourse(idx)}
              >
                <div className="course-info">
                  <h4>{course.name}</h4>
                  <div className="course-meta">
                    <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                    <span>•</span>
                    <span className="instructor">{course.instructor}</span>
                  </div>
                </div>
                <div className="course-progress">
                  <div className="progress-circle">
                    <svg viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={course.progress === 100 ? '#10b981' : '#3b82f6'}
                        strokeWidth="3"
                        strokeDasharray={`${course.progress}, 100`}
                      />
                    </svg>
                    <span>{course.progress}%</span>
                  </div>
                  {course.progress === 100 && (
                    <span className="completed-badge">Done</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="achievements-card">
          <div className="card-header">
            <h3>Recent Achievements</h3>
            <Award size={20} className="header-icon" />
          </div>
          <div className="achievements-list">
            {achievements.map((ach, idx) => {
              const Icon = ach.icon;
              return (
                <div key={idx} className="achievement-row">
                  <div 
                    className="ach-icon" 
                    style={{ backgroundColor: `${ach.color}15`, color: ach.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="ach-content">
                    <h4>{ach.title}</h4>
                    <p>{ach.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="see-all-btn">
            See All Achievements
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Daily Goal */}
        <div className="goal-card">
          <div className="goal-header">
            <div>
              <h3>Daily Goal</h3>
              <p>Keep your streak alive!</p>
            </div>
            <div className="streak-badge">
              <Flame size={16} />
              <span>12 days</span>
            </div>
          </div>
          
          <div className="goal-progress">
            <div className="goal-bar">
              <div className="goal-fill" style={{ width: '75%' }}></div>
            </div>
            <div className="goal-stats">
              <span>3.2 / 4 hours</span>
              <span>75%</span>
            </div>
          </div>

          <div className="goal-motivation">
            <p>You're on fire! 🔥 Just 48 minutes more to reach your daily goal.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;