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
  Clock3,
  Laptop,
  Languages,
  Puzzle,
  Coffee
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseSection.css';

const iconMap = {
  'Development': Code,
  'Design': Palette,
  'Marketing': Megaphone,
  'Business': Briefcase,
  'default': Code
};

const defaultImages = [
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
  'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&q=80',
  'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=80'
];

const categoryTabs = ['All', 'Development', 'Design', 'Marketing', 'Business'];

const aiQuestions = [
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
    icon: Brain,
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
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('All');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [recommendedCourse, setRecommendedCourse] = useState(null);
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const sectionRef = useRef(null);
  const aiRef = useRef(null);
  const autoPlayRef = useRef(null);
  const mobileContainerRef = useRef(null);

  const backendURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // ============================================
  // LOGIN CHECK FUNCTION
  // ============================================
  const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    return token && userId;
  };

  // ============================================
  // HANDLE CARD CLICK - NEW FUNCTION FOR FULL CARD CLICK
  // ============================================
  const handleCardClick = (courseId) => {
    if (isLoggedIn()) {
      navigate(`/get-enrolment?course=${courseId}&enroll=true`);
    } else {
      localStorage.setItem('redirectAfterLogin', `/get-enrolment?course=${courseId}&enroll=true`);
      navigate('/login');
    }
  };

  // ============================================
  // HANDLE COURSE CLICK / ENROLLMENT - FOR READ MORE BUTTON
  // ============================================
  const handleCourseNavigation = (courseId, e) => {
    e.stopPropagation(); // Prevent event bubbling to card click
    if (isLoggedIn()) {
      navigate(`/get-enrolment?course=${courseId}&enroll=true`);
    } else {
      localStorage.setItem('redirectAfterLogin', `/get-enrolment?course=${courseId}&enroll=true`);
      navigate('/login');
    }
  };

  // Handle View All Courses Click
  const handleViewAllCourses = () => {
    if (isLoggedIn()) {
      navigate('/get-enrolment');
    } else {
      localStorage.setItem('redirectAfterLogin', '/get-enrolment');
      navigate('/login');
    }
  };

  // AI Recommendation Enroll button
  const handleAIEnroll = (courseId) => {
    if (isLoggedIn()) {
      navigate(`/get-enrolment?course=${courseId}&enroll=true`);
    } else {
      localStorage.setItem('redirectAfterLogin', `/get-enrolment?course=${courseId}&enroll=true`);
      navigate('/login');
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${backendURL}/${cleanPath}`;
  };

  // Fetch courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${backendURL}/api/courses/all`);
        const fetchedCourses = Array.isArray(res.data) ? res.data : [];
        
        const transformedCourses = fetchedCourses.map((course, index) => ({
          id: course._id,
          _id: course._id,
          title: course.title || 'Untitled Course',
          description: course.description || course.shortDescription || 'Learn professional skills with this comprehensive course.',
          icon: iconMap[course.category] || iconMap['default'],
          courses: course.coursesCount || 12,
          image: course.thumbnail ? getImageUrl(course.thumbnail) : defaultImages[index % defaultImages.length],
          category: course.category || 'Development',
          tags: course.tags || ['Beginner', 'Career Change', 'High Salary', 'Remote Work'],
          price: course.price || 0,
          duration: course.duration || '3 Months',
          level: course.level || 'Beginner',
          instructor: course.instructor,
          syllabus: course.syllabus,
          enrolledStudents: course.enrolledStudents || 0,
          badge: course.badge || 'PREMIUM',
          isHide: course.isHide
        }));
        
        setCourses(transformedCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [backendURL]);

  const filteredCategories = activeTab === 'All' 
    ? courses.filter(c => !c.isHide) 
    : courses.filter(cat => cat.category === activeTab && !cat.isHide);

  const cardsPerView = 4;
  const totalCards = filteredCategories.length;

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset index when tab changes
  useEffect(() => {
    setCurrentIndex(0);
    setMobileIndex(0);
  }, [activeTab]);

  // Auto-play slider
  useEffect(() => {
    if (isMobile || !isVisible || showAIAssistant || loading || totalCards === 0) return;
    
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => 
        prev + 1 >= Math.max(1, totalCards - cardsPerView + 1) ? 0 : prev + 1
      );
    }, 2500);

    return () => clearInterval(autoPlayRef.current);
  }, [totalCards, isMobile, isVisible, activeTab, showAIAssistant, loading]);

  // Scroll to AI assistant when opened
  useEffect(() => {
    if (showAIAssistant && aiRef.current) {
      setTimeout(() => {
        aiRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showAIAssistant]);

  const nextSlide = () => {
    if (isAnimating || isMobile || totalCards === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => 
      prev + 1 >= totalCards - cardsPerView + 1 ? 0 : prev + 1
    );
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating || isMobile || totalCards === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, totalCards - cardsPerView) : prev - 1
    );
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleMouseEnter = () => {
    if (!isMobile && autoPlayRef.current) clearInterval(autoPlayRef.current);
  };

  const handleMouseLeave = () => {
    if (!isMobile && !showAIAssistant && !loading && totalCards > 0) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => 
          prev + 1 >= totalCards - cardsPerView + 1 ? 0 : prev + 1
        );
      }, 2500);
    }
  };

  const handleMobileScroll = (e) => {
    const container = e.target;
    const scrollLeft = container.scrollLeft;
    const cardWidth = 320;
    const newIndex = Math.round(scrollLeft / cardWidth);
    setMobileIndex(Math.min(newIndex, Math.max(0, filteredCategories.length - 1)));
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

    const idealJob = userAnswers[5];
    const interest = userAnswers[4];
    const careerGoal = userAnswers[3];
    const device = userAnswers[7];
    const patience = userAnswers[10];
    const priorKnowledge = userAnswers[2];

    courses.forEach(course => {
      let score = 0;
      const title = (course.title || '').toLowerCase();

      if (idealJob === "Web Developer" && title.includes('web')) score += 5;
      if (idealJob === "Graphic Designer" && title.includes('graphic')) score += 5;
      if (idealJob === "SEO/Digital Marketer" && title.includes('marketing')) score += 5;
      if (idealJob === "Data Analyst" && title.includes('data')) score += 5;
      if (idealJob === "App Developer" && title.includes('programming')) score += 4;
      if (idealJob === "UI/UX Designer" && title.includes('ui/ux')) score += 5;

      if (interest === "Logic & Problem Solving" && course.category === "Development") score += 3;
      if (interest === "Creativity & Art" && course.category === "Design") score += 3;
      if (interest === "Communication & Selling" && course.category === "Marketing") score += 3;
      if (interest === "Data & Analysis" && title.includes('data')) score += 3;
      if (interest === "Building Things" && title.includes('web')) score += 3;

      if (careerGoal === "Get a Job" && course.tags?.includes("High Demand")) score += 2;
      if (careerGoal === "Start Freelancing" && course.tags?.includes("Freelancing")) score += 3;
      if (careerGoal === "Build my own Business" && course.category === "Marketing") score += 2;
      if (careerGoal === "Skill Upgrade" && course.tags?.includes("Advanced")) score += 2;

      if (device === "Only Mobile Phone" && course.category === "Design") score += 2;
      if (device === "Only Mobile Phone" && course.category === "Development") score -= 2;

      if (patience === "Yes, I love the challenge" && course.category === "Development") score += 2;
      if (patience === "No, I get frustrated easily" && course.category === "Design") score += 2;

      if (priorKnowledge === "Yes, I know coding basics" && course.category === "Development") score += 2;
      if (priorKnowledge === "Yes, design/marketing basics" && course.category === "Design") score += 2;
      if (priorKnowledge === "No, I'm a complete beginner" && course.tags?.includes("Beginner")) score += 2;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = course;
      }
    });

    if (!bestMatch && courses.length > 0) {
      if (careerGoal === "Start Freelancing") bestMatch = courses.find(c => c.category === 'Design') || courses[0];
      else if (interest === "Logic & Problem Solving") bestMatch = courses.find(c => c.category === 'Development') || courses[0];
      else if (interest === "Creativity & Art") bestMatch = courses.find(c => c.category === 'Design') || courses[0];
      else bestMatch = courses[0];
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
  const CurrentSectionIcon = currentQuestion?.sectionIcon || School;
  const CurrentQuestionIcon = currentQuestion?.icon || GraduationCap;

  if (loading) {
    return (
      <section className="course-section-simple is-visible" id="courses">
        <div className="course-container-simple">
          <div className="section-header-simple">
            <div className="section-badge-simple">
              <GraduationCap size={20} />
              <span>EXPLORE COURSES</span>
            </div>
            <h2 className="section-title-simple">Our Courses</h2>
          </div>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="ai-analyzing-section">
              <div className="ai-brain-animation">
                <Brain size={48} />
                <div className="ai-ripples">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <h4>Loading Courses...</h4>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="course-section-simple is-visible" id="courses">
        <div className="course-container-simple">
          <div className="section-header-simple">
            <h2 className="section-title-simple">Our Courses</h2>
          </div>
          <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: '#000B29',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className={`course-section-simple ${isVisible ? 'is-visible' : ''} ${isMobile ? 'is-mobile' : ''} ${showAIAssistant ? 'ai-active' : ''}`} 
      id="courses"
      ref={sectionRef}
    >
      <div className="course-container-simple">
        
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

        {!isMobile && filteredCategories.length > 0 && (
          <div className="slider-outer desktop-only">
            <button 
              className="slider-arrow outside prev" 
              onClick={prevSlide}
              aria-label="Previous"
              disabled={totalCards <= cardsPerView}
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
                  style={{ transform: `translateX(-${currentIndex * (100 / Math.min(cardsPerView, Math.max(1, totalCards)))}%)` }}
                >
                  {filteredCategories.map((category, index) => {
                    const IconComponent = category.icon || Code;
                    return (
                      <div 
                        key={category.id || index} 
                        className="category-card-simple"
                        style={{ '--delay': `${index * 0.1}s` }}
                        onClick={() => handleCardClick(category._id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCardClick(category._id);
                          }
                        }}
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
                          <p className="card-desc-simple line-clamp-3">{category.description}</p>
                          <div className="card-footer-simple">
                            <div className="card-meta-info">
                              <span>Rs. {category.price}</span>
                              <span>{category.duration}</span>
                            </div>
                            <button 
                              onClick={(e) => handleCourseNavigation(category._id, e)}
                              className="read-more-link"
                            >
                              Read More
                              <ArrowRight size={16} />
                            </button>
                          </div>
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
              disabled={totalCards <= cardsPerView}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {isMobile && (
          <>
            <div 
              ref={mobileContainerRef}
              className="mobile-cards-container"
              onScroll={handleMobileScroll}
            >
              <div className="mobile-cards-wrapper">
                {filteredCategories.map((category, index) => {
                  const IconComponent = category.icon || Code;
                  return (
                    <div 
                      key={category.id || index} 
                      className="mobile-card"
                      style={{ '--delay': `${index * 0.1}s` }}
                      onClick={() => handleCardClick(category._id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCardClick(category._id);
                        }
                      }}
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
                        <p className="mobile-card-desc line-clamp-2">{category.description}</p>
                        <div className="mobile-card-meta">
                          <span>
                            <BookOpen size={14} />
                            Rs. {category.price}
                          </span>
                          <span>•</span>
                          <span>{category.category}</span>
                        </div>
                        <button 
                          onClick={(e) => handleCourseNavigation(category._id, e)}
                          className="mobile-read-more"
                        >
                          Read More
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
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

        {filteredCategories.length === 0 && !loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#64748b'
          }}>
            <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3>No courses found</h3>
            <p>Try selecting a different category</p>
          </div>
        )}

        <div className="dual-buttons-wrapper">
          <button onClick={handleViewAllCourses} className="view-all-link">
            View All Courses
            <ChevronRight size={18} />
          </button>
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
                            {React.createElement(recommendedCourse.icon || Code, { size: 40 })}
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
                              <span>Rs. {recommendedCourse.price}</span>
                            </div>
                            <div className="ai-stat">
                              <Clock size={16} />
                              <span>{recommendedCourse.duration}</span>
                            </div>
                            <div className="ai-stat">
                              <Award size={16} />
                              <span>Certificate</span>
                            </div>
                          </div>
                          
                          <div className="ai-rec-tags-premium">
                            {recommendedCourse.tags?.map((tag, idx) => (
                              <span key={idx} className="ai-rec-tag-premium">{tag}</span>
                            ))}
                          </div>
                          
                          <div className="ai-rec-actions-premium">
                            <button 
                              onClick={() => handleAIEnroll(recommendedCourse._id)}
                              className="ai-enroll-btn-premium"
                            >
                              <span>Start Learning Now</span>
                              <ArrowRight size={18} />
                            </button>
                            <button onClick={resetAI} className="ai-retake-btn-premium">
                              <ArrowRight size={16} style={{ transform: 'rotate(-180deg)' }} />
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
                        <span className="ai-section-name">{currentQuestion?.section}</span>
                      </div>
                      <div className="ai-section-progress">
                        {aiQuestions.filter(q => q.section === currentQuestion?.section).length} questions
                      </div>
                    </div>

                    <div className="ai-question-header-enhanced">
                      <div className="ai-question-icon-wrapper">
                        <CurrentQuestionIcon size={32} />
                      </div>
                      <h4>{currentQuestion?.question}</h4>
                    </div>

                    <div className="ai-options-grid-enhanced">
                      {currentQuestion?.options?.map((option, idx) => (
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