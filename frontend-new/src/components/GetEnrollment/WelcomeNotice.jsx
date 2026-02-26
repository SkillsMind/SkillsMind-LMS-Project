import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WelcomeNotice.css';

const WelcomeNotice = ({ studentName }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 1.2 second baad entrance
    const timer = setTimeout(() => setShow(true), 1200);
    // 8 second baad exit
    const hideTimer = setTimeout(() => setShow(false), 8000); 

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          className="sm-vip-notice-container"
          initial={{ x: 100, opacity: 0, scale: 0.8 }} 
          animate={{ x: 0, opacity: 1, scale: 1 }}    
          exit={{ x: 100, opacity: 0, scale: 0.8 }}     
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <div className="char-box">
            <img 
              src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Man%20Raising%20Hand.png" 
              alt="SkillsMind Character" 
              className="vip-char-img"
            />
            <div className="vip-notice-board">
              <div className="board-inner">
                <span className="welcome-tag">SkillsMind Elite</span>
                <h2 className="student-name-display">{studentName}</h2>
                <p className="skillsmind-msg">Let's learn!</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeNotice;