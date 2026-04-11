import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Award, 
  FileCheck, 
  Users, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2,
  Play,
  Star,
  Clock,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import './WhyChooseUs.css';

const WhyChooseUs = () => {
  const sectionRef = useRef(null);
  const [activeCard, setActiveCard] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const fullText = "We don't just teach code; we build careers. Our holistic approach combines theoretical knowledge with hands-on projects.";

  const cardImages = [
    {
      src: "Public/Mentor.PNG",
      label: "Expert Teaching",
      icon: <Star size={14} fill="rgb(209, 10, 23)" color="rgb(209, 10, 23)" />
    },
    {
      src: "public/Course.png",
      label: "Weekly Tasks",
      icon: <Clock size={14} color="#000B29" />
    },
    {
      src: "public/image.png",
      label: "Credit Transfer",
      icon: <Users size={14} color="#000B29" />
    },
    {
      src: "public/Certificate.png",
      label: "Certification",
      icon: <Award size={14} color="rgb(209, 10, 23)" />
    }
  ];

  const features = [
    {
      icon: <Award className="feature-icon-svg" strokeWidth={1.5} />,
      title: "Expert Mentors",
      description: "Learn from industry professionals with years of experience."
    },
    {
      icon: <FileCheck className="feature-icon-svg" strokeWidth={1.5} />,
      title: "Weekly Tasks",
      description: "Regular assignments to keep you motivated."
    },
    {
      icon: <Users className="feature-icon-svg" strokeWidth={1.5} />,
      title: "Simple Credit Transfer",
      description: "Seamless transfer between partner institutions."
    },
    {
      icon: <GraduationCap className="feature-icon-svg" strokeWidth={1.5} />,
      title: "Get Certified Easily",
      description: "Industry-recognized certificates upon completion."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cardImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleCardHover = useCallback((index) => {
    setActiveCard(index);
  }, []);

  return (
    <section className="why-choose-clear" ref={sectionRef}>
      <div className="clear-container">
        <div className={`clear-grid ${isVisible ? 'animate' : ''}`}>
          
          {/* LEFT SIDE - Left Aligned Image */}
          <div className="clear-image-side">
            <div className="left-image-wrapper">
              
              {/* Left Aligned Image Container */}
              <div className="left-image-box">
                {cardImages.map((img, index) => (
                  <div 
                    key={index}
                    className={`left-img-layer ${activeCard === index ? 'active' : ''}`}
                  >
                    <img src={img.src} alt={img.label} />
                  </div>
                ))}
              </div>
              
              {/* Tag */}
              <div className="floating-tag">
                {cardImages[activeCard].icon}
                <span>{cardImages[activeCard].label}</span>
              </div>
              
              {/* Play Button */}
              <button className="floating-play-btn">
                <Play size={24} fill="white" />
              </button>
              
              {/* Dots */}
              <div className="floating-dots">
                {cardImages.map((_, idx) => (
                  <button 
                    key={idx}
                    className={`float-dot ${activeCard === idx ? 'active' : ''}`}
                    onClick={() => setActiveCard(idx)}
                  />
                ))}
              </div>
              
            </div>
          </div>

          {/* RIGHT SIDE - Content */}
          <div className="clear-content">
            
            <div className="clear-header">
              <div className="tag">
                <BookOpen size={14} />
                <span>Why Choose Us</span>
              </div>
              
              <h2 className="title">
                We Provide <span className="red-text">Best Courses</span> For Your <span className="blue-text">Learning</span>
              </h2>
              
              <p className="desc">{fullText}</p>
            </div>

            <div className="cards-2x2">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="feature-box"
                  onMouseEnter={() => handleCardHover(index)}
                >
                  <div className="icon-wrap">
                    {feature.icon}
                  </div>
                  <h3 className="box-title">{feature.title}</h3>
                  <p className="box-desc">{feature.description}</p>
                  
                  <div className="arrow-icon">
                    <ArrowRight size={16} />
                  </div>
                </div>
              ))}
            </div>

            <div className="clear-cta">
              <button className="cta-btn">
                <span>Explore Courses</span>
                <ArrowRight size={18} />
              </button>
              <div className="trust-line">
                <CheckCircle2 size={14} color="#22c55e" />
                <span>30-day money-back guarantee</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;