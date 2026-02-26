import React, { useState } from 'react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { Quote, ChevronLeft, ChevronRight, Star, Play } from 'lucide-react';
import './Testimonials.css';

const Testimonials = () => {
  const sectionRef = useScrollAnimation();
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      name: 'Muhammad Ali',
      role: 'Frontend Developer',
      company: 'Systems Limited',
      image: 'ali.jpg',
      quote: 'SkillsMind transformed my career. I went from zero coding knowledge to landing a job at a top tech company in just 6 months. The live classes and mentorship were game-changers.',
      salaryBefore: '0',
      salaryAfter: '80,000',
      rating: 5
    },
    {
      name: 'Ayesha Khan',
      role: 'UI/UX Designer',
      company: 'Arbisoft',
      image: 'ayesha.jpg',
      quote: 'The practical approach of teaching here is amazing. I built a portfolio that actually got me interviews. The instructors are always there to help, even after course completion.',
      salaryBefore: '30,000',
      salaryAfter: '120,000',
      rating: 5
    },
    {
      name: 'Usman Tariq',
      role: 'Data Analyst',
      company: 'Jazz',
      image: 'usman.jpg',
      quote: 'Best investment I ever made. The AI study assistant helped me understand complex concepts easily. The community support is incredible too.',
      salaryBefore: '45,000',
      salaryAfter: '150,000',
      rating: 5
    }
  ];

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section ref={sectionRef} className="testimonials-section">
      <div className="testimonials-container">
        <div className="section-header reveal">
          <div className="section-label">Success Stories</div>
          <h2 className="section-title">Student Achievements</h2>
          <p className="section-subtitle">
            Real stories from real students who transformed their careers
          </p>
        </div>

        <div className="testimonials-content">
          <div className="testimonial-main reveal">
            <div className="quote-icon">
              <Quote size={48} fill="currentColor" />
            </div>
            
            <div className="testimonial-slider">
              <div 
                className="testimonial-slide"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="testimonial-item">
                    <p className="testimonial-quote">{testimonial.quote}</p>
                    
                    <div className="testimonial-author">
                      <div className="author-avatar">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="author-info">
                        <h4>{testimonial.name}</h4>
                        <span>{testimonial.role} at {testimonial.company}</span>
                      </div>
                      <div className="rating">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} size={16} fill="#fbbf24" className="star" />
                        ))}
                      </div>
                    </div>

                    <div className="salary-comparison">
                      <div className="salary-box before">
                        <span className="salary-label">Before</span>
                        <span className="salary-value">Rs. {testimonial.salaryBefore}</span>
                      </div>
                      <div className="salary-arrow">→</div>
                      <div className="salary-box after">
                        <span className="salary-label">After</span>
                        <span className="salary-value">Rs. {testimonial.salaryAfter}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="slider-controls">
              <button onClick={prevTestimonial} className="slider-btn">
                <ChevronLeft size={24} />
              </button>
              <div className="slider-dots">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${activeIndex === index ? 'active' : ''}`}
                    onClick={() => setActiveIndex(index)}
                  />
                ))}
              </div>
              <button onClick={nextTestimonial} className="slider-btn">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className="video-testimonials reveal-right">
            <h3>Watch Success Stories</h3>
            <div className="video-grid">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className={`video-card stagger-${index + 1}`}>
                  <div className="video-thumbnail">
                    <div className="play-btn">
                      <Play size={24} fill="currentColor" />
                    </div>
                    <span className="video-duration">2:45</span>
                  </div>
                  <p>How I got hired at {['Google', 'Microsoft', 'Amazon'][index]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;