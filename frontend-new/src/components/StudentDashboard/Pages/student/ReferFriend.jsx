import React, { useState, useEffect } from 'react';
import { Gift, ArrowLeft, Share2, Copy, Check, Users, Award, Facebook, Twitter, Mail, Target, Zap, UserPlus, Percent } from 'lucide-react';
import './ReferFriend.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ReferFriend = ({ onNavigate, studentName }) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralData, setReferralData] = useState({
    referralCode: '',
    totalReferrals: 0,
    successfulReferrals: 0,
    discountPercent: 0,
    referredFriends: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        console.log('No token found');
        setLoading(false);
        return;
      }
      
      console.log('Fetching referral data...');
      
      const response = await fetch(`${API_URL}/api/referrals/ensure-referral`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Referral API response:', data);
      
      if (data.success) {
        setReferralData({
          referralCode: data.referralCode || 'SKILLS2024',
          totalReferrals: data.totalReferrals || 0,
          successfulReferrals: data.successfulReferrals || 0,
          discountPercent: data.discountPercent || 0,
          referredFriends: data.referredFriends || []
        });
      } else {
        throw new Error(data.message || 'Failed to load referral data');
      }
      
    } catch (error) {
      console.error('Error loading referral data:', error);
      setError(error.message);
      setReferralData({
        referralCode: 'SKILLS2024',
        totalReferrals: 0,
        successfulReferrals: 0,
        discountPercent: 0,
        referredFriends: []
      });
    } finally {
      setLoading(false);
    }
  };

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showSuccessToast('Referral code copied');
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        showSuccessToast('Link copied to clipboard');
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const referralLink = `${window.location.origin}/signup?ref=${referralData.referralCode}`;
  const studentFullName = studentName || 'SkillsMind Student';

  const shareOnWhatsApp = () => {
    const message = `━━━━━━━━━━━━━━━━━━━━\n   SKILLSMIND INVITATION\n━━━━━━━━━━━━━━━━━━━━\n\nInviter: ${studentFullName}\nReferral Code: ${referralData.referralCode}\n\nJoin SkillsMind Learning Platform.\n\n🔗 ${referralLink}\n\nUse referral code during signup.\n━━━━━━━━━━━━━━━━━━━━`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Join me at SkillsMind for professional skills training')}&url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareOnEmail = () => {
    const subject = `SkillsMind Invitation from ${studentFullName}`;
    const body = `You have been invited to join SkillsMind Learning Platform.\n\nReferral Code: ${referralData.referralCode}\nRegistration Link: ${referralLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleBack = () => {
    if (onNavigate) onNavigate('dashboard');
  };

  const getNextMilestoneInfo = () => {
    const current = referralData.successfulReferrals;
    if (current < 1) return { needed: 1, discount: 5, message: `${1 - current} more for 5%` };
    if (current < 2) return { needed: 2, discount: 10, message: `${2 - current} more for 10%` };
    if (current < 3) return { needed: 3, discount: 15, message: `${3 - current} more for 15%` };
    if (current < 4) return { needed: 4, discount: 20, message: `${4 - current} more for 20%` };
    if (current < 5) return { needed: 5, discount: 25, message: `${5 - current} more for 25%` };
    return { needed: 0, discount: 25, message: 'Maximum achieved' };
  };

  const nextMilestone = getNextMilestoneInfo();

  if (loading) {
    return (
      <div className="referfriend-container">
        <div className="referfriend-header">
          <button className="back-btn" onClick={handleBack}><ArrowLeft size={20} /> Back</button>
          <h1>Referral Program</h1>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="referfriend-container">
      {showToast && (
        <div className="toast-notification">
          <Check size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="referfriend-header">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={20} /> Dashboard
        </button>
        <h1>Referral Program</h1>
      </div>

      <div className="referfriend-content">
        <div className="stats-row">
          <div className="stat-card-premium">
            <div className="stat-icon purple"><UserPlus size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{referralData.totalReferrals}</span>
              <span className="stat-label">Total Invites</span>
            </div>
          </div>
          <div className="stat-card-premium">
            <div className="stat-icon green"><Award size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{referralData.successfulReferrals}</span>
              <span className="stat-label">Successful</span>
            </div>
          </div>
          <div className="stat-card-premium">
            <div className="stat-icon orange"><Percent size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{referralData.discountPercent}%</span>
              <span className="stat-label">Discount</span>
            </div>
          </div>
        </div>

        <div className="discount-section">
          <div className="discount-header">
            <Target size={18} />
            <span>Referral Discount Progress</span>
          </div>
          <div className="discount-value">{referralData.discountPercent}%</div>
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(referralData.successfulReferrals / 5) * 100}%` }}></div>
            </div>
            <div className="progress-milestones">
              <span className={referralData.successfulReferrals >= 1 ? 'active' : ''}>5%</span>
              <span className={referralData.successfulReferrals >= 2 ? 'active' : ''}>10%</span>
              <span className={referralData.successfulReferrals >= 3 ? 'active' : ''}>15%</span>
              <span className={referralData.successfulReferrals >= 4 ? 'active' : ''}>20%</span>
              <span className={referralData.successfulReferrals >= 5 ? 'active' : ''}>25%</span>
            </div>
          </div>
          {nextMilestone.needed > 0 && (
            <div className="next-milestone">
              <Zap size={14} />
              {nextMilestone.message}
            </div>
          )}
        </div>

        <div className="referral-info-card">
          <div className="info-row">
            <span className="info-label">Your Code</span>
            <div className="info-value">
              <code>{referralData.referralCode}</code>
              <button onClick={() => copyToClipboard(referralData.referralCode, 'code')}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          <div className="info-row">
            <span className="info-label">Referral Link</span>
            <div className="info-value link-value">
              <span className="link-text">{referralLink}</span>
              <button onClick={() => copyToClipboard(referralLink, 'link')}>
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="share-grid">
          <button className="share-option whatsapp" onClick={shareOnWhatsApp}>
            <Share2 size={18} /> WhatsApp
          </button>
          <button className="share-option facebook" onClick={shareOnFacebook}>
            <Facebook size={18} /> Facebook
          </button>
          <button className="share-option linkedin" onClick={shareOnLinkedIn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.203 0 22.225 0z"/></svg>
            LinkedIn
          </button>
          <button className="share-option twitter" onClick={shareOnTwitter}>
            <Twitter size={18} /> Twitter
          </button>
          <button className="share-option email" onClick={shareOnEmail}>
            <Mail size={18} /> Email
          </button>
        </div>

        {/* 🔥 HOW IT WORKS - WITH INLINE STYLES 🔥 */}
        <div style={{
          background: '#f0f4f8',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          display: 'block',
          width: '100%'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '24px',
            color: '#000B29',
            textAlign: 'center'
          }}>How It Works</h3>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, textAlign: 'center', minWidth: '120px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: '#000B29',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '18px',
                margin: '0 auto 14px'
              }}>1</div>
              <div style={{
                fontSize: '13px',
                color: '#1e293b',
                lineHeight: '1.4',
                fontWeight: '500',
                display: 'block'
              }}>Share your referral link with friends</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', minWidth: '120px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: '#000B29',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '18px',
                margin: '0 auto 14px'
              }}>2</div>
              <div style={{
                fontSize: '13px',
                color: '#1e293b',
                lineHeight: '1.4',
                fontWeight: '500',
                display: 'block'
              }}>Friend signs up using your code</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', minWidth: '120px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: '#000B29',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '18px',
                margin: '0 auto 14px'
              }}>3</div>
              <div style={{
                fontSize: '13px',
                color: '#1e293b',
                lineHeight: '1.4',
                fontWeight: '500',
                display: 'block'
              }}>Friend enrolls in a course</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', minWidth: '120px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: '#000B29',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '18px',
                margin: '0 auto 14px'
              }}>4</div>
              <div style={{
                fontSize: '13px',
                color: '#1e293b',
                lineHeight: '1.4',
                fontWeight: '500',
                display: 'block'
              }}>You earn discount on next course</div>
            </div>
          </div>
        </div>

        <div className="terms-card">
          <p>Maximum 25% discount for 5+ successful referrals. Applies to next course enrollment.</p>
        </div>
      </div>
    </div>
  );
};

export default ReferFriend;