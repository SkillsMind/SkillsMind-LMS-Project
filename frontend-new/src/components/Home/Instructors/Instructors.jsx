import React from 'react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { Linkedin, Twitter, Award } from 'lucide-react';
import './Instructors.css';

const Instructors = () => {
  const sectionRef = useScrollAnimation();

  const instructors = [
    {
      name: 'Ahmad Khan',
      role: 'Senior Software Engineer',
      company: 'Google',
      image: 'ahmad.jpg',
      students: '15,000+',
      rating: 4.9,
      courses: 12
    },
    {
      name: 'Sara Ali',
      role: 'Product Designer',
      company: 'Microsoft',
      image: 'sara.jpg',
      students: '12,000+',
      rating: 4.8,
      courses: 8
    },
    {
      name: 'Hassan Raza',
      role: 'Marketing Director',
      company: 'Careem',
      image: 'hassan.jpg',
      students: '20,000+',
      rating: 4.9,
      courses: 15
    },
    {
      name: 'Fatima Zahra',
      role: 'Data Scientist',
      company: 'Amazon',
      image: 'fatima.jpg',
      students: '10,000+',
      rating: 4.9,
      courses: 6
    }
  ];

  return (
    <section ref={sectionRef} className="instructors-section">
      <div className="instructors-container">
        <div className="section-header reveal">
          <div className="section-label">Expert Mentors</div>
          <h2 className="section-title">Learn from Industry Experts</h2>
          <p className="section-subtitle">
            Our instructors are professionals working at top tech companies
          </p>
        </div>

        <div className="instructors-grid">
          {instructors.map((instructor, index) => (
            <div 
              key={index} 
              className={`instructor-card reveal stagger-${(index % 4) + 1}`}
            >
              <div className="instructor-image-wrapper">
                <div className="instructor-image-placeholder">
                  <span className="instructor-initials">
                    {instructor.name.split(' ').map(n => n[0]).join('')}
                  </span>
                  <div className="company-badge">{instructor.company}</div>
                </div>
              </div>
              
              <div className="instructor-info">
                <h3 className="instructor-name">{instructor.name}</h3>
                <p className="instructor-role">{instructor.role}</p>
                
                <div className="instructor-stats">
                  <div className="instructor-stat">
                    <span className="stat-value">{instructor.students}</span>
                    <span className="stat-label">Students</span>
                  </div>
                  <div className="instructor-stat">
                    <span className="stat-value">{instructor.rating}</span>
                    <span className="stat-label">Rating</span>
                  </div>
                  <div className="instructor-stat">
                    <span className="stat-value">{instructor.courses}</span>
                    <span className="stat-label">Courses</span>
                  </div>
                </div>

                <div className="instructor-social">
                  <button className="social-btn linkedin">
                    <Linkedin size={18} />
                  </button>
                  <button className="social-btn twitter">
                    <Twitter size={18} />
                  </button>
                  <button className="view-profile-btn">
                    View Profile
                  </button>
                </div>
              </div>

              <div className="top-rated-badge">
                <Award size={16} />
                <span>Top Rated</span>
              </div>
            </div>
          ))}
        </div>

        <div className="become-instructor reveal">
          <div className="become-instructor-content">
            <h3>Are you an expert in your field?</h3>
            <p>Join our team of instructors and help shape the future of education in Pakistan</p>
            <button className="become-instructor-btn">
              Become an Instructor
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Instructors;