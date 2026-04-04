import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, ChevronDown, Menu } from 'lucide-react';
import { useProfile } from '../../../context/ProfileContext.jsx';
import './Topbar.css';

const Topbar = ({ 
  onNavigate,
  onMenuClick
}) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Use ProfileContext instead of localStorage
  const { profile, loading: profileLoading } = useProfile();

  const isDemoMode = !localStorage.getItem('token');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get data from context (real-time sync with Settings/GetEnrollment)
  const displayName = profile?.name || profile?.firstName || 'Student';
  
  const gender = profile?.gender || 'male';

  // Get avatar URL from context
  const getAvatarUrl = () => {
    if (profile?.profileImage) {
      // Handle both full URL and relative path
      if (profile.profileImage.startsWith('http')) {
        return profile.profileImage;
      }
      const cleanPath = profile.profileImage.startsWith('/') 
        ? profile.profileImage.slice(1) 
        : profile.profileImage;
      return `${import.meta.env.VITE_API_URL}/${cleanPath}`;
    }
    
    // Default avatars based on gender
    if (gender === 'female') {
      return 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png';
    }
    return 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png';
  };

  const handleMyProfile = () => {
    if (onNavigate) onNavigate('profile');
    setShowProfileDropdown(false);
  };

  const handleSettings = () => {
    if (onNavigate) onNavigate('settings');
    setShowProfileDropdown(false);
  };

  const handleLogout = () => {
    if (onNavigate) onNavigate('logout');
    setShowProfileDropdown(false);
  };

  return (
    <div className="student-topbar">
      <div className="topbar-container">
        
        {/* Left Section */}
        <div className="topbar-left">
          <button 
            className="mobile-menu-trigger"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          <div className="desktop-logo">
            <img 
              src="/Skills_Mind_Logo.png" 
              alt="SkillsMind" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo.png';
              }}
            />
          </div>
        </div>

        {/* Center - Title */}
        <div className="topbar-center">
          <h1 className="topbar-title">Student Dashboard</h1>
        </div>

        {/* Right - Profile */}
        <div className="topbar-right">
          <div ref={dropdownRef} className="profile-container">
            
            {/* Profile Button */}
            <button 
              className="profile-btn"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div className="profile-avatar-main">
                <img 
                  src={getAvatarUrl()} 
                  alt={displayName}
                  onError={(e) => {
                    e.target.src = gender === 'female' 
                      ? 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png'
                      : 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png';
                  }}
                />
              </div>
              
              <span className="profile-name-text">{displayName}</span>
              
              <ChevronDown 
                size={16} 
                className={`dropdown-chevron ${showProfileDropdown ? 'open' : ''}`} 
              />
            </button>

            {/* Clean Dropdown Menu */}
            {showProfileDropdown && (
              <div className="profile-dropdown-clean">
                
                {/* User Info */}
                <div className="dropdown-user-header">
                  <img 
                    src={getAvatarUrl()} 
                    alt={displayName}
                    className="dropdown-avatar-img"
                    onError={(e) => {
                      e.target.src = gender === 'female' 
                        ? 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png'
                        : 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png';
                    }}
                  />
                  <div className="dropdown-user-text">
                    <span className="dropdown-username">{displayName}</span>
                    <span className="dropdown-useremail">
                      {profile?.email || 'student@example.com'}
                    </span>
                  </div>
                </div>

                <div className="dropdown-divider-clean"></div>

                {/* Menu Items */}
                <button className="dropdown-menu-item" onClick={handleMyProfile}>
                  <User size={18} />
                  <span>My Profile</span>
                </button>

                <button className="dropdown-menu-item" onClick={handleSettings}>
                  <Settings size={18} />
                  <span>Settings</span>
                </button>

                <div className="dropdown-divider-clean"></div>

                <button className="dropdown-menu-item logout" onClick={handleLogout}>
                  <LogOut size={18} />
                  <span>{isDemoMode ? 'Login' : 'Logout'}</span>
                </button>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;