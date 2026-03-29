import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  Code, 
  Megaphone, 
  Camera, 
  BarChart3, 
  Palette, 
  Database, 
  Sparkles, 
  Brain, 
  Target, 
  Clock, 
  BookOpen, 
  Award, 
  CheckCircle, 
  ArrowRight,
  X,
  School,
  Briefcase,
  Lightbulb,
  Monitor,
  Smartphone,
  Globe,
  Zap,
  Search,
  HelpCircle,
  Clock3,
  Laptop,
  Phone,
  Languages,
  Puzzle,
  Coffee
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './CourseSection.css';

const categories = [
  {
    id: 1,
    title: 'Programming',
    description: 'Master coding with Python, JavaScript, and modern frameworks.',
    icon: Code,
    courses: 24,
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
    category: 'Development',
    tags: ['Beginner', 'Career Change', 'High Salary', 'Remote Work']
  },
  {
    id: 2,
    title: 'Digital Marketing',
    description: 'Learn SEO, SEM, and social media marketing strategies.',
    icon: Megaphone,
    courses: 18,
    image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&q=80',
    category: 'Marketing',
    tags: ['Freelancing', 'Beginner', 'Quick Start', 'Business']
  },
  {
    id: 3,
    title: 'Photography',
    description: 'Professional photography and photo editing techniques.',
    icon: Camera,
    courses: 12,
    image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=80',
    category: 'Design',
    tags: ['Creative', 'Freelancing', 'Personal Interest', 'Side Hustle']
  },
  {
    id: 4,
    title: 'Data Science',
    description: 'Analytics, visualization, and machine learning basics.',
    icon: BarChart3,
    courses: 15,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    category: 'Development',
    tags: ['Advanced', 'High Salary', 'Career Change', 'Math Skills']
  },
  {
    id: 5,
    title: 'Graphic Design',
    description: 'Create stunning visuals with industry-standard tools.',
    icon: Palette,
    courses: 20,
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80',
    category: 'Design',
    tags: ['Creative', 'Freelancing', 'Beginner', 'Portfolio']
  },
  {
    id: 6,
    title: 'UI/UX Design',
    description: 'Design beautiful interfaces and user experiences.',
    icon: Palette,
    courses: 16,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    category: 'Design',
    tags: ['Creative', 'High Demand', 'Remote Work', 'Tech']
  },
  {
    id: 7,
    title: 'Web Development',
    description: 'Build modern websites with latest technologies.',
    icon: Code,
    courses: 22,
    image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80',
    category: 'Development',
    tags: ['High Demand', 'Freelancing', 'Remote Work', 'Career Change']
  },
  {
    id: 8,
    title: 'Database Management',
    description: 'SQL, NoSQL, and cloud database administration.',
    icon: Database,
    courses: 14,
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80',
    category: 'Development',
    tags: ['Advanced', 'Enterprise', 'High Salary', 'Backend']
  }
];

const categoryTabs = ['All', 'Development', 'Design', 'Marketing', 'Business'];

