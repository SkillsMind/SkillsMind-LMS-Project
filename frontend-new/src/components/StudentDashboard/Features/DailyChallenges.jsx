import React, { useState } from 'react';
import { Trophy, Zap, CheckCircle, Clock, Star, Target } from 'lucide-react';
import './DailyChallenges.css';

const DailyChallenges = () => {
  const [challenges] = useState([
    { 
      id: 1, 
      title: 'Complete 1 Lesson', 
      points: 50, 
      completed: true,
      type: 'learning',
      description: 'Finish any video lesson from your enrolled courses'
    },
    { 
      id: 2, 
      title: 'Practice for 30 mins', 
      points: 30, 
      completed: false,
      type: 'practice',
      description: 'Use Focus Mode for deep learning session'
    },
    { 
      id: 3, 
      title: 'Help a Peer', 
      points: 100, 
      completed: false,
      type: 'community',
      description: 'Answer a question in Study Collab forum'
    },
    { 
      id: 4, 
      title: 'Submit Assignment', 
      points: 75, 
      completed: false,
      type: 'task',
      description: 'Submit pending assignment before deadline',
      urgent: true
    }
  ]);

  const totalPoints = challenges.reduce((acc, curr) => curr.completed ? acc + curr.points : acc, 0);
  const totalPossible = challenges.reduce((acc, curr) => acc + curr.points, 0);

  return (
    <div className="feature-container">
      <div className="feature-header">
        <h2>⚡ Daily Challenges</h2>
        <p>Complete tasks to earn XP and maintain your streak</p>
      </div>

      <div className="challenges-overview">
        <div className="progress-ring-large">
          <div className="progress-content">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <span className="progress-text">{totalPoints}/{totalPossible}</span>
            <span className="progress-label">XP Earned Today</span>
          </div>
        </div>
        <div className="streak-box-large">
          <Zap className="w-12 h-12 text-orange-500" />
          <div>
            <span className="streak-number">12</span>
            <span className="streak-text">Day Streak!</span>
          </div>
        </div>
      </div>

      <div className="challenges-list">
        {challenges.map((challenge) => (
          <div key={challenge.id} className={`challenge-row ${challenge.completed ? 'completed' : ''} ${challenge.urgent ? 'urgent' : ''}`}>
            <div className="challenge-status">
              {challenge.completed ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <Target className={`w-6 h-6 ${challenge.urgent ? 'text-red-500' : 'text-gray-400'}`} />
              )}
            </div>
            
            <div className="challenge-details">
              <h4>{challenge.title}</h4>
              <p>{challenge.description}</p>
              <div className="challenge-meta">
                <span className={`type-tag ${challenge.type}`}>{challenge.type}</span>
                {challenge.urgent && <span className="urgent-tag">Due Today</span>}
              </div>
            </div>

            <div className="challenge-reward">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>+{challenge.points}</span>
            </div>

            <button className={`challenge-action ${challenge.completed ? 'claimed' : 'claim'}`}>
              {challenge.completed ? 'Completed' : 'Complete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyChallenges;