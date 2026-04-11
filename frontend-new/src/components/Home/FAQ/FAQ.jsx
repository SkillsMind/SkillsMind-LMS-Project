import React, { useState } from 'react';
import { ChevronDown, MessageCircle, Headphones, Clock, Award } from 'lucide-react';
import './FAQ.css';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: 'Are the certificates recognized by employers?',
      answer: 'Yes! Our certificates are industry-recognized and trusted by top companies in Pakistan including Jazz, Careem, Telenor, and many multinational corporations. Each certificate includes a unique verification link that employers can use to verify your credentials instantly.'
    },
    {
      question: 'Can I switch between live and recorded classes?',
      answer: 'Absolutely! You can attend live sessions and also access recorded versions of all classes. If you miss a live session, you can catch up with the recording which is available within 2 hours after the class ends.'
    },
    {
      question: 'What is your refund policy?',
      answer: 'We offer a 7-day money-back guarantee. If you are not satisfied with our courses within the first week, you can request a full refund, no questions asked. Refunds are processed within 5-7 business days.'
    },
    {
      question: 'Do you provide job placement assistance?',
      answer: 'Yes, our Premium plan includes comprehensive job placement assistance. This includes resume building, LinkedIn optimization, mock interviews with industry experts, and direct referrals to our 150+ hiring partners.'
    },
    {
      question: 'How does the AI Study Assistant work?',
      answer: 'Our AI Study Assistant uses advanced GPT technology trained on our course materials. It can answer your questions 24/7, review your code, explain complex concepts in simple terms, and provide personalized study recommendations.'
    },
    {
      question: 'Can I download course materials for offline use?',
      answer: 'Yes! With our mobile app, you can download video lectures, PDFs, and other resources for offline learning. This is perfect for learning during commutes or in areas with limited internet connectivity.'
    }
  ];

  const handleContactClick = () => {
    window.location.href = '/contact';
  };

  return (
    <section className="faq-section" id="faqs">
      <div className="faq-container">
        {/* Header */}
        <div className="faq-header">
          <span className="faq-badge">FAQ</span>
          <h2 className="faq-title">Frequently Asked <span>Questions</span></h2>
          <p className="faq-description">
            Everything you need to know about SkillsMind
          </p>
        </div>

        {/* Main Content */}
        <div className="faq-wrapper">
          {/* Left Side - FAQ List */}
          <div className="faq-left">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-card ${openIndex === index ? 'active' : ''}`}
              >
                <button 
                  className="faq-question"
                  onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                >
                  <span>{faq.question}</span>
                  <ChevronDown size={18} className="faq-arrow" />
                </button>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side - CTA Card */}
          <div className="faq-right">
            <div className="support-card">
              <div className="support-icon">
                <Headphones size={28} />
              </div>
              <h3>Still have questions?</h3>
              <p>Can't find the answer you're looking for? Our support team is here to help!</p>
              <button onClick={handleContactClick} className="support-btn">
                <MessageCircle size={16} />
                <span>Contact Support</span>
              </button>
              <div className="support-footer">
                <div className="support-stat">
                  <Clock size={12} />
                  <span>Response within 2 hours</span>
                </div>
                <div className="support-stat">
                  <Award size={12} />
                  <span>98% satisfaction rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;