// Enhanced AI Questions - 4 Sections
const aiQuestions = [
  // Section 1: Basic & Educational Background
  {
    id: 1,
    section: "Basic & Educational Background",
    sectionIcon: School,
    question: "What's your current education level?",
    icon: GraduationCap,
    options: ["Matric", "Intermediate", "Graduate", "Job Holder"]
  },
  {
    id: 2,
    section: "Basic & Educational Background",
    sectionIcon: School,
    question: "What was your field of study?",
    icon: BookOpen,
    options: ["ICS/Computer Science", "Pre-Medical", "Commerce", "Arts/Humanities", "Engineering"]
  },
  {
    id: 3,
    section: "Basic & Educational Background",
    sectionIcon: School,
    question: "Do you have any prior knowledge in tech?",
    icon: Lightbulb,
    options: ["Yes, I know coding basics", "Yes, design/marketing basics", "No, I'm a complete beginner", "Some self-taught skills"]
  },
  
  // Section 2: Career Goals & Interests
  {
    id: 4,
    section: "Career Goals & Interests",
    sectionIcon: Target,
    question: "What's your primary career goal?",
    icon: Briefcase,
    options: ["Get a Job", "Start Freelancing", "Build my own Business", "Skill Upgrade", "Personal Interest"]
  },
  {
    id: 5,
    section: "Career Goals & Interests",
    sectionIcon: Target,
    question: "What interests you the most?",
    icon: Zap,
    options: ["Logic & Problem Solving", "Creativity & Art", "Communication & Selling", "Data & Analysis", "Building Things"]
  },
  {
    id: 6,
    section: "Career Goals & Interests",
    sectionIcon: Target,
    question: "What's your ideal job role?",
    icon: Monitor,
    options: ["Web Developer", "Graphic Designer", "SEO/Digital Marketer", "Data Analyst", "App Developer", "UI/UX Designer"]
  },
  
  // Section 3: Practical Constraints
  {
    id: 7,
    section: "Practical Constraints",
    sectionIcon: Clock,
    question: "Daily time commitment?",
    icon: Clock3,
    options: ["1-2 hours", "2-4 hours", "4-6 hours", "6+ hours"]
  },
  {
    id: 8,
    section: "Practical Constraints",
    sectionIcon: Clock,
    question: "What device do you have?",
    icon: Laptop,
    options: ["Laptop/PC", "Desktop Computer", "Tablet + Keyboard", "Only Mobile Phone"]
  },
  {
    id: 9,
    section: "Practical Constraints",
    sectionIcon: Clock,
    question: "Preferred learning language?",
    icon: Languages,
    options: ["Urdu/Hindi", "English", "Mix of Both", "Any Language"]
  },
  
  // Section 4: Behavioral Questions
  {
    id: 10,
    section: "Behavioral Assessment",
    sectionIcon: Brain,
    question: "How do you handle difficult problems?",
    icon: Puzzle,
    options: ["Google & research myself", "Break it into smaller parts", "Ask someone for help", "Try trial & error"]
  },
  {
    id: 11,
    section: "Behavioral Assessment",
    sectionIcon: Brain,
    question: "Can you focus on one screen for hours solving errors?",
    icon: Coffee,
    options: ["Yes, I love the challenge", "Yes, if I'm making progress", "No, I get frustrated easily", "I prefer variety in tasks"]
  }
];

const CourseSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('All');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [recommendedCourse, setRecommendedCourse] = useState(null);
  
  const sectionRef = useRef(null);
  const aiRef = useRef(null);
  const autoPlayRef = useRef(null);
  const mobileContainerRef = useRef(null);

  const filteredCategories = activeTab === 'All' 
    ? categories 
    : categories.filter(cat => cat.category === activeTab);

  const cardsPerView = 4;
  const totalCards = filteredCategories.length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    setMobileIndex(0);
  }, [activeTab]);

  // Desktop autoplay only - NO mobile autoplay
  useEffect(() => {
    if (isMobile || !isVisible || showAIAssistant) return;
    
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => 
        prev + 1 >= totalCards - cardsPerView + 1 ? 0 : prev + 1
      );
    }, 2500);

    return () => clearInterval(autoPlayRef.current);
  }, [totalCards, isMobile, isVisible, activeTab, showAIAssistant]);

  useEffect(() => {
    if (showAIAssistant && aiRef.current) {
      setTimeout(() => {
        aiRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showAIAssistant]);

  const nextSlide = () => {
    if (isAnimating || isMobile) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => 
      prev + 1 >= totalCards - cardsPerView + 1 ? 0 : prev + 1
    );
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating || isMobile) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => 
      prev === 0 ? totalCards - cardsPerView : prev - 1
    );
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleMouseEnter = () => {
    if (!isMobile) clearInterval(autoPlayRef.current);
  };

  const handleMouseLeave = () => {
    if (!isMobile && !showAIAssistant) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => 
          prev + 1 >= totalCards - cardsPerView + 1 ? 0 : prev + 1
        );
      }, 2500);
    }
  };

  // Handle horizontal scroll for mobile
  const handleMobileScroll = (e) => {
    const container = e.target;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.offsetWidth * 0.85 + 16; // card width + gap
    const newIndex = Math.round(scrollLeft / cardWidth);
    setMobileIndex(Math.min(newIndex, filteredCategories.length - 1));
  };

  const openAIAssistant = () => {
    setShowAIAssistant(true);
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    setRecommendedCourse(null);
  };

  const closeAIAssistant = () => {
    setShowAIAssistant(false);
    setTimeout(() => {
      setCurrentStep(0);
      setAnswers({});
      setShowResult(false);
      setRecommendedCourse(null);
    }, 500);
  };

  const handleAnswer = (answer) => {
    const newAnswers = { ...answers, [currentStep]: answer };
    setAnswers(newAnswers);
    
    if (currentStep < aiQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsAnalyzing(true);
      setTimeout(() => {
        const course = getSmartRecommendation(newAnswers);
        setRecommendedCourse(course);
        setIsAnalyzing(false);
        setShowResult(true);
      }, 2500);
    }
  };

  const getSmartRecommendation = (userAnswers) => {
    let bestMatch = null;
    let highestScore = 0;

    const education = userAnswers[0];
    const fieldOfStudy = userAnswers[1];
    const priorKnowledge = userAnswers[2];
    const careerGoal = userAnswers[3];
    const interest = userAnswers[4];
    const idealJob = userAnswers[5];
    const device = userAnswers[7];
    const problemSolving = userAnswers[9];
    const patience = userAnswers[10];

    categories.forEach(course => {
      let score = 0;

      if (idealJob === "Web Developer" && course.title === "Web Development") score += 5;
      if (idealJob === "Graphic Designer" && course.title === "Graphic Design") score += 5;
      if (idealJob === "SEO/Digital Marketer" && course.title === "Digital Marketing") score += 5;
      if (idealJob === "Data Analyst" && course.title === "Data Science") score += 5;
      if (idealJob === "App Developer" && course.title === "Programming") score += 4;
      if (idealJob === "UI/UX Designer" && course.title === "UI/UX Design") score += 5;

      if (interest === "Logic & Problem Solving" && course.category === "Development") score += 3;
      if (interest === "Creativity & Art" && course.category === "Design") score += 3;
      if (interest === "Communication & Selling" && course.category === "Marketing") score += 3;
      if (interest === "Data & Analysis" && course.title === "Data Science") score += 3;
      if (interest === "Building Things" && course.title === "Web Development") score += 3;

      if (careerGoal === "Get a Job" && course.tags.includes("High Demand")) score += 2;
      if (careerGoal === "Start Freelancing" && course.tags.includes("Freelancing")) score += 3;
      if (careerGoal === "Build my own Business" && course.category === "Marketing") score += 2;
      if (careerGoal === "Skill Upgrade" && course.tags.includes("Advanced")) score += 2;

      if (device === "Only Mobile Phone" && course.category === "Design") score += 2;
      if (device === "Only Mobile Phone" && course.category === "Development") score -= 2;

      if (patience === "Yes, I love the challenge" && course.category === "Development") score += 2;
      if (patience === "No, I get frustrated easily" && course.category === "Design") score += 2;

      if (priorKnowledge === "Yes, I know coding basics" && course.category === "Development") score += 2;
      if (priorKnowledge === "Yes, design/marketing basics" && course.category === "Design") score += 2;
      if (priorKnowledge === "No, I'm a complete beginner" && course.tags.includes("Beginner")) score += 2;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = course;
      }
    });

    if (!bestMatch) {
      if (careerGoal === "Start Freelancing") bestMatch = categories[4];
      else if (interest === "Logic & Problem Solving") bestMatch = categories[6];
      else if (interest === "Creativity & Art") bestMatch = categories[4];
      else bestMatch = categories[0];
    }

    return bestMatch;
  };

  const resetAI = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    setRecommendedCourse(null);
  };

  const currentQuestion = aiQuestions[currentStep];
  const CurrentSectionIcon = currentQuestion.sectionIcon;
  const CurrentQuestionIcon = currentQuestion.icon;

  return (
    <section 
      className={`course-section-simple ${isVisible ? 'is-visible' : ''} ${isMobile ? 'is-mobile' : ''} ${showAIAssistant ? 'ai-active' : ''}`} 
      id="courses"
      ref={sectionRef}
    >
      <div className="course-container-simple">
        
        {/* Section Header */}
        <div className="section-header-simple">
          <div className="section-badge-simple">
            <GraduationCap size={20} />
            <span>EXPLORE COURSES</span>
            <GraduationCap size={20} />
          </div>
          <h2 className="section-title-simple">
            Our Courses
          </h2>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs-wrapper">
          <div className="category-tabs">
            {categoryTabs.map((tab) => (
              <button
                key={tab}
                className={`category-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Slider - Only show on desktop */}
        {!isMobile && (
          <div className="slider-outer desktop-only">
            <button 
              className="slider-arrow outside prev" 
              onClick={prevSlide}
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>

            <div 
              className="slider-simple"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="cards-wrapper-simple">
                <div 
                  className="cards-track-simple"
                  style={{ transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)` }}
                >
                  {filteredCategories.map((category, index) => {
                    const IconComponent = category.icon;
                    return (
                      <div 
                        key={category.id} 
                        className="category-card-simple"
                        style={{ '--delay': `${index * 0.1}s` }}
                      >
                        <div 
                          className="card-bg-image" 
                          style={{ backgroundImage: `url(${category.image})` }}
                        />
                        <div className="card-overlay"></div>
                        <div className="card-inner">
                          <div className="card-icon-box">
                            <IconComponent size={28} strokeWidth={1.5} />
                          </div>
                          <h3 className="card-title-simple">{category.title}</h3>
                          <p className="card-desc-simple">{category.description}</p>
                          <Link to={`/courses/${category.title.toLowerCase().replace(' ', '-')}`} className="read-more-link">
                            Read More
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button 
              className="slider-arrow outside next" 
              onClick={nextSlide}
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Mobile Cards - Horizontal Scroll Professional Design */}
        {isMobile && (
          <>
            <div 
              ref={mobileContainerRef}
              className="mobile-cards-container"
              onScroll={handleMobileScroll}
            >
              {filteredCategories.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <div 
                    key={category.id} 
                    className="mobile-card"
                    style={{ '--delay': `${index * 0.1}s` }}
                  >
                    <div 
                      className="mobile-card-bg" 
                      style={{ backgroundImage: `url(${category.image})` }}
                    />
                    <div className="mobile-card-content">
                      <div className="mobile-card-icon">
                        <IconComponent size={28} strokeWidth={1.5} />
                      </div>
                      <h3 className="mobile-card-title">{category.title}</h3>
                      <p className="mobile-card-desc">{category.description}</p>
                      <div className="mobile-card-meta">
                        <span>
                          <BookOpen size={14} />
                          {category.courses} Courses
                        </span>
                        <span>•</span>
                        <span>{category.category}</span>
                      </div>
                      <Link to={`/courses/${category.title.toLowerCase().replace(' ', '-')}`} className="mobile-read-more">
                        Explore Course
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Mobile Scroll Indicators */}
            <div className="mobile-scroll-indicator">
              {filteredCategories.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`mobile-scroll-dot ${idx === mobileIndex ? 'active' : ''}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Dual Buttons */}
        <div className="dual-buttons-wrapper">
          <Link to="/courses" className="view-all-link">
            View All Courses
            <ChevronRight size={18} />
          </Link>
          {!showAIAssistant ? (
            <button onClick={openAIAssistant} className="ai-suggestion-link">
              <Sparkles size={18} />
              AI Course Suggestion
            </button>
          ) : (
            <button onClick={closeAIAssistant} className="ai-suggestion-link active">
              <X size={18} />
              Close AI Assistant
            </button>
          )}
        </div>

        {/* AI Course Suggestion */}
        <div 
          ref={aiRef}
          className={`ai-assistant-container ${showAIAssistant ? 'expanded' : ''}`}
        >
          {showAIAssistant && (
            <div className="ai-assistant-content">
              <div className="ai-assistant-header">
                <div className="ai-assistant-title">
                  <div className="ai-pulse-icon">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3>AI Course Advisor</h3>
                    <p>Complete all sections to get your personalized career path</p>
                  </div>
                </div>
                {!showResult && (
                  <div className="ai-step-indicator">
                    <span>Question {currentStep + 1} of {aiQuestions.length}</span>
                    <div className="ai-step-bar">
                      <div 
                        className="ai-step-progress" 
                        style={{ width: `${((currentStep + 1) / aiQuestions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="ai-assistant-body">
                {isAnalyzing ? (
                  <div className="ai-analyzing-section">
                    <div className="ai-brain-animation">
                      <Brain size={64} />
                      <div className="ai-ripples">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                    <h4>AI Analyzing Your Profile...</h4>
                    <p>Matching your skills, goals & personality with perfect courses</p>
                    <div className="ai-analyzing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                ) : showResult && recommendedCourse ? (
                  <div className="ai-result-section">
                    <div className="ai-result-badge">
                      <CheckCircle size={20} />
                      <span>Perfect Match Found!</span>
                    </div>
                    
                    <div className="ai-recommendation-card-premium">
                      <div className="ai-rec-card-glow"></div>
                      <div className="ai-rec-card-inner">
                        <div 
                          className="ai-rec-image-premium" 
                          style={{ backgroundImage: `url(${recommendedCourse.image})` }}
                        >
                          <div className="ai-rec-image-overlay"></div>
                          <div className="ai-rec-match-badge">
                            <Sparkles size={16} />
                            <span>98% Match</span>
                          </div>
                          <div className="ai-rec-floating-icon">
                            {React.createElement(recommendedCourse.icon, { size: 40 })}
                          </div>
                        </div>
                        
                        <div className="ai-rec-content-premium">
                          <div className="ai-rec-header">
                            <h4>{recommendedCourse.title}</h4>
                            <div className="ai-rec-category">{recommendedCourse.category}</div>
                          </div>
                          
                          <p className="ai-rec-description">{recommendedCourse.description}</p>
                          
                          <div className="ai-rec-stats">
                            <div className="ai-stat">
                              <BookOpen size={16} />
                              <span>{recommendedCourse.courses} Courses</span>
                            </div>
                            <div className="ai-stat">
                              <Clock size={16} />
                              <span>3-6 Months</span>
                            </div>
                            <div className="ai-stat">
                              <Award size={16} />
                              <span>Certificate</span>
                            </div>
                          </div>
                          
                          <div className="ai-rec-tags-premium">
                            {recommendedCourse.tags.map((tag, idx) => (
                              <span key={idx} className="ai-rec-tag-premium">{tag}</span>
                            ))}
                          </div>
                          
                          <div className="ai-rec-actions-premium">
                            <Link 
                              to={`/courses/${recommendedCourse.title.toLowerCase().replace(' ', '-')}`} 
                              className="ai-enroll-btn-premium"
                            >
                              <span>Start Learning Now</span>
                              <ArrowRight size={18} />
                            </Link>
                            <button onClick={resetAI} className="ai-retake-btn-premium">
                              <Search size={16} />
                              <span>Retake Assessment</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ai-question-section-enhanced">
                    <div className="ai-section-indicator">
                      <div className="ai-section-icon-wrapper">
                        <CurrentSectionIcon size={24} />
                      </div>
                      <div className="ai-section-info">
                        <span className="ai-section-label">Current Section</span>
                        <span className="ai-section-name">{currentQuestion.section}</span>
                      </div>
                      <div className="ai-section-progress">
                        {aiQuestions.filter(q => q.section === currentQuestion.section).length} questions
                      </div>
                    </div>

                    <div className="ai-question-header-enhanced">
                      <div className="ai-question-icon-wrapper">
                        <CurrentQuestionIcon size={32} />
                      </div>
                      <h4>{currentQuestion.question}</h4>
                    </div>

                    <div className="ai-options-grid-enhanced">
                      {currentQuestion.options.map((option, idx) => (
                        <button 
                          key={idx} 
                          className="ai-option-card-enhanced"
                          onClick={() => handleAnswer(option)}
                          style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                          <div className="ai-option-content">
                            <span className="ai-option-number">0{idx + 1}</span>
                            <span className="ai-option-text">{option}</span>
                          </div>
                          <div className="ai-option-arrow-wrapper">
                            <ArrowRight size={20} />
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="ai-progress-dots">
                      {aiQuestions.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`ai-dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default CourseSection;