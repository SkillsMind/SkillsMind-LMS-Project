import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  BookOpen, 
  Edit2, 
  Camera, 
  Save,
  Clock,
  TrendingUp,
  Star,
  CheckCircle2,
  Link as LinkIcon,
  MoreHorizontal
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [profile, setProfile] = useState({
    name: 'Ahmad Student',
    email: 'ahmad.student@skillsmind.pk',
    phone: '+92 300 1234567',
    location: 'Lahore, Pakistan',
    joined: 'December 2023',
    bio: 'Passionate learner focused on web development and digital marketing. Looking to enhance skills and start freelancing career. Always eager to learn new technologies and take on challenging projects.',
    education: 'BS Computer Science',
    university: 'Virtual University of Pakistan',
    occupation: 'Student / Aspiring Freelancer',
    website: 'www.ahmadportfolio.com',
    skills: ['React', 'JavaScript', 'HTML/CSS', 'Digital Marketing', 'SEO', 'UI/UX Design']
  });

  const stats = [
    { label: 'Courses', value: 4, icon: BookOpen, color: '#3b82f6' },
    { label: 'Certificates', value: 2, icon: Award, color: '#10b981' },
    { label: 'Study Hours', value: '156h', icon: Clock, color: '#f59e0b' },
    { label: 'Avg. Score', value: '87%', icon: TrendingUp, color: '#8b5cf6' }
  ];

  const achievements = [
    { id: 1, title: 'Fast Learner', desc: 'Completed 3 courses in one month', icon: Star, color: '#f59e0b' },
    { id: 2, title: 'Perfect Score', desc: '100% in JavaScript Quiz', icon: CheckCircle2, color: '#10b981' },
    { id: 3, title: 'Consistent', desc: '30-day learning streak', icon: TrendingUp, color: '#ef4444' },
    { id: 4, title: 'Top Performer', desc: 'Ranked #1 in class', icon: Award, color: '#8b5cf6' }
  ];

  const courses = [
    { name: 'Complete Web Development', progress: 85, instructor: 'Sir Ali' },
    { name: 'Digital Marketing Mastery', progress: 60, instructor: 'Mam Sara' },
    { name: 'UI/UX Design Fundamentals', progress: 100, instructor: 'Sir Usman' }
  ];

  const handleSave = () => {
    setIsEditing(false);
    // Save logic here
  };

  return (
    <div className="profile-page">
      {/* Header Section */}
      <div className="profile-header">
        <div className="cover-image">
          <div className="cover-gradient"></div>
        </div>
        
        <div className="header-content">
          <div className="profile-identity">
            <div className="avatar-wrapper">
              <div className="profile-avatar">
                <span className="avatar-text">AS</span>
                <div className="avatar-ring"></div>
              </div>
              <button className="camera-btn">
                <Camera size={16} />
              </button>
            </div>
            
            <div className="identity-info">
              <h1>{profile.name}</h1>
              <p className="occupation">{profile.occupation}</p>
              <div className="location-row">
                <MapPin size={16} />
                <span>{profile.location}</span>
                <span className="dot">•</span>
                <Calendar size={16} />
                <span>Joined {profile.joined}</span>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="share-btn">
              <LinkIcon size={18} />
            </button>
            <button 
              className={`edit-btn ${isEditing ? 'save' : ''}`}
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
            >
              {isEditing ? (
                <><Save size={18} /> Save Profile</>
              ) : (
                <><Edit2 size={18} /> Edit Profile</>
              )}
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="profile-tabs">
          {['overview', 'courses', 'achievements', 'settings'].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-body">
        {/* Stats Row */}
        <div className="stats-banner">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="stat-box" style={{ '--stat-color': stat.color }}>
                <div className="stat-icon">
                  <Icon size={24} />
                </div>
                <div className="stat-details">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-name">{stat.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="content-grid">
          {/* Left Column */}
          <div className="main-column">
            {/* About Section */}
            <div className="content-card">
              <div className="card-header">
                <h3>About Me</h3>
                {isEditing && <span className="edit-badge">Editing</span>}
              </div>
              {isEditing ? (
                <textarea 
                  className="bio-editor"
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  rows="5"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="bio-text">{profile.bio}</p>
              )}
              
              {/* Skills */}
              <div className="skills-section">
                <h4>Skills</h4>
                <div className="skills-list">
                  {profile.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Education & Contact */}
            <div className="content-card">
              <h3>Education & Contact</h3>
              <div className="info-list">
                <div className="info-item">
                  <div className="info-icon edu">
                    <BookOpen size={20} />
                  </div>
                  <div className="info-content">
                    <label>Education</label>
                    <p>{profile.education}</p>
                    <span>{profile.university}</span>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-icon mail">
                    <Mail size={20} />
                  </div>
                  <div className="info-content">
                    <label>Email Address</label>
                    <p>{profile.email}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-icon phone">
                    <Phone size={20} />
                  </div>
                  <div className="info-content">
                    <label>Phone Number</label>
                    <p>{profile.phone}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-icon web">
                    <LinkIcon size={20} />
                  </div>
                  <div className="info-content">
                    <label>Website</label>
                    <p>{profile.website}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Courses */}
            <div className="content-card">
              <div className="card-header flex">
                <h3>Current Courses</h3>
                <button className="view-all">View All</button>
              </div>
              <div className="courses-list">
                {courses.map((course, idx) => (
                  <div key={idx} className="course-item">
                    <div className="course-info">
                      <h4>{course.name}</h4>
                      <p>Instructor: {course.instructor}</p>
                    </div>
                    <div className="progress-ring">
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
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="side-column">
            {/* Achievements */}
            <div className="content-card achievements">
              <div className="card-header">
                <h3>Achievements</h3>
                <Award size={20} className="header-icon" />
              </div>
              <div className="achievements-grid">
                {achievements.map((ach) => {
                  const Icon = ach.icon;
                  return (
                    <div key={ach.id} className="achievement-card">
                      <div className="ach-icon" style={{ backgroundColor: `${ach.color}15`, color: ach.color }}>
                        <Icon size={20} />
                      </div>
                      <h4>{ach.title}</h4>
                      <p>{ach.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Card */}
            <div className="content-card activity">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-dot blue"></div>
                  <div className="activity-content">
                    <p>Completed JavaScript Quiz</p>
                    <span>2 hours ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-dot green"></div>
                  <div className="activity-content">
                    <p>Earned Fast Learner Badge</p>
                    <span>1 day ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-dot orange"></div>
                  <div className="activity-content">
                    <p>Started React Course</p>
                    <span>3 days ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upgrade Card */}
            <div className="upgrade-card">
              <div className="upgrade-content">
                <h4>Go Pro</h4>
                <p>Unlock all courses and get certified</p>
                <button className="upgrade-btn">Upgrade Now</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;