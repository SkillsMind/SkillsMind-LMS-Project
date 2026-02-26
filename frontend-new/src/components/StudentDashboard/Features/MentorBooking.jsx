import React, { useState } from 'react';
import { Calendar, Clock, Video, Star, CheckCircle, Award, MessageCircle } from 'lucide-react';
import './MentorBooking.css';

const MentorBooking = () => {
  const [mentors] = useState([
    { 
      id: 1, 
      name: 'Sir Ahmad Ali', 
      expertise: 'Senior React Developer',
      company: 'Tech Solutions Inc.',
      rating: 4.9, 
      reviews: 128,
      availability: 'Today, 3:00 PM',
      avatar: 'AA',
      tags: ['React', 'Node.js', 'System Design'],
      price: '$50/hr'
    },
    { 
      id: 2, 
      name: 'Ms. Fatima Khan', 
      expertise: 'UI/UX Lead Designer',
      company: 'Creative Studio',
      rating: 5.0, 
      reviews: 89,
      availability: 'Tomorrow, 10:00 AM',
      avatar: 'FK',
      tags: ['Figma', 'UI/UX', 'Branding'],
      price: '$45/hr'
    },
    { 
      id: 3, 
      name: 'Hassan Raza', 
      expertise: 'Freelancing Expert',
      company: 'Upwork Top Rated',
      rating: 4.8, 
      reviews: 234,
      availability: 'Today, 6:00 PM',
      avatar: 'HR',
      tags: ['Freelancing', 'Client Mgmt', 'Proposals'],
      price: '$40/hr'
    }
  ]);

  return (
    <div className="feature-container">
      <div className="feature-header">
        <h2>👨‍🏫 Book a Mentor</h2>
        <p>1-on-1 sessions with industry experts</p>
      </div>

      <div className="booking-intro">
        <div className="intro-card">
          <Award className="w-8 h-8 text-yellow-500" />
          <div>
            <h4>Expert Guidance</h4>
            <p>Learn from professionals working at top companies</p>
          </div>
        </div>
        <div className="intro-card">
          <Clock className="w-8 h-8 text-blue-500" />
          <div>
            <h4>Flexible Timing</h4>
            <p>Book sessions that fit your schedule</p>
          </div>
        </div>
        <div className="intro-card">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div>
            <h4>Verified Mentors</h4>
            <p>All mentors are vetted and reviewed</p>
          </div>
        </div>
      </div>

      <div className="mentors-list">
        {mentors.map((mentor) => (
          <div key={mentor.id} className="mentor-profile-card">
            <div className="mentor-header">
              <div className="mentor-avatar-large" style={{ background: `hsl(${mentor.id * 60}, 70%, 50%)` }}>
                {mentor.avatar}
              </div>
              <div className="mentor-title">
                <h3>{mentor.name}</h3>
                <p className="expertise">{mentor.expertise}</p>
                <p className="company">{mentor.company}</p>
              </div>
              <div className="mentor-price">
                <span>{mentor.price}</span>
              </div>
            </div>

            <div className="mentor-tags">
              {mentor.tags.map((tag, idx) => (
                <span key={idx} className="mentor-tag">{tag}</span>
              ))}
            </div>

            <div className="mentor-stats-row">
              <div className="rating-large">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span>{mentor.rating}</span>
                <small>({mentor.reviews} reviews)</small>
              </div>
              <div className="next-available">
                <Clock className="w-4 h-4" />
                <span>Next: {mentor.availability}</span>
              </div>
            </div>

            <div className="mentor-actions">
              <button className="view-profile-btn">
                <MessageCircle className="w-4 h-4" />
                Message
              </button>
              <button className="book-session-btn">
                <Video className="w-4 h-4" />
                Book Session
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentorBooking;