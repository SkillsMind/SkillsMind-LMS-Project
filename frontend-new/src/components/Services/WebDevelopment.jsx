import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCode, FaMobileAlt, FaDatabase, FaCloudUploadAlt, 
  FaShieldAlt, FaRocket, FaCheckCircle, FaArrowRight,
  FaStar, FaUsers, FaClock, FaAward, FaChartLine,
  FaLaptopCode, FaServer, FaPalette, FaSearch, FaCogs, FaGlobe
} from 'react-icons/fa';
import './ServicePages.css';

const WebDevelopment = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    window.scrollTo(0, 0);
  }, []);

  const technologies = [
    { name: 'React.js', level: '95%', color: '#61DAFB' },
    { name: 'Node.js', level: '92%', color: '#68A063' },
    { name: 'Express.js', level: '90%', color: '#000000' },
    { name: 'MongoDB', level: '88%', color: '#4DB33D' },
    { name: 'Next.js', level: '85%', color: '#000000' },
    { name: 'Tailwind CSS', level: '94%', color: '#38B2AC' },
  ];

  const features = [
    { icon: <FaRocket />, title: 'Lightning Fast', desc: 'Optimized performance with lazy loading and caching' },
    { icon: <FaMobileAlt />, title: 'Fully Responsive', desc: 'Perfect on all devices - mobile, tablet, desktop' },
    { icon: <FaShieldAlt />, title: 'Secure', desc: 'Protected against XSS, CSRF, and other attacks' },
    { icon: <FaCloudUploadAlt />, title: 'Cloud Ready', desc: 'Deployed on AWS, Vercel, or your preferred cloud' },
    { icon: <FaSearch />, title: 'SEO Optimized', desc: 'Built with best SEO practices for better ranking' },
    { icon: <FaCogs />, title: 'Scalable', desc: 'Architecture that grows with your business' },
  ];

  const portfolio = [
    { name: 'E-Commerce Platform', desc: 'Full-featured online store with payment integration', year: '2024' },
    { name: 'Learning Management System', desc: 'Complete course platform with video streaming', year: '2024' },
    { name: 'Healthcare Portal', desc: 'Patient management and appointment system', year: '2023' },
    { name: 'Real Estate Marketplace', desc: 'Property listing and booking platform', year: '2023' },
  ];

  const pricingPlans = [
    { name: 'Basic', price: '50,000', features: ['5 Pages Website', 'Responsive Design', 'Contact Form', '1 Month Support'] },
    { name: 'Professional', price: '1,20,000', features: ['10 Pages Website', 'CMS Integration', 'Payment Gateway', '3 Months Support', 'SEO Optimized'] },
    { name: 'Enterprise', price: 'Custom', features: ['Unlimited Pages', 'Custom Features', 'API Development', '12 Months Support', 'Priority Service'] },
  ];

  return (
    <div className={`service-page-wrapper ${isVisible ? 'fade-in' : ''}`}>
      {/* Hero Section */}
      <section className="service-hero-modern">
        <div className="hero-bg-animation">
          <div className="gradient-bg"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <FaCode /> MERN Stack Specialists
            </div>
            <h1 className="hero-title">
              Web Development <span className="highlight">(MERN Stack)</span>
            </h1>
            <p className="hero-desc">
              Build powerful, scalable, and modern web applications with Pakistan's leading MERN Stack developers. 
              From startup MVPs to enterprise solutions, we deliver excellence.
            </p>
            <div className="hero-buttons">
              <Link to="/contact" className="btn-primary">
                Start Your Project <FaArrowRight />
              </Link>
              <Link to="#pricing" className="btn-outline">
                View Pricing
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <FaUsers />
                <div>
                  <h4>50+</h4>
                  <p>Happy Clients</p>
                </div>
              </div>
              <div className="stat">
                <FaRocket />
                <div>
                  <h4>100+</h4>
                  <p>Projects Delivered</p>
                </div>
              </div>
              <div className="stat">
                <FaClock />
                <div>
                  <h4>24/7</h4>
                  <p>Support Available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#ffffff"></path>
          </svg>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-us">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose <span className="highlight">Us?</span></h2>
            <p>We combine technical expertise with creative innovation</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="technologies-section">
        <div className="container">
          <div className="section-header">
            <h2>Technologies We <span className="highlight">Master</span></h2>
            <p>Cutting-edge tools for modern web development</p>
          </div>
          <div className="tech-grid">
            {technologies.map((tech, index) => (
              <div className="tech-card" key={index}>
                <div className="tech-info">
                  <span className="tech-name">{tech.name}</span>
                  <span className="tech-percent">{tech.level}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: tech.level, backgroundColor: tech.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="process-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Development <span className="highlight">Process</span></h2>
            <p>A systematic approach to deliver excellence</p>
          </div>
          <div className="process-timeline">
            <div className="process-step">
              <div className="step-number">01</div>
              <h3>Discovery</h3>
              <p>Understanding requirements and planning</p>
            </div>
            <div className="process-step">
              <div className="step-number">02</div>
              <h3>Design</h3>
              <p>Creating wireframes and UI/UX design</p>
            </div>
            <div className="process-step">
              <div className="step-number">03</div>
              <h3>Development</h3>
              <p>Agile development with regular updates</p>
            </div>
            <div className="process-step">
              <div className="step-number">04</div>
              <h3>Testing</h3>
              <p>Quality assurance and bug fixes</p>
            </div>
            <div className="process-step">
              <div className="step-number">05</div>
              <h3>Deployment</h3>
              <p>Launch and cloud deployment</p>
            </div>
            <div className="process-step">
              <div className="step-number">06</div>
              <h3>Support</h3>
              <p>Maintenance and ongoing support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="portfolio-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Recent <span className="highlight">Work</span></h2>
            <p>Projects that speak for themselves</p>
          </div>
          <div className="portfolio-grid">
            {portfolio.map((project, index) => (
              <div className="portfolio-card" key={index}>
                <div className="portfolio-year">{project.year}</div>
                <h3>{project.name}</h3>
                <p>{project.desc}</p>
                <div className="portfolio-hover">
                  <span>View Project <FaArrowRight /></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="section-header">
            <h2>Flexible <span className="highlight">Pricing</span></h2>
            <p>Choose the plan that fits your needs</p>
          </div>
          <div className="pricing-grid">
            {pricingPlans.map((plan, index) => (
              <div className={`pricing-card ${plan.name === 'Professional' ? 'popular' : ''}`} key={index}>
                {plan.name === 'Professional' && <div className="popular-badge">Most Popular</div>}
                <h3>{plan.name}</h3>
                <div className="price">
                  <span className="currency">PKR</span>
                  <span className="amount">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="period">/project</span>}
                </div>
                <ul className="features-list">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}><FaCheckCircle /> {feature}</li>
                  ))}
                </ul>
                <Link to="/contact" className="btn-pricing">Get Started</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Build Your Dream Website?</h2>
            <p>Let's discuss your project and create something amazing together.</p>
            <div className="cta-buttons">
              <Link to="/contact" className="btn-primary-large">
                Get Free Consultation <FaArrowRight />
              </Link>
              <Link to="/portfolio" className="btn-secondary">
                View All Projects
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WebDevelopment;