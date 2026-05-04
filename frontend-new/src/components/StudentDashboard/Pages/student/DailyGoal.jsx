import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle, Flame, Award, TrendingUp, 
  Calendar, Clock, BookOpen, Video, FileText, 
  Target, BarChart3, Zap, Crown, Coffee
} from 'lucide-react';
import './DailyGoal.css';

const DailyGoal = ({ onNavigate, studentName }) => {
  // ========== STATE MANAGEMENT ==========
  const [selectedDate] = useState(new Date());
  const [activeView, setActiveView] = useState('today');
  
  // Player Data
  const [playerData, setPlayerData] = useState({
    level: 1,
    xp: 0,
    xpToNextLevel: 200,
    totalPoints: 0,
    streak: 0,
    lastActiveDate: null,
    completedTasks: []
  });
  
  // Today's Tasks
  const [tasks, setTasks] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [showNotification, setShowNotification] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(null);
  const [loading, setLoading] = useState(true);

  // ========== LOAD DATA FROM LOCALSTORAGE ==========
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    // Load player data
    const savedPlayer = localStorage.getItem('dailyGoalPlayer');
    if (savedPlayer) {
      setPlayerData(JSON.parse(savedPlayer));
    }
    
    // Load task history
    const savedHistory = localStorage.getItem('taskHistory');
    if (savedHistory) {
      setTaskHistory(JSON.parse(savedHistory));
    }
    
    // Load today's tasks
    const savedTasks = localStorage.getItem('dailyTasks');
    const lastReset = localStorage.getItem('tasksResetDate');
    const today = new Date().toDateString();
    
    if (savedTasks && lastReset === today) {
      setTasks(JSON.parse(savedTasks));
    } else {
      const newTasks = generateDailyTasks();
      setTasks(newTasks);
      localStorage.setItem('dailyTasks', JSON.stringify(newTasks));
      localStorage.setItem('tasksResetDate', today);
    }
    
    setLoading(false);
  };

  // ========== GENERATE DAILY TASKS ==========
  const generateDailyTasks = () => {
    return [
      { 
        id: 1, 
        title: 'Watch Lecture Recording', 
        description: 'Review today\'s recorded lecture and take notes',
        xp: 25,
        duration: 45,
        icon: 'video',
        category: 'learning',
        completed: false,
        claimed: false
      },
      { 
        id: 2, 
        title: 'Practice Coding', 
        description: 'Write code for at least 30 minutes',
        xp: 30,
        duration: 30,
        icon: 'code',
        category: 'practice',
        completed: false,
        claimed: false
      },
      { 
        id: 3, 
        title: 'Complete Assignment', 
        description: 'Work on pending course assignments',
        xp: 40,
        duration: 60,
        icon: 'assignment',
        category: 'assignment',
        completed: false,
        claimed: false
      },
      { 
        id: 4, 
        title: 'Take Notes', 
        description: 'Summarize key concepts from today\'s lesson',
        xp: 15,
        duration: 20,
        icon: 'notes',
        category: 'study',
        completed: false,
        claimed: false
      }
    ];
  };

  // ========== GET ICON ==========
  const getIcon = (iconName) => {
    switch(iconName) {
      case 'video': return <Video size={20} />;
      case 'code': return <Zap size={20} />;
      case 'assignment': return <FileText size={20} />;
      case 'notes': return <BookOpen size={20} />;
      default: return <Target size={20} />;
    }
  };

  // ========== COMPLETE TASK ==========
  const completeTask = (taskId) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem('dailyTasks', JSON.stringify(updatedTasks));
  };

  // ========== CLAIM REWARD ==========
  const claimReward = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.completed || task.claimed) return;
    
    // Update task
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, claimed: true } : t
    );
    setTasks(updatedTasks);
    localStorage.setItem('dailyTasks', JSON.stringify(updatedTasks));
    
    // Update player stats
    const newXp = playerData.xp + task.xp;
    const newTotalPoints = playerData.totalPoints + task.xp;
    
    let newLevel = playerData.level;
    let newXpToNextLevel = playerData.xpToNextLevel;
    let remainingXp = newXp;
    let leveledUp = false;
    
    while (remainingXp >= newXpToNextLevel) {
      remainingXp -= newXpToNextLevel;
      newLevel++;
      newXpToNextLevel = Math.floor(150 + (newLevel - 1) * 25);
      leveledUp = true;
    }
    
    // Save to history
    const historyEntry = {
      id: Date.now(),
      title: task.title,
      xp: task.xp,
      date: new Date().toISOString(),
      category: task.category
    };
    
    const updatedHistory = [historyEntry, ...taskHistory];
    setTaskHistory(updatedHistory);
    localStorage.setItem('taskHistory', JSON.stringify(updatedHistory));
    
    const updatedPlayer = {
      ...playerData,
      xp: remainingXp,
      xpToNextLevel: newXpToNextLevel,
      totalPoints: newTotalPoints,
      level: newLevel,
      completedTasks: [...playerData.completedTasks, taskId]
    };
    
    setPlayerData(updatedPlayer);
    localStorage.setItem('dailyGoalPlayer', JSON.stringify(updatedPlayer));
    
    // Show notification
    setShowNotification({ xp: task.xp, title: task.title });
    setTimeout(() => setShowNotification(null), 2500);
    
    if (leveledUp) {
      setShowLevelUp(newLevel);
      setTimeout(() => setShowLevelUp(null), 3000);
    }
  };

  // ========== UPDATE STREAK ==========
  useEffect(() => {
    const today = new Date().toDateString();
    const lastActive = playerData.lastActiveDate;
    
    if (lastActive !== today && playerData.lastActiveDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastActive === yesterday.toDateString()) {
        const updatedPlayer = { ...playerData, streak: playerData.streak + 1, lastActiveDate: today };
        setPlayerData(updatedPlayer);
        localStorage.setItem('dailyGoalPlayer', JSON.stringify(updatedPlayer));
      } else if (lastActive !== today) {
        const updatedPlayer = { ...playerData, streak: 1, lastActiveDate: today };
        setPlayerData(updatedPlayer);
        localStorage.setItem('dailyGoalPlayer', JSON.stringify(updatedPlayer));
      }
    } else if (!playerData.lastActiveDate) {
      const updatedPlayer = { ...playerData, streak: 1, lastActiveDate: today };
      setPlayerData(updatedPlayer);
      localStorage.setItem('dailyGoalPlayer', JSON.stringify(updatedPlayer));
    }
  }, [playerData.lastActiveDate]);

  // ========== CALCULATIONS ==========
  const completedCount = tasks.filter(t => t.claimed).length;
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const levelProgress = (playerData.xp / playerData.xpToNextLevel) * 100;

  // Weekly stats
  const getWeeklyStats = () => {
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const tasksOnDate = taskHistory.filter(t => new Date(t.date).toDateString() === date.toDateString());
      weeklyData.push({
        day: date.toLocaleDateString('en-PK', { weekday: 'short' }),
        count: tasksOnDate.length,
        xp: tasksOnDate.reduce((sum, t) => sum + t.xp, 0)
      });
    }
    return weeklyData;
  };

  // Monthly stats
  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTasks = taskHistory.filter(t => {
      const taskDate = new Date(t.date);
      return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
    });
    
    const categoryCount = {};
    monthlyTasks.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });
    
    return {
      totalTasks: monthlyTasks.length,
      totalXp: monthlyTasks.reduce((sum, t) => sum + t.xp, 0),
      categories: categoryCount
    };
  };

  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  const handleBack = () => {
    if (onNavigate) onNavigate('dashboard');
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dailygoal-container">
        <div className="dailygoal-header">
          <button className="back-btn" onClick={handleBack}><ArrowLeft size={20} /> Back</button>
          <h1>Daily Goals</h1>
        </div>
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dailygoal-container">
      {/* Notifications */}
      {showNotification && (
        <div className="notification-toast">
          <CheckCircle size={20} color="#10B981" />
          <div>
            <strong>Task Completed!</strong>
            <p>+{showNotification.xp} XP earned</p>
          </div>
        </div>
      )}
      
      {showLevelUp && (
        <div className="notification-toast levelup">
          <Crown size={20} color="#F59E0B" />
          <div>
            <strong>Level Up!</strong>
            <p>You reached Level {showLevelUp}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="dailygoal-header">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={20} /> Dashboard
        </button>
        <h1>Daily Goals</h1>
      </div>

      {/* Date Display */}
      <div className="date-display">
        <Calendar size={18} />
        <span>{formatDate()}</span>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
        <button className={`view-tab ${activeView === 'today' ? 'active' : ''}`} onClick={() => setActiveView('today')}>Today</button>
        <button className={`view-tab ${activeView === 'week' ? 'active' : ''}`} onClick={() => setActiveView('week')}>This Week</button>
        <button className={`view-tab ${activeView === 'month' ? 'active' : ''}`} onClick={() => setActiveView('month')}>This Month</button>
      </div>

      {/* Player Stats */}
      <div className="player-stats">
        <div className="level-card">
          <div className="level-number">{playerData.level}</div>
          <div className="level-label">Level</div>
        </div>
        <div className="xp-card">
          <div className="xp-info">
            <span>{playerData.xp}</span>
            <span>/</span>
            <span>{playerData.xpToNextLevel}</span>
          </div>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${levelProgress}%` }}></div>
          </div>
          <div className="xp-label">XP to next level</div>
        </div>
        <div className="streak-card-mini">
          <Flame size={20} color="#F59E0B" />
          <span>{playerData.streak} day streak</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-box">
          <Target size={22} />
          <div className="stat-value">{playerData.totalPoints}</div>
          <div className="stat-label">Total XP</div>
        </div>
        <div className="stat-box">
          <CheckCircle size={22} />
          <div className="stat-value">{playerData.completedTasks.length}</div>
          <div className="stat-label">Tasks Done</div>
        </div>
        <div className="stat-box">
          <Award size={22} />
          <div className="stat-value">{playerData.level === 1 ? 'Beginner' : playerData.level === 2 ? 'Explorer' : playerData.level === 3 ? 'Learner' : 'Master'}</div>
          <div className="stat-label">Rank</div>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-card">
        <div className="progress-header">
          <span>Today's Progress</span>
          <span>{completedCount}/{tasks.length} Tasks</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      {/* TODAY VIEW */}
      {activeView === 'today' && (
        <div className="tasks-container">
          <h3>Today's Tasks</h3>
          {tasks.map(task => (
            <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''} ${task.claimed ? 'claimed' : ''}`}>
              <div className="task-icon">{getIcon(task.icon)}</div>
              <div className="task-info">
                <h4>{task.title}</h4>
                <p>{task.description}</p>
                <div className="task-meta">
                  <span><Clock size={12} /> {task.duration} min</span>
                  <span>+{task.xp} XP</span>
                </div>
              </div>
              <div className="task-action">
                {task.claimed ? (
                  <button className="btn-claimed" disabled>✓ Done</button>
                ) : task.completed ? (
                  <button className="btn-claim" onClick={() => claimReward(task.id)}>Claim →</button>
                ) : (
                  <button className="btn-complete" onClick={() => completeTask(task.id)}>Complete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WEEK VIEW */}
      {activeView === 'week' && (
        <div className="analytics-container">
          <h3>Weekly Overview</h3>
          <div className="week-chart">
            {weeklyStats.map((day, idx) => (
              <div key={idx} className="chart-item">
                <div className="chart-label">{day.day}</div>
                <div className="chart-bar-container">
                  <div className="chart-bar" style={{ height: `${Math.min(day.count * 20, 100)}%` }}></div>
                </div>
                <div className="chart-value">{day.count}</div>
              </div>
            ))}
          </div>
          <div className="week-summary">
            <div><span>Total Tasks</span><strong>{weeklyStats.reduce((s, d) => s + d.count, 0)}</strong></div>
            <div><span>Total XP</span><strong>{weeklyStats.reduce((s, d) => s + d.xp, 0)}</strong></div>
          </div>
        </div>
      )}

      {/* MONTH VIEW */}
      {activeView === 'month' && (
        <div className="analytics-container">
          <h3>Monthly Summary</h3>
          <div className="month-stats">
            <div className="month-card">
              <Target size={24} />
              <div>
                <div className="month-value">{monthlyStats.totalTasks}</div>
                <div className="month-label">Total Tasks</div>
              </div>
            </div>
            <div className="month-card">
              <Award size={24} />
              <div>
                <div className="month-value">{monthlyStats.totalXp}</div>
                <div className="month-label">Total XP</div>
              </div>
            </div>
          </div>
          {Object.keys(monthlyStats.categories).length > 0 && (
            <div className="category-breakdown">
              <h4>Task Breakdown</h4>
              {Object.entries(monthlyStats.categories).map(([cat, count]) => (
                <div key={cat} className="category-row">
                  <span>{cat}</span>
                  <div className="category-bar">
                    <div className="category-fill" style={{ width: `${(count / monthlyStats.totalTasks) * 100}%` }}></div>
                  </div>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        {taskHistory.length === 0 ? (
          <div className="empty-activity">
            <Coffee size={32} />
            <p>No activity yet. Start completing tasks!</p>
          </div>
        ) : (
          taskHistory.slice(0, 5).map(activity => (
            <div key={activity.id} className="activity-item">
              <CheckCircle size={16} color="#10B981" />
              <div className="activity-info">
                <span>{activity.title}</span>
                <small>{new Date(activity.date).toLocaleDateString()}</small>
              </div>
              <span className="activity-xp">+{activity.xp} XP</span>
            </div>
          ))
        )}
      </div>

      {/* Quote */}
      <div className="quote-card">
        <p>"The expert in anything was once a beginner. Keep going!"</p>
        <span>- SkillsMind</span>
      </div>
    </div>
  );
};

export default DailyGoal;