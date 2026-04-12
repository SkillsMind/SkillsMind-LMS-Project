import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaPaperPlane, FaTimes, FaMinus } from 'react-icons/fa';
import axios from 'axios';
import './SkillsMindBot.css';

const SkillsMindBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([
        { role: 'ai', text: 'Assalam-o-Alaikum! Main SkillsMind AI Assistant hoon. Main aapki kya madad kar sakta hoon?' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    const backendURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chat]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const studentName = localStorage.getItem('userName') || localStorage.getItem('studentName') || 'Student';
        const userMsg = message;
        
        setChat(prev => [...prev, { role: 'user', text: userMsg }]);
        setMessage('');
        setIsTyping(true);

        try {
            const res = await axios.post(`${backendURL}/api/ai/chat`, {
                message: userMsg,
                studentName: studentName
            });

            if (res.data && res.data.answer) {
                setChat(prev => [...prev, { role: 'ai', text: res.data.answer }]);
            } else if (res.data && res.data.reply) {
                setChat(prev => [...prev, { role: 'ai', text: res.data.reply }]);
            } else {
                setChat(prev => [...prev, { role: 'ai', text: "Mujhe samajh nahi aaya. Kya aap dobara pooch sakte hain?" }]);
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setChat(prev => [...prev, { role: 'ai', text: "Maafi chahiye! SkillsMind server busy hai. Kuch der baad try karein." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className={`sm-bot-wrapper ${isOpen ? 'active' : ''}`}>
            {!isOpen && (
                <button className="sm-bot-toggle" onClick={() => setIsOpen(true)}>
                    <img 
                        src="/Skillsmind logo with blue.jpeg" 
                        alt="SkillsMind AI" 
                        className="sm-bot-logo"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <FaRobot className="sm-bot-icon-fallback" size={25} style={{ display: 'none' }} />
                    <span className="sm-pulse"></span>
                </button>
            )}

            {isOpen && (
                <div className={`sm-chat-container ${isMinimized ? 'minimized' : ''}`}>
                    <div className="sm-chat-header">
                        <div className="sm-header-info">
                            <div className="sm-bot-avatar">
                                <img 
                                    src="/Skillsmind logo with blue.jpeg" 
                                    alt="SkillsMind" 
                                    className="sm-avatar-logo"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = 'SM';
                                    }}
                                />
                            </div>
                            <div>
                                <h3>SkillsMind AI</h3>
                                <p>Online | Virtual Assistant</p>
                            </div>
                        </div>
                        <div className="sm-header-actions">
                            <button onClick={() => setIsMinimized(!isMinimized)}><FaMinus /></button>
                            <button onClick={() => setIsOpen(false)}><FaTimes /></button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            <div className="sm-chat-messages">
                                {chat.map((msg, index) => (
                                    <div key={index} className={`sm-message ${msg.role}`}>
                                        <div className="sm-message-bubble">{msg.text}</div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="sm-message ai">
                                        <div className="sm-typing-indicator">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <form className="sm-chat-input" onSubmit={handleSendMessage}>
                                <input 
                                    type="text" 
                                    placeholder="SkillsMind ke baare mein poochein..." 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                                <button type="submit"><FaPaperPlane /></button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SkillsMindBot;