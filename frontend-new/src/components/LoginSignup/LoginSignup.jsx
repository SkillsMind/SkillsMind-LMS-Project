import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaLock, FaUser, FaArrowRight, FaKey, FaShieldAlt } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc'; 
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast'; 

import logo from '../../assets/Skills_Mind_Logo.png'; 
import './LoginSignup.css';

const LoginSignup = ({ onSuccess, isModalMode = false, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [view, setView] = useState('auth'); 
  const [showOtp, setShowOtp] = useState(false); 
  const [loading, setLoading] = useState(false); 
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', 
    forgotEmail: '', newPassword: '', confirmPassword: '' 
  });

  const navigate = useNavigate();

  const handleRedirectAfterLogin = (userData) => {
    const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
    
    if (isModalMode && onSuccess) {
      onSuccess();
    }
    
    if (redirectAfterLogin) {
      localStorage.removeItem('redirectAfterLogin');
      if (!isModalMode) {
        navigate(redirectAfterLogin);
      }
    } else {
      if (userData.role === 'admin') {
        if (!isModalMode) navigate('/admin-dashboard');
      } else {
        if (userData.profileId) {
          if (!isModalMode) navigate('/get-enrolment');
        } else {
          if (!isModalMode) navigate('/student-profile-form');
        }
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = formData.email.trim().toLowerCase();

    if (!isLogin) {
      setLoading(true);
      const toastId = toast.loading("SkillsMind is sending your security code...");
      try {
        const response = await fetch('https://skillsmind-lms-project-production.up.railway.app/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail })
        });
        const data = await response.json();
        if (data.success) {
          toast.success("OTP sent! Check your inbox.", { id: toastId });
          setShowOtp(true);
        } else {
          toast.error(data.message || "Failed to send OTP", { id: toastId });
        }
      } catch (error) {
        toast.error("SkillsMind Server connection failed!", { id: toastId });
      } finally { setLoading(false); }
    } else {
      handleLogin(); 
    }
  };

  const handleVerifyOtp = async () => {
    const finalOtp = otp.join("");
    const cleanEmail = formData.email.trim().toLowerCase();

    if (finalOtp.length < 6) return toast.error("Please enter 6-digit code");
    
    setLoading(true);
    const toastId = toast.loading("Verifying your identity...");
    try {
      const verifyRes = await fetch('https://skillsmind-lms-project-production.up.railway.app/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: finalOtp })
      });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        const registerRes = await fetch('https://skillsmind-lms-project-production.up.railway.app/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: formData.name, 
            email: cleanEmail, 
            password: formData.password 
          })
        });
        const registerData = await registerRes.json();

        if (registerData.success) {
          toast.success("Welcome to SkillsMind! Please Sign In.", { id: toastId });
          setShowOtp(false);
          setIsLogin(true); 
          setOtp(['', '', '', '', '', '']);
        } else {
          toast.error(registerData.message || "Registration failed", { id: toastId });
        }
      } else {
        toast.error(verifyData.message || "Invalid OTP", { id: toastId });
      }
    } catch (error) { 
        toast.error("Verification failed!", { id: toastId }); 
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    const cleanEmail = formData.email.trim().toLowerCase();
    setLoading(true);
    const toastId = toast.loading("Authenticating with SkillsMind...");

    try {
      const res = await fetch('https://skillsmind-lms-project-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: formData.password })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('studentEmail', cleanEmail);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('studentId', data.user.id);

        if (data.user.profileId) {
          localStorage.setItem('studentProfileId', data.user.profileId);
        } else {
          localStorage.removeItem('studentProfileId');
        }

        toast.success(data.message || "Login Successful!", { id: toastId });

        setTimeout(() => {
          handleRedirectAfterLogin(data.user);
        }, 1000);
      } else { 
        toast.error(data.message || "Invalid Credentials", { id: toastId }); 
      }
    } catch (error) { 
      toast.error("Login failed! Check backend server.", { id: toastId }); 
    } finally { setLoading(false); }
  };

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      const toastId = toast.loading("SkillsMind Google Syncing...");
      try {
        const res = await fetch('https://skillsmind-lms-project-production.up.railway.app/api/auth/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('studentEmail', data.user.email);
          localStorage.setItem('userRole', data.user.role);
          localStorage.setItem('userName', data.user.name);
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('studentId', data.user.id);

          if (data.user.profileId) {
            localStorage.setItem('studentProfileId', data.user.profileId);
          }

          toast.success(`Welcome back, ${data.user.name}!`, { id: toastId });
          
          setTimeout(() => {
            handleRedirectAfterLogin(data.user);
          }, 1500);
        }
      } catch (err) { toast.error("Google sync failed!"); }
      finally { setLoading(false); }
    },
    onError: () => toast.error("Google Auth Canceled"),
  });

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Searching for your account...");
    try {
      const res = await fetch('https://skillsmind-lms-project-production.up.railway.app/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.forgotEmail.trim().toLowerCase() })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Security OTP sent to your email!", { id: toastId });
        setOtp(['', '', '', '', '', '']); 
        setView('forgot-otp');
      } else { toast.error(data.message, { id: toastId }); }
    } catch (err) { toast.error("Server error!"); }
    finally { setLoading(false); }
  };

  const handleVerifyForgotOtp = async () => {
    const finalOtp = otp.join("");
    setLoading(true);
    const toastId = toast.loading("Validating OTP...");
    try {
      const res = await fetch('https://skillsmind-lms-project-production.up.railway.app/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.forgotEmail.trim().toLowerCase(), otp: finalOtp })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Identity Verified! Set new password.", { id: toastId });
        setView('reset-password');
      } else { toast.error(data.message, { id: toastId }); }
    } catch (err) { toast.error("OTP verification failed"); }
    finally { setLoading(false); }
  };

  const handleFinalReset = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) return toast.error("Passwords match nahi ho rahe!");
    
    setLoading(true);
    const toastId = toast.loading("Updating SkillsMind credentials...");
    try {
      const res = await fetch('https://skillsmind-lms-project-production.up.railway.app/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.forgotEmail.trim().toLowerCase(), password: formData.newPassword })
      });
      const data = await res.json(); 
      if (data.success) {
        toast.success("Password Updated! You can now Sign In.", { id: toastId });
        setTimeout(() => { setView('auth'); setIsLogin(true); }, 2000);
      }
    } catch (err) { toast.error("Reset failed"); } 
    finally { setLoading(false); }
  };

  const ButtonSpinner = () => <div className="sm-spinner-white"></div>;

  // If in modal mode, render only the card (without full page wrapper)
  if (isModalMode) {
    return (
      <>
        <Toaster 
          position="top-right" 
          reverseOrder={false}
          gutter={12}
          containerStyle={{ top: 100, right: 20 }}
          toastOptions={{
            duration: 4500,
            style: {
              background: '#010D2D', 
              color: '#fff',
              borderRadius: '12px',
              padding: '16px 24px',
              boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
              borderLeft: '6px solid #E30613', 
              fontFamily: 'Poppins, sans-serif'
            }
          }}
        />
        
        {/* ONLY THE CARD - NO FULL PAGE WRAPPER */}
        <div className="auth-3d-card modal-card">
          <div className="auth-side-brand modal-brand">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="desktop-logo-centered">
              <img src={logo} alt="SkillsMind Logo" className="hero-logo-clean" />
            </motion.div>
          </div>

          <div className="auth-side-form modal-form">
            <AnimatePresence mode="wait">
              {view === 'auth' && (
                <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="form-container-clean">
                  {showOtp ? (
                    <div className="otp-section">
                      <h2 className="form-main-title">Verification</h2>
                      <p className="auth-subtitle">Code sent to <b>{formData.email}</b></p>
                      <div className="otp-input-row">
                        {otp.map((d, i) => (
                          <input className="otp-field" type="text" maxLength="1" key={i} value={d} onChange={e => handleOtpChange(e.target, i)} />
                        ))}
                      </div>
                      <button className="submit-btn-blue" onClick={handleVerifyOtp} disabled={loading}>
                          {loading ? <ButtonSpinner /> : "Register Account"}
                      </button>
                      <p className="resend-text" onClick={() => setShowOtp(false)}>Go Back</p>
                    </div>
                  ) : (
                    <>
                      <h2 className="form-main-title">{isLogin ? 'Sign In' : 'Sign Up'}</h2>
                      <button type="button" className="google-btn-flat" onClick={() => googleLoginHandler()} disabled={loading}>
                        <FcGoogle size={20} /> {loading ? "Syncing..." : "Continue with Google"}
                      </button>
                      <div className="auth-divider"><span>OR</span></div>
                      <form onSubmit={handleAuthSubmit}>
                        {!isLogin && (
                          <div className="input-group-minimal">
                            <FaUser /><input type="text" name="name" placeholder="Full Name" onChange={handleInputChange} required />
                          </div>
                        )}
                        <div className="input-group-minimal">
                          <FaEnvelope /><input type="email" name="email" placeholder="Email Address" onChange={handleInputChange} required />
                        </div>
                        <div className="input-group-minimal">
                          <FaLock /><input type="password" name="password" placeholder="Password" onChange={handleInputChange} required />
                        </div>
                        {isLogin && <p className="forgot-p-link" onClick={() => setView('forgot-request')}>Forgot Password?</p>}
                        <button type="submit" className="submit-btn-blue" disabled={loading}>
                          {loading ? <ButtonSpinner /> : (isLogin ? 'Sign In' : 'Get Security OTP')} {!loading && <FaArrowRight />}
                        </button>
                      </form>
                      <p className="toggle-auth-text">
                        {isLogin ? "Don't have an account?" : "Already verified?"}
                        <span onClick={() => { setIsLogin(!isLogin); setShowOtp(false); }}>{isLogin ? ' Create Account' : ' Sign In Now'}</span>
                      </p>
                    </>
                  )}
                </motion.div>
              )}

              {view === 'forgot-request' && (
                <motion.div key="forgot-req" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} className="form-container-clean">
                  <h2 className="form-main-title">Reset Password</h2>
                  <form onSubmit={handleForgotRequest}>
                    <div className="input-group-minimal">
                      <FaEnvelope /><input type="email" name="forgotEmail" placeholder="Enter Email" value={formData.forgotEmail} onChange={handleInputChange} required />
                    </div>
                    <button type="submit" className="submit-btn-blue" disabled={loading}>
                      {loading ? <ButtonSpinner /> : "Send OTP Code"}
                    </button>
                  </form>
                  <p className="resend-text" onClick={() => setView('auth')}>Back to Login</p>
                </motion.div>
              )}

              {view === 'forgot-otp' && (
                <motion.div key="forgot-otp" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="form-container-clean">
                  <h2 className="form-main-title">Verify OTP</h2>
                  <div className="otp-input-row">
                    {otp.map((d, i) => (
                      <input className="otp-field" type="text" maxLength="1" key={i} value={d} onChange={e => handleOtpChange(e.target, i)} />
                    ))}
                  </div>
                  <button className="submit-btn-blue" onClick={handleVerifyForgotOtp} disabled={loading}>
                    {loading ? <ButtonSpinner /> : "Verify Identity"}
                  </button>
                </motion.div>
              )}

              {view === 'reset-password' && (
                <motion.div key="reset-pass" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="form-container-clean">
                  <h2 className="form-main-title">New Password</h2>
                  <form onSubmit={handleFinalReset}>
                    <div className="input-group-minimal">
                      <FaKey /><input type="password" name="newPassword" placeholder="New Password" onChange={handleInputChange} required />
                    </div>
                    <div className="input-group-minimal">
                      <FaShieldAlt /><input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleInputChange} required />
                    </div>
                    <button type="submit" className="submit-btn-blue" disabled={loading}>
                      {loading ? <ButtonSpinner /> : "Change Password"}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <style>{`
          .sm-spinner-white {
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid #ffffff;
            border-radius: 50%;
            animation: sm-spin 0.8s linear infinite;
          }
          @keyframes sm-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }

  // Normal full page mode (when not in modal)
  return (
    <div className="auth-page-wrapper">
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        gutter={12}
        containerStyle={{ top: 100, right: 20 }}
        toastOptions={{
          duration: 4500,
          style: {
            background: '#010D2D', 
            color: '#fff',
            borderRadius: '12px',
            padding: '16px 24px',
            boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
            borderLeft: '6px solid #E30613', 
            fontFamily: 'Poppins, sans-serif'
          }
        }}
      />
      
      <div className="auth-3d-card">
        <div className="auth-side-brand">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="desktop-logo-centered">
            <img src={logo} alt="SkillsMind Logo" className="hero-logo-clean" />
          </motion.div>
        </div>

        <div className="auth-side-form">
          {/* Same form content as above */}
          <AnimatePresence mode="wait">
            {view === 'auth' && (
              <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="form-container-clean">
                {showOtp ? (
                  <div className="otp-section">
                    <h2 className="form-main-title">Verification</h2>
                    <p className="auth-subtitle">Code sent to <b>{formData.email}</b></p>
                    <div className="otp-input-row">
                      {otp.map((d, i) => (
                        <input className="otp-field" type="text" maxLength="1" key={i} value={d} onChange={e => handleOtpChange(e.target, i)} />
                      ))}
                    </div>
                    <button className="submit-btn-blue" onClick={handleVerifyOtp} disabled={loading}>
                        {loading ? <ButtonSpinner /> : "Register Account"}
                    </button>
                    <p className="resend-text" onClick={() => setShowOtp(false)}>Go Back</p>
                  </div>
                ) : (
                  <>
                    <h2 className="form-main-title">{isLogin ? 'Sign In' : 'Sign Up'}</h2>
                    <button type="button" className="google-btn-flat" onClick={() => googleLoginHandler()} disabled={loading}>
                      <FcGoogle size={20} /> {loading ? "Syncing..." : "Continue with Google"}
                    </button>
                    <div className="auth-divider"><span>OR</span></div>
                    <form onSubmit={handleAuthSubmit}>
                      {!isLogin && (
                        <div className="input-group-minimal">
                          <FaUser /><input type="text" name="name" placeholder="Full Name" onChange={handleInputChange} required />
                        </div>
                      )}
                      <div className="input-group-minimal">
                        <FaEnvelope /><input type="email" name="email" placeholder="Email Address" onChange={handleInputChange} required />
                      </div>
                      <div className="input-group-minimal">
                        <FaLock /><input type="password" name="password" placeholder="Password" onChange={handleInputChange} required />
                      </div>
                      {isLogin && <p className="forgot-p-link" onClick={() => setView('forgot-request')}>Forgot Password?</p>}
                      <button type="submit" className="submit-btn-blue" disabled={loading}>
                        {loading ? <ButtonSpinner /> : (isLogin ? 'Sign In' : 'Get Security OTP')} {!loading && <FaArrowRight />}
                      </button>
                    </form>
                    <p className="toggle-auth-text">
                      {isLogin ? "Don't have an account?" : "Already verified?"}
                      <span onClick={() => { setIsLogin(!isLogin); setShowOtp(false); }}>{isLogin ? ' Create Account' : ' Sign In Now'}</span>
                    </p>
                  </>
                )}
              </motion.div>
            )}

            {view === 'forgot-request' && (
              <motion.div key="forgot-req" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} className="form-container-clean">
                <h2 className="form-main-title">Reset Password</h2>
                <form onSubmit={handleForgotRequest}>
                  <div className="input-group-minimal">
                    <FaEnvelope /><input type="email" name="forgotEmail" placeholder="Enter Email" value={formData.forgotEmail} onChange={handleInputChange} required />
                  </div>
                  <button type="submit" className="submit-btn-blue" disabled={loading}>
                    {loading ? <ButtonSpinner /> : "Send OTP Code"}
                  </button>
                </form>
                <p className="resend-text" onClick={() => setView('auth')}>Back to Login</p>
              </motion.div>
            )}

            {view === 'forgot-otp' && (
              <motion.div key="forgot-otp" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="form-container-clean">
                <h2 className="form-main-title">Verify OTP</h2>
                <div className="otp-input-row">
                  {otp.map((d, i) => (
                    <input className="otp-field" type="text" maxLength="1" key={i} value={d} onChange={e => handleOtpChange(e.target, i)} />
                  ))}
                </div>
                <button className="submit-btn-blue" onClick={handleVerifyForgotOtp} disabled={loading}>
                  {loading ? <ButtonSpinner /> : "Verify Identity"}
                </button>
              </motion.div>
            )}

            {view === 'reset-password' && (
              <motion.div key="reset-pass" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="form-container-clean">
                <h2 className="form-main-title">New Password</h2>
                <form onSubmit={handleFinalReset}>
                  <div className="input-group-minimal">
                    <FaKey /><input type="password" name="newPassword" placeholder="New Password" onChange={handleInputChange} required />
                  </div>
                  <div className="input-group-minimal">
                    <FaShieldAlt /><input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleInputChange} required />
                  </div>
                  <button type="submit" className="submit-btn-blue" disabled={loading}>
                    {loading ? <ButtonSpinner /> : "Change Password"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <style>{`
        .sm-spinner-white {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #ffffff;
          border-radius: 50%;
          animation: sm-spin 0.8s linear infinite;
        }
        @keyframes sm-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginSignup;