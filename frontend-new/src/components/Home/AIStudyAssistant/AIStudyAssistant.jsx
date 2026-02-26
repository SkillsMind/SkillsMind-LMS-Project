import React, { useState } from 'react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { Bot, Send, Sparkles, Code, BookOpen, Lightbulb } from 'lucide-react';
import './AIStudyAssistant.css';

const AIStudyAssistant = () => {
  const sectionRef = useScrollAnimation();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { type: 'ai', text: 'Hi! I\'m your AI study buddy. Ask me anything about your courses!' }
  ]);

  const features = [
    { icon: Code, title: 'Code Review', desc: 'Get instant feedback on your code' },
    { icon: BookOpen, title: 'Concept Help', desc: 'Simplified explanations 24/7' },
    { icon: Lightbulb, title: 'Career Guide', desc: 'Personalized career advice' }
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages([...messages, { type: 'user', text: input }]);
    setInput('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: 'ai', 
        text: 'I\'d be happy to help! This is a demo response. In the real app, I\'ll provide detailed assistance based on your courses.' 
      }]);
    }, 1000);
  };

  return (
    <section ref={sectionRef} className="ai-assistant-section">
      <div className="ai-assistant-container">
        <div className="assistant-content">
          <div className="assistant-info reveal-left">
            <div className="assistant-badge">
              <Sparkles size={16} />
              <span>New Feature</span>
            </div>
            <h2 className="assistant-title">Meet Your AI Study Buddy</h2>
            <p className="assistant-description">
              Stuck on a concept? Need code review? Or career advice? Our AI tutor is available 24/7 to help you succeed.
            </p>
            
            <div className="assistant-features">
              {features.map((feature, index) => (
                <div key={index} className={`assistant-feature stagger-${index + 1}`}>
                  <div className="feature-icon-box">
                    <feature.icon size={24} />
                  </div>
                  <div className="feature-text">
                    <h4>{feature.title}</h4>
                    <p>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="try-assistant-btn">
              Try AI Assistant Free
            </button>
          </div>

          <div className="assistant-demo reveal-right">
            <div className="chat-window">
              <div className="chat-header">
                <div className="chat-avatar">
                  <Bot size={24} />
                </div>
                <div className="chat-info">
                  <h4>SkillsMind AI</h4>
                  <span className="status">
                    <span className="status-dot"></span>
                    Online
                  </span>
                </div>
              </div>
              
              <div className="chat-messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.type}`}>
                    {msg.type === 'ai' && (
                      <div className="message-avatar">
                        <Bot size={16} />
                      </div>
                    )}
                    <div className="message-bubble">
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="chat-input-area">
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="send-btn">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIStudyAssistant;