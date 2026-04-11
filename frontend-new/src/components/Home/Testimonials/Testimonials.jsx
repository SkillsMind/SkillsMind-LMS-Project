import React, { useState, useEffect } from 'react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import './Testimonials.css';

// IMPORT IMAGES DIRECTLY FROM ASSETS FOLDER
import kinzaImg from '../../../assets/images/testimonials/kinza.jpg';
import khusImg from '../../../assets/images/testimonials/khus-bakhat.jpg';
import aqsaImg from '../../../assets/images/testimonials/aqsa.jpg';
import kasafImg from '../../../assets/images/testimonials/kasaf.jpg';
import abdullahImg from '../../../assets/images/testimonials/abdullah.jpg';
import nehaImg from '../../../assets/images/testimonials/neha.jpg';
import vikramImg from '../../../assets/images/testimonials/vikram.jpg';
import anjaliImg from '../../../assets/images/testimonials/anjali.jpg';

const Testimonials = () => {
  const sectionRef = useScrollAnimation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const testimonials = [
    {
      id: 1,
      name: 'Kinza Muhammad',
      role: 'Digital Marketing',
      review: 'I recently completed an online digital marketing course from Skills Mind, and it was a great experience. The course content was well-structured, informative, and easy to understand, even for beginners. The instructor was highly knowledgeable and explained concepts in a clear and engaging way.',
      rating: 5,
      batch: 'Batch 3',
      image: kinzaImg,
      initial: 'KM',
      gender: 'female'
    },
    {
      id: 2,
      name: 'Khus Bakhat',
      role: 'Shopify',
      review: 'I had great experience with Skillsmind. I was enrolled in 1st batch and the hard work and consistency of Sir Anas Iftikhar made me choose every batch as an opportunity to learn trending and useful skills upon which I can relay my future easily.',
      rating: 5,
      batch: 'Batch 1,2,3',
      image: khusImg,
      initial: 'KB',
      gender: 'male'
    },
    {
      id: 3,
      name: 'Aqsa Naseem',
      role: 'Digital Marketer',
      review: 'Being a student it was not that hard to pay for my enrollment fee even my pocket money did well here. Skillsmind focuses on making youth productive and financially strong. I learnt 3 courses and all are of great help! ✨',
      rating: 5,
      batch: 'Batch 2,3',
      image: aqsaImg,
      initial: 'AN',
      gender: 'female'
    },
    {
      id: 4,
      name: 'Kasaf Nasir',
      role: 'Tech Enthusiast',
      review: 'SkillsMind transformed my learning journey. The practical approach and real-world projects helped me understand concepts deeply. The community support is incredible and instructors are always available to help.',
      rating: 5,
      batch: 'Batch 3',
      image: kasafImg,
      initial: 'KR',
      gender: 'female'
    },
    {
      id: 5,
      name: 'Rana Abdullah',
      role: 'Web Developer',
      review: 'The best decision I ever made was joining SkillsMind. The courses are up-to-date with industry standards. Within months, I was able to build real projects and land my first internship.',
      rating: 5,
      batch: 'Batch 3',
      image: abdullahImg,
      initial: 'AB',
      gender: 'male'
    },
    {
      id: 6,
      name: 'Ahmed Naveed',
      role: 'UI/UX Designer',
      review: 'I joined with zero experience. Now I\'m leading product teams. SkillsMind changed my life completely. The mentorship and guidance I received was invaluable.',
      rating: 5,
      batch: 'Batch 1',
      image: nehaImg,
      initial: 'NG',
      gender: 'female'
    },
    {
      id: 7,
      name: 'Ahmad Raza',
      role: 'Full Stack Developer',
      review: 'The AI study assistant is a game changer. Got my dream job within 4 months of completing the course. Highly recommend SkillsMind to everyone!',
      rating: 5,
      batch: 'Batch 3',
      image: vikramImg,
      initial: 'VS',
      gender: 'male'
    },
    {
      id: 8,
      name: 'Hassaan Ali',
      role: 'Web Developer',
      review: 'Practical knowledge, amazing community, and career support. Everything you need to succeed is here at SkillsMind. Best investment in my career!',
      rating: 5,
      batch: 'Batch 2',
      image: anjaliImg,
      initial: 'AM',
      gender: 'female'
    }
  ];

  useEffect(() => {
    let interval;
    if (autoPlay) {
      interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [autoPlay, testimonials.length]);

  const nextTestimonial = () => {
    setAutoPlay(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
    setTimeout(() => setAutoPlay(true), 8000);
  };

  const prevTestimonial = () => {
    setAutoPlay(false);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setTimeout(() => setAutoPlay(true), 8000);
  };

  const getCardPosition = (index) => {
    let position = index - activeIndex;
    if (position < -2) position += testimonials.length;
    if (position > 2) position -= testimonials.length;
    return position;
  };

  const getAvatarColor = (gender) => {
    return gender === 'female' ? '#9B59B6' : '#000B29';
  };

  return (
    <section ref={sectionRef} className="testimonials-section" id="testimonials">
      <div className="testimonials-container">
        <div className="testimonials-header reveal">
          <div className="header-badge">TESTIMONIALS</div>
          <h2 className="header-title">
            What Our <span>Students Say</span>
          </h2>
          <p className="header-subtitle">
            Subscribe to watch more success stories from our graduates
          </p>
        </div>

        <div className="carousel-wrapper">
          <div className="carousel-container">
            {testimonials.map((testimonial, index) => {
              const position = getCardPosition(index);
              const isVisible = Math.abs(position) <= 2;
              
              if (!isVisible) return null;
              
              return (
                <div
                  key={testimonial.id}
                  className={`carousel-card position-${position}`}
                >
                  <div className="card-image-circle">
                    <div 
                      className="image-circle-wrapper"
                      style={{ backgroundColor: getAvatarColor(testimonial.gender) }}
                    >
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name} 
                        className="circle-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <div className="quote-mark">“</div>
                    <p className="review-text">{testimonial.review}</p>
                    <div className="rating">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="#FFB800" color="#FFB800" />
                      ))}
                    </div>
                    <div className="student-info">
                      <h4>{testimonial.name}</h4>
                      <p className="student-role">{testimonial.role}</p>
                      <div className="batch-badge">{testimonial.batch}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button onClick={prevTestimonial} className="nav-arrow prev">
            <ChevronLeft size={28} />
          </button>
          <button onClick={nextTestimonial} className="nav-arrow next">
            <ChevronRight size={28} />
          </button>
        </div>
        
        <div className="dots-indicator">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`dot ${activeIndex === index ? 'active' : ''}`}
              onClick={() => {
                setAutoPlay(false);
                setActiveIndex(index);
                setTimeout(() => setAutoPlay(true), 8000);
              }}
            />
          ))}
        </div>
        
        <div className="testimonials-footer">
          <p>✨ Real reviews from <strong>Batch 1, 2, 3, 4</strong> students • 500+ success stories</p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;