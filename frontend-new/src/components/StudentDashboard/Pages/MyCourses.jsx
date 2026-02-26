import React, { useState } from 'react';
import { Search, Filter, PlayCircle, FileText, Users, MoreVertical, Clock, CheckCircle } from 'lucide-react';
import './MyCourses.css';

const MyCourses = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const courses = [
    {
      id: 1,
      title: 'Digital Marketing Masterclass',
      instructor: 'Sir Ali Khan',
      progress: 75,
      totalModules: 12,
      completedModules: 9,
      lastAccessed: '2 hours ago',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
      category: 'Marketing',
      status: 'ongoing',
      nextLesson: 'Module 10: SEO Advanced Techniques',
      enrollmentDate: 'Dec 15, 2023'
    },
    {
      id: 2,
      title: 'Graphic Design Fundamentals',
      instructor: 'Ms. Sara Ahmed',
      progress: 45,
      totalModules: 10,
      completedModules: 4,
      lastAccessed: '1 day ago',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
      category: 'Design',
      status: 'ongoing',
      nextLesson: 'Module 5: Color Theory',
      enrollmentDate: 'Dec 20, 2023'
    },
    {
      id: 3,
      title: 'Freelancing Essentials',
      instructor: 'Sir Hassan Raza',
      progress: 90,
      totalModules: 8,
      completedModules: 7,
      lastAccessed: '3 hours ago',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
      category: 'Business',
      status: 'ongoing',
      nextLesson: 'Module 8: Client Retention',
      enrollmentDate: 'Nov 10, 2023'
    },
    {
      id: 4,
      title: 'WordPress Development',
      instructor: 'Sir Ahmad Raza',
      progress: 0,
      totalModules: 15,
      completedModules: 0,
      lastAccessed: 'Never',
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400',
      category: 'Development',
      status: 'not-started',
      nextLesson: 'Module 1: Introduction to WordPress',
      enrollmentDate: 'Jan 5, 2024'
    }
  ];

  const filteredCourses = courses.filter(course => {
    if (filter !== 'all' && course.status !== filter) return false;
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="my-courses-page">
      <div className="page-header">
        <div>
          <h1>My Courses</h1>
          <p>Continue your learning journey</p>
        </div>
        <button className="browse-btn">Browse Catalog</button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="Search your courses..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-tabs">
          {['all', 'ongoing', 'completed', 'not-started'].map((tab) => (
            <button
              key={tab}
              className={filter === tab ? 'active' : ''}
              onClick={() => setFilter(tab)}
            >
              {tab === 'not-started' ? 'Not Started' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="courses-grid">
        {filteredCourses.map((course) => (
          <div key={course.id} className="course-card">
            <div className="course-image" style={{ backgroundImage: `url(${course.image})` }}>
              <div className="course-overlay">
                <span className="category-badge">{course.category}</span>
                <button className="more-btn"><MoreVertical className="w-5 h-5" /></button>
              </div>
              {course.progress > 0 && (
                <div className="progress-ring">
                  <svg viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeOpacity="0.3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#DC2626"
                      strokeWidth="3"
                      strokeDasharray={`${course.progress}, 100`}
                    />
                  </svg>
                  <span>{course.progress}%</span>
                </div>
              )}
            </div>

            <div className="course-content">
              <h3>{course.title}</h3>
              <p className="instructor">{course.instructor}</p>

              <div className="course-stats">
                <div className="stat">
                  <Users className="w-4 h-4" />
                  <span>1.2k students</span>
                </div>
                <div className="stat">
                  <FileText className="w-4 h-4" />
                  <span>{course.totalModules} modules</span>
                </div>
              </div>

              {course.progress > 0 ? (
                <div className="continue-section">
                  <div className="next-lesson">
                    <Clock className="w-4 h-4" />
                    <span>Next: {course.nextLesson}</span>
                  </div>
                  <button className="continue-course-btn">
                    <PlayCircle className="w-5 h-5" />
                    Continue
                  </button>
                </div>
              ) : (
                <div className="start-section">
                  <span className="enrollment-date">Enrolled: {course.enrollmentDate}</span>
                  <button className="start-course-btn">
                    <PlayCircle className="w-5 h-5" />
                    Start Learning
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

export default MyCourses;