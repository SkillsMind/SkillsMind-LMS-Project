import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, MessageCircle, Headphones, Mail, Clock, Award, 
  Users, BookOpen, Search, Phone, MessageSquare, Globe, 
  Facebook, Twitter, Linkedin, Instagram 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './FAQPage.css';

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs = [
    {
      id: 1,
      category: 'General',
      question: 'Are the certificates recognized by employers?',
      answer: 'Yes! Our certificates are industry-recognized and trusted by top companies in Pakistan including Jazz, Careem, Telenor, and many multinational corporations. Each certificate includes a unique verification link that employers can use to verify your achievement.',
    },
    {
      id: 2,
      category: 'Learning',
      question: 'Can I switch between live and recorded classes?',
      answer: 'Absolutely! You can attend live sessions and also access recorded versions of all classes. If you miss a live session, you can catch up with the recording which is available within 2 hours after the class ends. All recordings are stored in your dashboard for lifetime access.',
    },
    {
      id: 3,
      category: 'Payment',
      question: 'What is your refund policy?',
      answer: 'We offer a 7-day money-back guarantee. If you are not satisfied with our courses within the first week, you can request a full refund, no questions asked. Refunds are processed within 5-7 business days directly to your original payment method.',
    },
    {
      id: 4,
      category: 'Career',
      question: 'Do you provide job placement assistance?',
      answer: 'Yes, our Premium plan includes comprehensive job placement assistance. This includes resume building, LinkedIn optimization, mock interviews, and direct referrals to our 150+ hiring partners including top tech companies in Pakistan.',
    },
    {
      id: 5,
      category: 'Technology',
      question: 'How does the AI Study Assistant work?',
      answer: 'Our AI Study Assistant uses advanced GPT technology trained on our course materials. It can answer your questions 24/7, review your code, explain complex concepts in simple terms, and provide personalized study recommendations based on your learning progress.',
    },
    {
      id: 6,
      category: 'Technical',
      question: 'Can I download course materials for offline use?',
      answer: 'Yes! With our mobile app, you can download video lectures, PDFs, and other resources for offline learning. This is perfect for learning during commutes or in areas with limited internet connectivity. Downloaded content remains accessible for 30 days.',
    },
    {
      id: 7,
      category: 'General',
      question: 'What is the duration of each course?',
      answer: 'Course durations vary from 4 to 12 weeks depending on the subject. Each course includes 2-3 hours of weekly content, plus assignments and projects. You can learn at your own pace within the course period.',
    },
    {
      id: 8,
      category: 'Payment',
      question: 'Do you offer installment plans?',
      answer: 'Yes! We offer flexible installment plans for our premium courses. You can pay in 2-3 monthly installments with zero interest. Contact our support team to learn more about installment options.',
    }
  ];

  const categories = ['All', 'General', 'Learning', 'Payment', 'Career', 'Technology', 'Technical'];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const contactMethods = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={24} />,
      link: 'https://wa.me/923116735509',
      color: '#25D366',
      username: '+92 311 6735509'
    },
    {
      name: 'Instagram',
      icon: <Instagram size={24} />,
      link: 'https://instagram.com/skillsmind',
      color: '#E4405F',
      username: 'skillsmind786'
    },
    {
      name: 'Email',
      icon: <Mail size={24} />,
      link: 'mailto:skillsmind786@gmail.com',
      color: '#e30613',
      username: 'skillsmind786@gmail.com'
    }
  ];

  return (
    <div className="faq-page">
      {/* Hero Section */}
      <section className="faq-hero">
        <div className="faq-hero-overlay"></div>
        <div className="faq-hero-content">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            Frequently Asked <span className="red-text">Questions</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            Everything you need to know about SkillsMind. Can't find what you're looking for?
          </motion.p>
          
          <div className="faq-search">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search your question..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="faq-categories">
        <div className="container">
          <div className="categories-scroll">
            {categories.map((category, idx) => (
              <button key={idx} className={`category-btn ${activeCategory === category ? 'active' : ''}`} onClick={() => setActiveCategory(category)}>
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Main */}
      <section className="faq-main">
        <div className="container">
          <div className="faq-grid">
            <div className="faq-list-container">
              {filteredFaqs.map((faq, index) => (
                <div key={faq.id} className={`faq-card ${openIndex === index ? 'open' : ''}`}>
                  <button className="faq-question-btn" onClick={() => toggleFAQ(index)}>
                    <div className="faq-question-left">
                      <span className="faq-category-badge">{faq.category}</span>
                      <span className="faq-question-text">{faq.question}</span>
                    </div>
                    <ChevronDown className={`faq-chevron ${openIndex === index ? 'rotated' : ''}`} size={20} />
                  </button>
                  <div className="faq-answer-container">
                    <p className="faq-answer-text">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="faq-sidebar">
              <div className="support-card">
                <div className="support-icon"><Headphones size={32} /></div>
                <h3>Still have questions?</h3>
                <p>Can't find the answer you're looking for? Our support team is here to help!</p>
                
                <div className="contact-methods">
                  {contactMethods.map((method, idx) => (
                    <a key={idx} href={method.link} target="_blank" rel="noopener noreferrer" className="contact-method-btn" style={{ '--hover-color': method.color }}>
                      <span className="contact-icon" style={{ color: method.color }}>{method.icon}</span>
                      <div className="contact-info">
                        <span className="contact-name">{method.name}</span>
                        <span className="contact-username">{method.username}</span>
                      </div>
                    </a>
                  ))}
                </div>

                <div className="response-time">
                  <span className="dot"></span>
                  Average response time: 2 hours
                </div>
              </div>

              <div className="quick-links">
                <h4>Quick Links</h4>
                <ul>
                  <li><Link to="/how-it-works">How It Works</Link></li>
                  <li><Link to="/courses">Browse Courses</Link></li>
                  <li><Link to="/signup">Sign Up Now</Link></li>
                  <li><Link to="/contact">Contact Us</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;