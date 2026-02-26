import React, { useEffect, useRef } from 'react';
import './Account.css';
import { User, FileText, GraduationCap, CheckCircle } from 'lucide-react';

const Account = () => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const stepsRef = useRef([]);
  const videoRef = useRef(null);
  const badgesRef = useRef(null);

  const steps = [
    {
      icon: <User size={20} />,
      title: "Create Your Account",
      description: "Sign up with your email or social accounts. Fill in your basic information and verify your email address to get started.",
      step: "01"
    },
    {
      icon: <FileText size={20} />,
      title: "Complete Your Profile",
      description: "Add your educational background, interests, and learning goals. This helps us recommend the best courses for you.",
      step: "02"
    },
    {
      icon: <GraduationCap size={20} />,
      title: "Start Learning",
      description: "Browse courses, enroll in your favorites, and begin your learning journey. Track your progress and earn certificates.",
      step: "03"
    }
  ];

  // Typewriter effect for heading
  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;
    
    const text = title.innerHTML;
    title.innerHTML = '';
    title.style.opacity = '1';
    
    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        title.innerHTML = text.substring(0, i + 1);
        i++;
        setTimeout(typeWriter, 30);
      }
    };
    
    // Start typewriter after a small delay
    setTimeout(typeWriter, 300);
  }, []);

  // Scroll animations using Intersection Observer
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe step cards
    stepsRef.current.forEach((step, index) => {
      if (step) {
        step.style.transitionDelay = `${index * 0.15}s`;
        observer.observe(step);
      }
    });

    // Observe video
    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    // Observe badges
    if (badgesRef.current) {
      observer.observe(badgesRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="register-section" ref={sectionRef}>
      <div className="register-container">
        
        {/* Left Side - Steps */}
        <div className="steps-content">
          <div className="section-badge">
            <span>How It Works</span>
          </div>
          
          <h2 className="section-title" ref={titleRef}>
            Get Started With <br />
            <span className="highlight">SkillsMind</span> Today
          </h2>
          
          <p className="section-subtitle">
            Join thousands of students already learning on our platform. 
            Follow these simple steps to begin your journey.
          </p>

          <div className="steps-list">
            {steps.map((item, index) => (
              <div 
                className="step-item scroll-animate" 
                key={index}
                ref={el => stepsRef.current[index] = el}
              >
                <div className="step-number">{item.step}</div>
                <div className="step-icon-box">{item.icon}</div>
                <div className="step-info">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="trust-badges scroll-animate-bottom" ref={badgesRef}>
            <div className="badge">
              <CheckCircle size={14} />
              <span>Free Registration</span>
            </div>
            <div className="badge">
              <CheckCircle size={14} />
              <span>Lifetime Access</span>
            </div>
          </div>
        </div>

        {/* Right Side - Video with scroll animation */}
        <div className="video-content scroll-animate-fade" ref={videoRef}>
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            poster="/images/video-poster.jpg"
          >
            <source src="/videos/Register process.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

      </div>
    </section>
  );
};

export default Account;