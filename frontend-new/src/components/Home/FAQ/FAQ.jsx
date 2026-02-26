import React, { useState } from 'react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { ChevronDown, MessageCircle } from 'lucide-react';
import './FAQ.css';

const FAQ = () => {
  const sectionRef = useScrollAnimation();
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: 'Are the certificates recognized by employers?',
      answer: 'Yes! Our certificates are industry-recognized and trusted by top companies in Pakistan including Jazz, Careem, Telenor, and many multinational corporations. Each certificate includes a unique verification link.'
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
      answer: 'Yes, our Premium plan includes comprehensive job placement assistance. This includes resume building, LinkedIn optimization, mock interviews, and direct referrals to our 150+ hiring partners.'
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

  return (
    <section ref={sectionRef} className="faq-section" id="faqs">
      <div className="faq-container">
        <div className="section-header reveal">
          <div className="section-label">FAQ</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Everything you need to know about SkillsMind
          </p>
        </div>

        <div className="faq-content">
          <div className="faq-list reveal">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${openIndex === index ? 'open' : ''}`}
              >
                <button 
                  className="faq-question"
                  onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                >
                  <span>{faq.question}</span>
                  <ChevronDown size={20} className="faq-icon" />
                </button>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="faq-cta reveal-right">
            <div className="cta-card">
              <div className="cta-icon">
                <MessageCircle size={32} />
              </div>
              <h3>Still have questions?</h3>
              <p>Can not find the answer you are looking for? Our support team is here to help!</p>
              <button className="contact-support-btn">
                Contact Support
              </button>
              <div className="response-time">
                <span className="dot"></span>
                Average response time: 2 hours
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;