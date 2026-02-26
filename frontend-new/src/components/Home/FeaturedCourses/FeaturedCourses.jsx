import React, { useState } from 'react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { Star, Clock, Users, ChevronRight, Play } from 'lucide-react';
import './FeaturedCourses.css';

const FeaturedCourses = () => {
  const sectionRef = useScrollAnimation();
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Development', 'Design', 'Marketing', 'Business'];

  const courses = [
    {
      id: 1,
      title: 'Complete Web Development Bootcamp',
      instructor: 'Ahmad Khan',
      rating: 4.9,
      students: 12500,
      duration: '48 hours',
      price: 4999,
      originalPrice: 9999,
      image: 'web-dev.jpg',
      category: 'Development',
      badge: 'Bestseller',
      live: true
    },
    {
      id: 2,
      title: 'UI/UX Design Masterclass',
      instructor: 'Sara Ali',
      rating: 4.8,
      students: 8300,
      duration: '32 hours',
      price: 3999,
      originalPrice: 7999,
      image: 'design.jpg',
      category: 'Design',
      badge: 'New',
      live: false
    },
    {
      id: 3,
      title: 'Digital Marketing Pro',
      instructor: 'Hassan Raza',
      rating: 4.7,
      students: 15200,
      duration: '24 hours',
      price: 2999,
      originalPrice: 5999,
      image: 'marketing.jpg',
      category: 'Marketing',
      badge: 'Popular',
      live: true
    },
    {
      id: 4,
      title: 'Data Science Fundamentals',
      instructor: 'Fatima Zahra',
      rating: 4.9,
      students: 9800,
      duration: '56 hours',
      price: 5999,
      originalPrice: 11999,
      image: 'data.jpg',
      category: 'Development',
      badge: 'Trending',
      live: false
    }
  ];

  const filteredCourses = activeFilter === 'All' 
    ? courses 
    : courses.filter(c => c.category === activeFilter);

  return (
    <section ref={sectionRef} className="featured-courses-section" id="courses">
      <div className="featured-courses-container">
        <div className="section-header reveal">
          <div className="section-label">Explore Courses</div>
          <h2 className="section-title">Featured Courses</h2>
          <p className="section-subtitle">
            Hand-picked courses to help you start your career journey
          </p>
        </div>

        <div className="filters-wrapper reveal">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="courses-grid">
          {filteredCourses.map((course, index) => (
            <div 
              key={course.id} 
              className={`course-card reveal stagger-${(index % 4) + 1}`}
            >
              <div className="course-image-wrapper">
                <div className="course-image-placeholder">
                  <span className="course-category-tag">{course.category}</span>
                  {course.badge && (
                    <span className={`course-badge badge-${course.badge.toLowerCase()}`}>
                      {course.badge}
                    </span>
                  )}
                  {!course.live && (
                    <div className="recorded-indicator">
                      <Play size={12} fill="currentColor" />
                      <span>Recorded</span>
                    </div>
                  )}
                  {course.live && (
                    <div className="live-indicator">
                      <span className="live-dot"></span>
                      <span>Live</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="course-content">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-instructor">by {course.instructor}</p>
                
                <div className="course-stats">
                  <div className="stat">
                    <Star size={14} fill="#fbbf24" className="star-icon" />
                    <span>{course.rating}</span>
                  </div>
                  <div className="stat">
                    <Users size={14} />
                    <span>{(course.students / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="stat">
                    <Clock size={14} />
                    <span>{course.duration}</span>
                  </div>
                </div>

                <div className="course-footer">
                  <div className="course-price">
                    <span className="current-price">Rs. {course.price.toLocaleString()}</span>
                    <span className="original-price">Rs. {course.originalPrice.toLocaleString()}</span>
                  </div>
                  <button className="enroll-btn">
                    Enroll
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="view-all-wrapper reveal">
          <button className="view-all-btn">
            View All Courses
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;