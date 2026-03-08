import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, Palette, Key, 
  Save, CheckCircle, Camera, Moon, Sun,
  Smartphone, Mail, Globe, ChevronRight,
  Eye, EyeOff, Lock, Languages, X, Menu, 
  Trash2, AlertCircle, Award, FileText, 
  Download, LogOut, Smartphone as MobileIcon
} from 'lucide-react';
import { useProfile } from '../../../context/ProfileContext.jsx';
import axios from 'axios';
import './Settings.css';

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-content">
        {type === 'success' && <CheckCircle size={20} />}
        {type === 'error' && <AlertCircle size={20} />}
        {type === 'loading' && <div className="toast-spinner" />}
        <span>{message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};

// Custom Confirm Dialog
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <div className="confirm-header">
          <AlertCircle size={32} className="confirm-icon" />
          <h3>{title}</h3>
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-btn confirm" onClick={onConfirm}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

const Settings = ({ studentName, onNavigate, userId }) => {
  // ========== CONTEXT SE PROFILE DATA ==========
  const { 
    profile, 
    loading: profileLoading, 
    updateProfile, 
    uploadImage, 
    deleteImage,
    fetchProfile 
  } = useProfile();

  // ========== LOCAL STATES ==========
  const [activeSetting, setActiveSetting] = useState('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false, title: '', message: '', onConfirm: null
  });

  // Language State
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem('appLanguage') || 'en');
  
  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [fontSize, setFontSize] = useState(localStorage.getItem('fontSize') || 'medium');

  // Additional Student Features
  const [activeSessions, setActiveSessions] = useState([
    { device: 'Chrome on Windows', location: 'Kabir Wala, Pakistan', current: true },
    { device: 'Mobile App', location: 'Lahore, Pakistan', current: false }
  ]);
  
  const [certificates, setCertificates] = useState([
    { id: 1, course: 'Web Development', date: '2024-01-15', status: 'completed' },
    { id: 2, course: 'Graphic Design', date: '2024-02-20', status: 'completed' }
  ]);

  // ========== LOCAL USER DATA (Context se sync hoga) ==========
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    gender: 'male',
    city: '',
    institute: '',
    education: '',
    profileImage: null
  });

  // ========== NOTIFICATIONS STATE (Aapka purana logic) ==========
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    courseUpdates: true,
    assignmentReminders: true,
    quizReminders: true,
    marketingEmails: false
  });

  // ========== PRIVACY STATE (Aapka purana logic) ==========
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showProgress: true,
    showCertificates: true,
    allowMessages: true
  });

  // ========== SECURITY STATE (Aapka purana logic) ==========
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // ========== CONSTANTS ==========
  const email = localStorage.getItem('studentEmail');
  const token = localStorage.getItem('token');
  const storedUserId = localStorage.getItem('userId');
  const backendURL = "http://localhost:5000";

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // ========== EFFECTS ==========
  
  // Theme aur language apply karo
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    document.body.setAttribute('data-font-size', fontSize);
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  }, [theme, fontSize, currentLanguage]);

  // Context se profile data sync karo
  useEffect(() => {
    if (profile) {
      setUserData({
        name: profile.name || '',
        email: profile.email || email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        gender: profile.gender || 'male',
        city: profile.city || '',
        institute: profile.institute || '',
        education: profile.education || '',
        profileImage: profile.profileImage || null
      });
    }
  }, [profile, email]);

  // Baqi settings fetch karo
  useEffect(() => {
    fetchNotifications();
    fetchPrivacy();
  }, []);

  // ========== HELPERS ==========
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${backendURL}/${cleanPath}`;
  };

  const getDefaultAvatar = () => {
    const name = userData.name || 'User';
    const colors = ['#E8F5E9', '#E3F2FD', '#F3E5F5', '#FFF3E0', '#E0F2F1', '#FBE9E7', '#E8EAF6', '#F1F8E9'];
    const colorIndex = name.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor.replace('#', '')}&color=374151&size=128&font-size=0.5&bold=true`;
  };

  // ========== API CALLS (Aapke purane logic) ==========
  const fetchNotifications = async () => {
    if (!email) return;
    try {
      const res = await axios.get(`${backendURL}/api/settings/notifications/${email}`, axiosConfig);
      if (res.data.success) setNotifications(res.data.settings);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchPrivacy = async () => {
    if (!email) return;
    try {
      const res = await axios.get(`${backendURL}/api/settings/privacy/${email}`, axiosConfig);
      if (res.data.success) setPrivacy(res.data.settings);
    } catch (error) {
      console.error('Error fetching privacy:', error);
    }
  };

  // ========== HANDLERS ==========

  // Profile Save (Context use karega)
  const handleSaveProfile = async () => {
    showToast('Saving profile...', 'loading');
    const result = await updateProfile({
      firstName: userData.name.split(' ')[0],
      lastName: userData.name.split(' ').slice(1).join(' ') || '',
      name: userData.name,
      phone: userData.phone,
      mobile: userData.phone,
      city: userData.city,
      institute: userData.institute,
      gender: userData.gender,
      bio: userData.bio,
      email: userData.email
    });
    
    if (result.success) {
      showToast('Profile saved successfully!', 'success');
    } else {
      showToast('Failed to save profile', 'error');
    }
  };

  // Image Upload (Context use karega)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    showToast('Uploading photo...', 'loading');
    const result = await uploadImage(file);
    
    if (result.success) {
      showToast('Photo uploaded successfully!', 'success');
    } else {
      showToast('Failed to upload photo', 'error');
    }
  };

  // Image Delete (Context use karega)
  const handleDeletePhoto = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Profile Photo',
      message: 'Are you sure you want to remove your profile photo? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast('Removing photo...', 'loading');
        const result = await deleteImage();
        if (result.success) {
          showToast('Photo removed successfully!', 'success');
        } else {
          showToast('Failed to remove photo', 'error');
        }
      }
    });
  };

  // Notifications Save (Aapka purana logic)
  const handleSaveNotifications = async () => {
    if (!email) return;
    showToast('Saving preferences...', 'loading');
    try {
      await axios.put(`${backendURL}/api/settings/notifications/${email}`, { settings: notifications }, axiosConfig);
      showToast('Preferences saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving notifications:', error);
      showToast('Failed to save preferences', 'error');
    }
  };

  // Privacy Save (Aapka purana logic)
  const handleSavePrivacy = async () => {
    if (!email) return;
    showToast('Saving privacy settings...', 'loading');
    try {
      await axios.put(`${backendURL}/api/settings/privacy/${email}`, { settings: privacy }, axiosConfig);
      showToast('Privacy settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving privacy:', error);
      showToast('Failed to save privacy settings', 'error');
    }
  };

  // Appearance Save (Aapka purana logic)
  const handleSaveAppearance = async () => {
    if (!email) return;
    showToast('Saving appearance...', 'loading');
    try {
      await axios.put(`${backendURL}/api/settings/appearance/${email}`, { settings: { theme, fontSize } }, axiosConfig);
      localStorage.setItem('theme', theme);
      localStorage.setItem('fontSize', fontSize);
      showToast('Appearance saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving appearance:', error);
      showToast('Failed to save appearance', 'error');
    }
  };

  // Password Change (Aapka purana logic)
  const handleChangePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    if (security.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    showToast('Changing password...', 'loading');
    try {
      await axios.post(`${backendURL}/api/settings/change-password`, {
        email,
        currentPassword: security.currentPassword,
        newPassword: security.newPassword
      }, axiosConfig);

      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully! Redirecting...', 'success');
      
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      showToast(error.response?.data?.message || 'Failed to change password', 'error');
    }
  };

  // Certificate Download
  const handleDownloadCertificate = (certId) => {
    showToast('Preparing certificate download...', 'loading');
    setTimeout(() => {
      showToast('Certificate downloaded successfully!', 'success');
    }, 1500);
  };

  // Logout All (Aapka purana logic)
  const handleLogoutAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Logout from All Devices',
      message: 'Are you sure you want to logout from all devices? You will need to login again on all devices.',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast('Logged out from all devices', 'success');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
      }
    });
  };

  // Language Change (Aapka purana logic)
  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    localStorage.setItem('appLanguage', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    window.dispatchEvent(new CustomEvent('languageChange', { detail: { language: lang } }));
    showToast(`Language changed to ${lang === 'en' ? 'English' : lang === 'ur' ? 'Urdu' : 'Arabic'}`, 'success');
  };

  // Theme Change (Aapka purana logic)
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Font Size Change (Aapka purana logic)
  const handleFontSizeChange = (size) => {
    setFontSize(size);
    document.body.setAttribute('data-font-size', size);
    localStorage.setItem('fontSize', size);
  };

  // ========== TRANSLATIONS ==========
  const t = (key) => {
    const translations = {
      en: {
        settings: 'Settings', profile: 'Profile', notifications: 'Notifications', privacy: 'Privacy',
        appearance: 'Appearance', security: 'Security', language: 'Language', saveChanges: 'Save Changes',
        fullName: 'Full Name', email: 'Email', phone: 'Phone', gender: 'Gender', city: 'City',
        institute: 'Institute/College', bio: 'Bio', male: 'Male', female: 'Female', other: 'Other',
        changePhoto: 'Change Photo', removePhoto: 'Remove Photo', light: 'Light', dark: 'Dark', 
        fontSize: 'Font Size', small: 'Small', medium: 'Medium', large: 'Large', 
        currentPassword: 'Current Password', newPassword: 'New Password', confirmPassword: 'Confirm Password', 
        changePassword: 'Change Password', selectLanguage: 'Select Language', 
        english: 'English', urdu: 'Urdu', arabic: 'Arabic',
        loading: 'Loading...', saving: 'Saving...', savedSuccessfully: 'Saved Successfully!',
        certificates: 'My Certificates', activeSessions: 'Active Sessions', logoutAll: 'Logout All Devices',
        download: 'Download', current: 'Current', device: 'Device', location: 'Location'
      },
      ur: {
        settings: 'ترتیبات', profile: 'پروفائل', notifications: 'اطلاعات', privacy: 'رازداری',
        appearance: 'ظاہری شکل', security: 'سیکیورٹی', language: 'زبان', saveChanges: 'تبدیلیاں محفوظ کریں',
        fullName: 'پورا نام', email: 'ای میل', phone: 'فون', gender: 'جنس', city: 'شہر',
        institute: 'انسٹیٹیوٹ', bio: 'بائیو', male: 'مرد', female: 'عورت', other: 'دیگر',
        changePhoto: 'تصویر تبدیل کریں', removePhoto: 'تصویر ہٹائیں', light: 'روشن', dark: 'تاریک', 
        fontSize: 'فونٹ سائز', small: 'چھوٹا', medium: 'درمیانہ', large: 'بڑا', 
        currentPassword: 'موجودہ پاس ورڈ', newPassword: 'نیا پاس ورڈ', confirmPassword: 'تصدیق', 
        changePassword: 'پاس ورڈ تبدیل کریں', selectLanguage: 'زبان منتخب کریں', 
        english: 'انگریزی', urdu: 'اردو', arabic: 'عربی',
        loading: 'لوڈ ہو رہا ہے...', saving: 'محفوظ ہو رہا ہے...', savedSuccessfully: 'محفوظ ہو گیا!',
        certificates: 'میرے سرٹیفکیٹ', activeSessions: 'فعال سیشنز', logoutAll: 'تمام ڈیوائسز سے لاگ آؤٹ',
        download: 'ڈاؤن لوڈ', current: 'موجودہ', device: 'ڈیوائس', location: 'مقام'
      },
      ar: {
        settings: 'الإعدادات', profile: 'الملف الشخصي', notifications: 'الإشعارات', privacy: 'الخصوصية',
        appearance: 'المظهر', security: 'الأمان', language: 'اللغة', saveChanges: 'حفظ التغييرات',
        fullName: 'الاسم الكامل', email: 'البريد', phone: 'الهاتف', gender: 'الجنس', city: 'المدينة',
        institute: 'المعهد', bio: 'نبذة', male: 'ذكر', female: 'أنثى', other: 'آخر',
        changePhoto: 'تغيير الصورة', removePhoto: 'إزالة الصورة', light: 'فاتح', dark: 'داكن', 
        fontSize: 'حجم الخط', small: 'صغير', medium: 'متوسط', large: 'كبير', 
        currentPassword: 'كلمة المرور الحالية', newPassword: 'كلمة المرور الجديدة', confirmPassword: 'تأكيد', 
        changePassword: 'تغيير كلمة المرور', selectLanguage: 'اختر اللغة', 
        english: 'الإنجليزية', urdu: 'الأردية', arabic: 'العربية',
        loading: 'جاري التحميل...', saving: 'جاري الحفظ...', savedSuccessfully: 'تم الحفظ بنجاح!',
        certificates: 'شهاداتي', activeSessions: 'الجلسات النشطة', logoutAll: 'تسجيل الخروج من جميع الأجهزة',
        download: 'تحميل', current: 'الحالي', device: 'الجهاز', location: 'الموقع'
      }
    };
    return translations[currentLanguage][key] || key;
  };

  const settingTabs = [
    { id: 'profile', label: t('profile'), icon: User },
    { id: 'notifications', label: t('notifications'), icon: Bell },
    { id: 'privacy', label: t('privacy'), icon: Shield },
    { id: 'appearance', label: t('appearance'), icon: Palette },
    { id: 'security', label: t('security'), icon: Key },
    { id: 'language', label: t('language'), icon: Languages },
  ];

  // ========== RENDER CONTENT ==========
  const renderContent = () => {
    switch(activeSetting) {
      // ========== PROFILE TAB (Context se) ==========
      case 'profile':
        return (
          <div className="settings-section">
            <h2>{t('profile')} {t('settings')}</h2>
            <p className="section-desc">Manage your personal information</p>
            
            <div className="avatar-upload-section">
              <div className="current-avatar">
                <img 
                  src={userData.profileImage ? getImageUrl(userData.profileImage) : getDefaultAvatar()} 
                  alt="Profile"
                  onError={(e) => { e.target.src = getDefaultAvatar(); }}
                />
              </div>
              
              <div className="avatar-actions">
                <label className="change-photo-btn">
                  <Camera size={16} />
                  <span>{t('changePhoto')}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                </label>
                
                {userData.profileImage && (
                  <button className="remove-photo-btn" onClick={handleDeletePhoto}>
                    <Trash2 size={16} />
                    <span>{t('removePhoto')}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>{t('fullName')}</label>
                <input 
                  type="text" 
                  value={userData.name} 
                  onChange={(e) => setUserData({...userData, name: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>{t('email')}</label>
                <input type="email" value={userData.email} disabled className="disabled" />
              </div>
              <div className="form-group">
                <label>{t('phone')}</label>
                <input 
                  type="tel" 
                  value={userData.phone} 
                  onChange={(e) => setUserData({...userData, phone: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>{t('gender')}</label>
                <select 
                  value={userData.gender} 
                  onChange={(e) => setUserData({...userData, gender: e.target.value})}
                >
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('city')}</label>
                <input 
                  type="text" 
                  value={userData.city} 
                  onChange={(e) => setUserData({...userData, city: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>{t('institute')}</label>
                <input 
                  type="text" 
                  value={userData.institute} 
                  onChange={(e) => setUserData({...userData, institute: e.target.value})} 
                />
              </div>
              <div className="form-group full-width">
                <label>{t('bio')}</label>
                <textarea 
                  value={userData.bio} 
                  onChange={(e) => setUserData({...userData, bio: e.target.value})} 
                  rows={4} 
                />
              </div>
            </div>

            <button className="save-btn" onClick={handleSaveProfile}>
              <Save size={18} /> {t('saveChanges')}
            </button>
            
            <div className="certificates-section">
              <h3><Award size={20} /> {t('certificates')}</h3>
              <div className="certificates-list">
                {certificates.map(cert => (
                  <div key={cert.id} className="certificate-item">
                    <div className="cert-info">
                      <FileText size={20} />
                      <div>
                        <span className="cert-course">{cert.course}</span>
                        <small className="cert-date">{cert.date}</small>
                      </div>
                    </div>
                    <button 
                      className="cert-download" 
                      onClick={() => handleDownloadCertificate(cert.id)}
                    >
                      <Download size={16} /> {t('download')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ========== NOTIFICATIONS TAB (Aapka purana logic) ==========
      case 'notifications':
        return (
          <div className="settings-section">
            <h2>{t('notifications')}</h2>
            <p className="section-desc">Choose how you want to be notified</p>
            <div className="toggle-list">
              {[
                { key: 'emailNotifications', icon: Mail, label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'pushNotifications', icon: Smartphone, label: 'Push Notifications', desc: 'Receive push notifications' },
                { key: 'courseUpdates', icon: Globe, label: 'Course Updates', desc: 'New lessons and content' },
                { key: 'assignmentReminders', icon: Bell, label: 'Assignment Reminders', desc: 'Due date reminders' },
                { key: 'quizReminders', icon: CheckCircle, label: 'Quiz Reminders', desc: 'Upcoming quiz notifications' },
                { key: 'marketingEmails', icon: Mail, label: 'Marketing Emails', desc: 'Promotional offers and news' },
              ].map((item) => (
                <div className="toggle-item" key={item.key}>
                  <div className="toggle-info">
                    <item.icon size={20} />
                    <div>
                      <span>{item.label}</span>
                      <small>{item.desc}</small>
                    </div>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={notifications[item.key]} 
                      onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              ))}
            </div>
            <button className="save-btn" onClick={handleSaveNotifications}>
              <Save size={18} /> Save Preferences
            </button>
          </div>
        );

      // ========== PRIVACY TAB (Aapka purana logic) ==========
      case 'privacy':
        return (
          <div className="settings-section">
            <h2>{t('privacy')}</h2>
            <p className="section-desc">Control your profile visibility</p>
            <div className="toggle-list">
              {[
                { key: 'profileVisible', icon: User, label: 'Profile Visible', desc: 'Allow others to see your profile' },
                { key: 'showProgress', icon: Globe, label: 'Show Progress', desc: 'Display course progress publicly' },
                { key: 'showCertificates', icon: Award, label: 'Show Certificates', desc: 'Display earned certificates' },
                { key: 'allowMessages', icon: Mail, label: 'Allow Messages', desc: 'Receive messages from others' },
              ].map((item) => (
                <div className="toggle-item" key={item.key}>
                  <div className="toggle-info">
                    <item.icon size={20} />
                    <div>
                      <span>{item.label}</span>
                      <small>{item.desc}</small>
                    </div>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={privacy[item.key]} 
                      onChange={(e) => setPrivacy({...privacy, [item.key]: e.target.checked})} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              ))}
            </div>
            <button className="save-btn" onClick={handleSavePrivacy}>
              <Save size={18} /> Save Privacy Settings
            </button>
          </div>
        );

      // ========== APPEARANCE TAB (Aapka purana logic) ==========
      case 'appearance':
        return (
          <div className="settings-section">
            <h2>{t('appearance')}</h2>
            <p className="section-desc">Customize how dashboard looks</p>
            <div className="theme-selector">
              <label className={`theme-option ${theme === 'light' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="theme" 
                  value="light" 
                  checked={theme === 'light'} 
                  onChange={(e) => handleThemeChange(e.target.value)} 
                />
                <Sun size={24} /> <span>{t('light')}</span>
              </label>
              <label className={`theme-option ${theme === 'dark' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="theme" 
                  value="dark" 
                  checked={theme === 'dark'} 
                  onChange={(e) => handleThemeChange(e.target.value)} 
                />
                <Moon size={24} /> <span>{t('dark')}</span>
              </label>
            </div>
            <div className="form-group" style={{marginTop: '24px'}}>
              <label>{t('fontSize')}</label>
              <select value={fontSize} onChange={(e) => handleFontSizeChange(e.target.value)}>
                <option value="small">{t('small')}</option>
                <option value="medium">{t('medium')}</option>
                <option value="large">{t('large')}</option>
              </select>
            </div>
            <button className="save-btn" onClick={handleSaveAppearance}>
              <Save size={18} /> Save Appearance
            </button>
          </div>
        );

      // ========== SECURITY TAB (Aapka purana logic) ==========
      case 'security':
        return (
          <div className="settings-section">
            <h2>{t('security')}</h2>
            <p className="section-desc">Manage your account security</p>
            
            <div className="password-section">
              <h3>{t('changePassword')}</h3>
              <div className="form-group password-field">
                <label>{t('currentPassword')}</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword.current ? 'text' : 'password'} 
                    value={security.currentPassword} 
                    onChange={(e) => setSecurity({...security, currentPassword: e.target.value})} 
                    placeholder="Enter current password" 
                  />
                  <button 
                    type="button" 
                    className="toggle-password" 
                    onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                  >
                    {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group password-field">
                <label>{t('newPassword')}</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword.new ? 'text' : 'password'} 
                    value={security.newPassword} 
                    onChange={(e) => setSecurity({...security, newPassword: e.target.value})} 
                    placeholder="Enter new password" 
                  />
                  <button 
                    type="button" 
                    className="toggle-password" 
                    onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                  >
                    {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group password-field">
                <label>{t('confirmPassword')}</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword.confirm ? 'text' : 'password'} 
                    value={security.confirmPassword} 
                    onChange={(e) => setSecurity({...security, confirmPassword: e.target.value})} 
                    placeholder="Confirm new password" 
                  />
                  <button 
                    type="button" 
                    className="toggle-password" 
                    onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                  >
                    {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button className="save-btn" onClick={handleChangePassword}>
                <Lock size={18} /> {t('changePassword')}
              </button>
            </div>

            <div className="active-sessions">
              <h3><MobileIcon size={20} /> {t('activeSessions')}</h3>
              <div className="sessions-list">
                {activeSessions.map((session, idx) => (
                  <div key={idx} className={`session-item ${session.current ? 'current' : ''}`}>
                    <div className="session-info">
                      <Smartphone size={20} />
                      <div>
                        <span className="session-device">{session.device}</span>
                        <small className="session-location">{session.location}</small>
                        {session.current && <span className="current-badge">{t('current')}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="logout-all-btn" onClick={handleLogoutAll}>
                <LogOut size={16} /> {t('logoutAll')}
              </button>
            </div>
          </div>
        );

      // ========== LANGUAGE TAB (Aapka purana logic) ==========
      case 'language':
        return (
          <div className="settings-section">
            <h2>{t('selectLanguage')}</h2>
            <p className="section-desc">Choose your preferred language for the entire dashboard</p>
            <div className="language-selector">
              {[
                { code: 'en', name: t('english'), flag: '🇬🇧' },
                { code: 'ur', name: t('urdu'), flag: '🇵🇰' },
                { code: 'ar', name: t('arabic'), flag: '🇸🇦' }
              ].map((lang) => (
                <button 
                  key={lang.code} 
                  className={`language-option ${currentLanguage === lang.code ? 'active' : ''}`} 
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <span className="language-flag">{lang.flag}</span>
                  <span className="language-name">{lang.name}</span>
                  {currentLanguage === lang.code && <CheckCircle size={20} className="check-icon" />}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (profileLoading) return <div className="settings-loading">{t('loading')}</div>;

  return (
    <div className="settings-page">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm Dialog */}
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Mobile Header */}
      <div className="settings-mobile-header">
        <div className="mobile-header-top">
          <h2>{t('settings')}</h2>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        <div className="mobile-tabs-scroll">
          {settingTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id} 
                className={`mobile-tab-item ${activeSetting === tab.id ? 'active' : ''}`}
                onClick={() => setActiveSetting(tab.id)}
              >
                <Icon size={18} /><span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="settings-sidebar desktop-only">
        <h2 className="sidebar-title">{t('settings')}</h2>
        <nav className="settings-nav">
          {settingTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id} 
                className={`settings-nav-item ${activeSetting === tab.id ? 'active' : ''}`} 
                onClick={() => setActiveSetting(tab.id)}
              >
                <Icon size={20} /> <span>{tab.label}</span> <ChevronRight size={16} className="nav-arrow" />
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="settings-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default Settings;