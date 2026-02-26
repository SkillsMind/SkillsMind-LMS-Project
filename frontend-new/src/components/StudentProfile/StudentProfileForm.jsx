import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCheckCircle, FaArrowRight, FaUserCircle, 
  FaPhoneAlt, FaGraduationCap, FaBriefcase, FaLightbulb, FaInfoCircle, FaTrophy 
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios'; 
import './StudentProfile.css';

// --- SUCCESS MODAL COMPONENT ---
const SuccessModal = ({ isOpen }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="modal-overlay">
        <motion.div 
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          className="success-modal-card"
        >
          <div className="success-icon-wrapper" style={{ marginBottom: '20px' }}>
            <FaTrophy size={50} color="#0066ff" />
          </div>
          <h2 style={{ color: '#000b1c', marginBottom: '10px' }}>Profile Optimized!</h2>
          <p>Your identity at <strong>SkillsMind</strong> is ready.</p>
          <div className="loader-line"></div> 
          <div style={{ marginTop: '20px', color: '#64748b' }}>Redirecting to enrollment...</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const StudentProfileForm = () => {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    userId: '', 
    firstName: '', lastName: '', gender: '', dob: '',
    mobile: '', city: '', 
    institute: '', passingYear: '',
    status: 'Student', interest: '', motivation: ''
  });

  useEffect(() => {
    const checkAndFillProfile = async () => {
      const storedUserId = localStorage.getItem('userId');
      
      if (!storedUserId || storedUserId === 'undefined') {
        navigate('/login');
        return;
      }

      setFormData(prev => ({ ...prev, userId: storedUserId }));

      if (location.state && location.state.existingData) {
        setFormData(location.state.existingData);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/api/student-profile/check/${storedUserId}`);
        if (response.data.exists && !location.state?.isUpdating) {
          localStorage.setItem('studentProfileId', response.data.profileId);
          navigate('/get-enrolment');
        }
      } catch (error) {
        console.error("SkillsMind Profile Check Error:", error);
      }
    };
    checkAndFillProfile();
  }, [navigate, location.state]);

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectOption = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (step < 5) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStep((prev) => prev + 1);
    } else {
      setLoading(true);
      try {
        const currentUserId = localStorage.getItem('userId');

        if (!currentUserId || currentUserId === 'undefined') {
            alert("SkillsMind Session Expired! Please login again.");
            navigate('/login');
            return;
        }

        // --- PREPARING PAYLOAD ---
        const finalPayload = { 
            ...formData, 
            user: currentUserId 
        };

        // --- DEBUG LOG: Adding the console log here as requested ---
        console.log("🚀 [FRONTEND] Sending data to SkillsMind:", finalPayload);

        // --- API CALL ---
        const response = await axios.post('http://localhost:5000/api/student-profile/submit', finalPayload);
        
        if (response.data.success) {
          if(response.data.profile) {
              localStorage.setItem('studentProfileId', response.data.profile._id);
          }
          setShowSuccess(true);
          setTimeout(() => navigate('/get-enrolment'), 3000);
        }
      } catch (error) {
        console.error("SkillsMind Submission Error:", error);
        if (error.response) {
            alert(`SkillsMind Error: ${error.response.data.message || "Failed to save profile."}`);
        } else {
            alert("Cannot connect to SkillsMind servers.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const galleryImages = [
    { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600", name: "Digital Marketing" },
    { url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600", name: "Web Development" },
    { url: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600", name: "UI/UX Design" },
    { url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600", name: "Graphic Design" }
  ];

  const renderFinishButton = () => (
    <button type="submit" className="btn-finish-sm" disabled={loading}>
      {loading ? (
        <span className="flex-center">
          <div className="skillsmind-spinner"></div> Saving...
        </span>
      ) : (
        location.state?.isUpdating ? "Update" : "Finish"
      )}
    </button>
  );

  return (
    <>
      <SuccessModal isOpen={showSuccess} />
      <div className={`onboarding-main-wrapper ${showSuccess ? 'blur-content' : ''}`}>
        <div className="onboarding-container">
          <div className="onboarding-form-side">
            <div className="hero-text-container">
              <h1 className="main-title">
                {location.state?.isUpdating ? "UPDATE YOUR" : "BUILD YOUR"}{" "}
                <span className="red-text">SkillsMind</span> IDENTITY
              </h1>
              <div className="info-guide-card">
                 <FaInfoCircle className="info-icon" />
                 <p>Provide info for personalized course suggestions.</p>
              </div>
            </div>

            <div className="form-glass-card">
              <div className="step-indicator-bar">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className={`step-point ${step >= s ? 'active' : ''}`}>
                    {step > s ? <FaCheckCircle size={12} /> : s}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="s1">
                      <h3 className="step-title"><FaUserCircle /> Personal Info</h3>
                      <div className="form-grid-layout" style={{marginTop: '15px'}}>
                        <div className="input-grp">
                          <label>First Name *</label>
                          <input type="text" name="firstName" required value={formData.firstName} onChange={handleInput} placeholder="e.g. Anas" />
                        </div>
                        <div className="input-grp">
                          <label>Last Name *</label>
                          <input type="text" name="lastName" required value={formData.lastName} onChange={handleInput} placeholder="Iftikhar" />
                        </div>
                        <div className="input-grp span-2">
                           <label>Gender *</label>
                           <div className="modern-chips">
                              {['Male', 'Female'].map(g => (
                                <div key={g} className={`chip ${formData.gender === g ? 'active' : ''}`} onClick={() => selectOption('gender', g)}>
                                  {formData.gender === g && <FaCheckCircle />} {g}
                                </div>
                              ))}
                           </div>
                        </div>
                        <div className="input-grp span-2">
                          <label>Date of Birth *</label>
                          <input type="date" name="dob" required value={formData.dob ? formData.dob.split('T')[0] : ''} onChange={handleInput} />
                        </div>
                      </div>
                      <div className="btn-row"><button type="submit" className="btn-primary-sm">Continue <FaArrowRight /></button></div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="s2">
                      <h3 className="step-title"><FaPhoneAlt /> Contact Details</h3>
                      <div className="form-grid-layout" style={{marginTop: '15px'}}>
                        <div className="input-grp span-2"><label>Mobile *</label><input type="tel" name="mobile" required value={formData.mobile} onChange={handleInput} placeholder="03XXXXXXXXX" /></div>
                        <div className="input-grp span-2"><label>City *</label><input type="text" name="city" required value={formData.city} onChange={handleInput} placeholder="e.g. Multan" /></div>
                      </div>
                      <div className="btn-row">
                        <button type="button" className="btn-secondary-sm" onClick={prevStep}>Back</button>
                        <button type="submit" className="btn-primary-sm">Next</button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="s3">
                      <h3 className="step-title"><FaGraduationCap /> Education</h3>
                      <div className="form-grid-layout" style={{marginTop: '15px'}}>
                        <div className="input-grp span-2"><label>Institute *</label><input type="text" name="institute" required value={formData.institute} onChange={handleInput} placeholder="University/College Name" /></div>
                        <div className="input-grp span-2"><label>Passing Year *</label><input type="text" name="passingYear" required value={formData.passingYear} onChange={handleInput} placeholder="e.g. 2023" /></div>
                      </div>
                      <div className="btn-row">
                        <button type="button" className="btn-secondary-sm" onClick={prevStep}>Back</button>
                        <button type="submit" className="btn-primary-sm">Next</button>
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="s4">
                      <h3 className="step-title"><FaBriefcase /> Current Status</h3>
                      <div className="form-grid-layout" style={{marginTop: '15px'}}>
                        <div className="input-grp span-2">
                           <div className="modern-chips">
                              {['Student', 'Working Professional', 'Freelancer'].map(s => (
                                <div key={s} className={`chip ${formData.status === s ? 'active' : ''}`} onClick={() => selectOption('status', s)}>
                                  {formData.status === s && <FaCheckCircle />} {s}
                                </div>
                              ))}
                           </div>
                        </div>
                        <div className="input-grp span-2"><label>Primary Interest *</label><input type="text" name="interest" required value={formData.interest} onChange={handleInput} placeholder="e.g. Web Development" /></div>
                      </div>
                      <div className="btn-row">
                        <button type="button" className="btn-secondary-sm" onClick={prevStep}>Back</button>
                        <button type="submit" className="btn-primary-sm">Finalize</button>
                      </div>
                    </motion.div>
                  )}

                  {step === 5 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="s5">
                      <h3 className="step-title"><FaLightbulb /> Motivation</h3>
                      <div className="input-grp span-2" style={{marginTop: '15px'}}>
                        <label>Why SkillsMind? *</label>
                        <textarea name="motivation" required value={formData.motivation} onChange={handleInput} placeholder="Briefly describe your goals..." rows="4"></textarea>
                      </div>
                      <div className="btn-row">
                        <button type="button" className="btn-secondary-sm" onClick={prevStep} disabled={loading}>Review</button>
                        {renderFinishButton()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>

          <div className="onboarding-visual-side">
            <div className="gallery-scroll-container">
              {galleryImages.concat(galleryImages).map((item, i) => (
                <motion.div 
                  key={i} 
                  className="gallery-img-wrapper" 
                  animate={{ y: [0, -1500] }} 
                  transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                >
                  <img src={item.url} alt={item.name} />
                  <div className="image-name-badge">
                    <span>{item.name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .skillsmind-spinner {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top: 3px solid #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 10px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-finish-sm:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
          opacity: 0.8;
        }
        .blur-content {
          filter: blur(5px);
          pointer-events: none;
        }
      `}</style>
    </>
  );
};

export default StudentProfileForm;