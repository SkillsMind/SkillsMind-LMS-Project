import React, { useState } from 'react';
import { Map, ArrowLeft, Target, Award, TrendingUp, BookOpen, CheckCircle, Clock, Star, Zap } from 'lucide-react';

const LearningPath = ({ onNavigate, studentName }) => {
  const [activeTab, setActiveTab] = useState('current');

  const courses = [
    { id: 1, name: 'Web Development Bootcamp', progress: 65, completed: 32, total: 48, nextLesson: 'React Hooks', estimatedTime: '45 min' },
    { id: 2, name: 'Digital Marketing Mastery', progress: 30, completed: 11, total: 36, nextLesson: 'SEO Fundamentals', estimatedTime: '30 min' }
  ];

  const milestones = [
    { id: 1, title: 'Complete First Module', achieved: true, date: '2024-04-01', reward: 'Certificate Module 1' },
    { id: 2, title: 'Submit First Assignment', achieved: true, date: '2024-04-10', reward: '100 Points' },
    { id: 3, title: '50% Course Completion', achieved: false, reward: 'Badge: Halfway There' }
  ];

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  const overallProgress = (courses.reduce((sum, c) => sum + c.progress, 0) / courses.length).toFixed(0);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
      <div style={{ background: '#000B29', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={handleBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <h1 style={{ color: 'white', fontSize: '24px', margin: 0 }}>🗺️ Learning Path</h1>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: '#F9FAFB', borderRadius: '16px' }}>
              <Target size={28} color="#DC2626" /><div><div style={{ fontSize: '24px', fontWeight: 800 }}>{overallProgress}%</div><div style={{ fontSize: '12px', color: '#6B7280' }}>Progress</div></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: '#F9FAFB', borderRadius: '16px' }}>
              <Award size={28} color="#F59E0B" /><div><div style={{ fontSize: '24px', fontWeight: 800 }}>{milestones.filter(m => m.achieved).length}/{milestones.length}</div><div style={{ fontSize: '12px', color: '#6B7280' }}>Milestones</div></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: '#F9FAFB', borderRadius: '16px' }}>
              <TrendingUp size={28} color="#10B981" /><div><div style={{ fontSize: '24px', fontWeight: 800 }}>7 Days</div><div style={{ fontSize: '12px', color: '#6B7280' }}>Streak</div></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #E5E7EB', paddingBottom: '12px' }}>
          <button onClick={() => setActiveTab('current')} style={{ padding: '10px 20px', background: 'none', border: 'none', fontWeight: 600, color: activeTab === 'current' ? '#DC2626' : '#6B7280', borderBottom: activeTab === 'current' ? '2px solid #DC2626' : 'none', marginBottom: '-14px', cursor: 'pointer' }}>Current Courses</button>
          <button onClick={() => setActiveTab('milestones')} style={{ padding: '10px 20px', background: 'none', border: 'none', fontWeight: 600, color: activeTab === 'milestones' ? '#DC2626' : '#6B7280', borderBottom: activeTab === 'milestones' ? '2px solid #DC2626' : 'none', marginBottom: '-14px', cursor: 'pointer' }}>Milestones</button>
        </div>

        {activeTab === 'current' && courses.map(course => (
          <div key={course.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div><h3 style={{ fontSize: '18px' }}>{course.name}</h3><div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> Next: {course.nextLesson} • {course.estimatedTime}</div></div>
              <div style={{ position: 'relative', width: '60px', height: '60px' }}><svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="none" stroke="#E5E7EB" strokeWidth="4"/><circle cx="30" cy="30" r="26" fill="none" stroke="#DC2626" strokeWidth="4" strokeDasharray={`${(course.progress / 100) * 163.36} 163.36`} transform="rotate(-90 30 30)"/></svg><span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '14px', fontWeight: 700, color: '#DC2626' }}>{course.progress}%</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}><span style={{ fontSize: '12px', color: '#6B7280' }}>{course.completed}/{course.total} Lessons</span><button style={{ background: '#000B29', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Continue →</button></div>
          </div>
        ))}

        {activeTab === 'milestones' && milestones.map(milestone => (
          <div key={milestone.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: milestone.achieved ? '#F0FDF4' : 'white', borderRadius: '12px', marginBottom: '12px' }}>
            <div>{milestone.achieved ? <CheckCircle size={24} color="#10B981" /> : <Star size={24} color="#9CA3AF" />}</div>
            <div><h4 style={{ margin: 0 }}>{milestone.title}</h4><p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>{milestone.reward}</p>{milestone.date && <span style={{ fontSize: '11px', color: '#10B981' }}>Achieved on {milestone.date}</span>}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningPath;