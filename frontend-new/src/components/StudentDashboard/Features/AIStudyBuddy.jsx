import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, Mic } from 'lucide-react';
import './AIStudyBuddy.css';

const AIStudyBuddy = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: 'ai', 
      text: 'Assalam-o-Alaikum! I\'m your SkillsMind AI Tutor. How can I help you today?',
      suggestions: ['Explain React Hooks', 'Quiz me on JS', 'Help with CSS Grid'] 
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), type: 'user', text: input }]);
    setInput('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'ai', 
        text: 'Great question! Let me explain that in detail...',
        suggestions: ['Tell me more', 'Give example', 'Next topic']
      }]);
    }, 1000);
  };

  return (
    <div className="feature-container">
      <div className="feature-header">
        <h2>🤖 AI Study Buddy</h2>
        <p>Your personal 24/7 AI tutor</p>
      </div>

      <div className="ai-chat-container">
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble ${msg.type}`}>
              <div className="chat-avatar">
                {msg.type === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className="chat-content">
                <p>{msg.text}</p>
                {msg.suggestions && (
                  <div className="suggestion-chips">
                    {msg.suggestions.map((sug, idx) => (
                      <button key={idx} className="chip">
                        <Sparkles className="w-3 h-3" />
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input-area">
          <button className="mic-btn">
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your courses..."
          />
          <button className="send-btn" onClick={handleSend}>
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIStudyBuddy;