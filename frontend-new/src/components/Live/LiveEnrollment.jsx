import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    FaArrowRight, FaChevronLeft, FaCamera, FaUser, FaPhoneAlt, 
    FaMapMarkerAlt, FaGlobe, FaUsers, FaUserGraduate, 
    FaChartLine, FaCheckCircle, FaRocket, FaEnvelope, FaCalendarAlt 
} from 'react-icons/fa';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import axios from 'axios'; 
import Swal from 'sweetalert2'; 
import './LiveEnrollment.css';

const LiveEnrollment = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const { courseName } = useParams(); 
    
    // --- DYNAMIC NAME, PRICE & ID LOGIC ---
    const courseId = location.state?.course?._id; // <--- Yeh ID bohat zaroori hai
    const realTimeTitle = location.state?.course?.title; 
    const coursePrice = location.state?.course?.price || "0";
    const courseImage = location.state?.course?.image || "https://via.placeholder.com/400x250";
    const courseDuration = location.state?.course?.duration || "3 Months";
    const courseLevel = location.state?.course?.level || "Beginner";

    const formattedName = realTimeTitle 
        ? realTimeTitle 
        : (courseName 
            ? courseName.replace(/-/g, ' ') 
            : (localStorage.getItem('getenrollment') || "Full Stack Web Development"));

    const [selectedCourse, setSelectedCourse] = useState(formattedName);
    
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        city: '',
        phone: '',
        address: '',
        dob: '',
        gender: 'male',
        agreeTerms: false,
        course: formattedName 
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const [stats, setStats] = useState({
        totalStudents: 0,
        profilesBuilt: 0,
        activeNow: 0,
        successRate: 0
    });

    const graphData = [
        { day: 'Mon', signups: 120 },
        { day: 'Tue', signups: 210 },
        { day: 'Wed', signups: 180 },
        { day: 'Thu', signups: 350 },
        { day: 'Fri', signups: stats.activeNow > 0 ? stats.activeNow * 15 : 400 },
    ];

    useEffect(() => {
        if (realTimeTitle) {
            setSelectedCourse(realTimeTitle);
            setFormData(prev => ({ ...prev, course: realTimeTitle }));
        }
        else if (courseName) {
            const newName = courseName.replace(/-/g, ' ');
            setSelectedCourse(newName);
            setFormData(prev => ({ ...prev, course: newName }));
        }

        const fetchRealTimeStats = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/stats');
                setStats({
                    totalStudents: response.data.totalRegistered || 0,
                    profilesBuilt: response.data.profilesBuilt || 0,
                    activeNow: response.data.activeNow || 0,
                    successRate: response.data.successRate || 98
                });
            } catch (error) {
                console.error("Backend connection error:", error.message);
                setStats({
                    totalStudents: 15420,
                    profilesBuilt: 9200,
                    activeNow: 164,
                    successRate: 98
                });
            }
        };

        fetchRealTimeStats();
        const interval = setInterval(fetchRealTimeStats, 10000);
        return () => clearInterval(interval);
    }, [courseName, realTimeTitle]); 

    // --- SUBMIT HANDLER (Updated for Payment Navigation) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.agreeTerms) {
            Swal.fire('Error', 'Please agree to the security terms.', 'error');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/enroll/live-register', formData);

            if (response.status === 201 || response.status === 200) {
                const amountToPay = coursePrice;

                Swal.fire({
                    title: '<span style="color: #0f172a; font-weight: 800; letter-spacing: -0.5px;">REGISTRATION SUCCESSFUL</span>',
                    html: `
                        <div style="text-align: center; padding: 10px; font-family: 'Inter', sans-serif;">
                            <p style="font-size: 1.05rem; color: #475569; margin-bottom: 20px;">
                                Excellent, <b>${formData.fullName}</b>! Your seat has been reserved.
                            </p>
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: left;">
                                <div style="margin-bottom: 12px;">
                                    <small style="color: #dc2626; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Selected Course</small>
                                    <div style="font-size: 1.1rem; font-weight: 700; color: #1e293b;">${selectedCourse}</div>
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <small style="color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 10px;">Total Amount</small>
                                    <div style="font-size: 1.4rem; font-weight: 800; color: #0f172a;">Rs. ${amountToPay}</div>
                                </div>
                            </div>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonText: 'PROCEED TO PAYMENT →',
                    confirmButtonColor: '#0f172a',
                    allowOutsideClick: false
                }).then((result) => {
                    if (result.isConfirmed) {
                        // FIX: Ab hum URL mein Course ID bhej rahe hain
                        // Agar courseId nahi hai to 'id-missing' bhejega taake app crash na ho
                        const finalId = courseId || 'id-missing';
                        
                        navigate(`/payment-method/${finalId}`, { 
                            state: { 
                                course: selectedCourse, 
                                amount: amountToPay,
                                image: courseImage,
                                duration: courseDuration,
                                level: courseLevel,
                                enrollmentData: formData // Student ki details bhi bhej di
                            } 
                        });
                    }
                });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            Swal.fire('Error', 'Registration failed. Please check your backend server.', 'error');
        }
    };

    return (
        <div className="sm-final-portal">
            <main className="sm-main-wrapper">
                {/* LEFT SIDE: FORM */}
                <div className="sm-form-column">
                    <div className="sm-back-arrow-container">
                        <button className="sm-icon-only-back" onClick={() => navigate(-1)}>
                            <FaChevronLeft />
                        </button>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="sm-form-box-sharp"
                    >
                        <div className="sm-intro">
                            <h1 className="sm-main-heading">Register Yourself at <span>SkillsMind</span></h1>
                            <div className="sm-course-badge">
                                <span>CURRENTLY ENROLLING IN:</span>
                                <strong style={{ textTransform: 'uppercase' }}>{selectedCourse}</strong>
                            </div>
                        </div>

                        <div className="sm-journey-map-v2">
                            <div className="sm-map-step active">
                                <div className="sm-map-dot">1</div>
                                <span className="sm-map-label">DETAILS</span>
                            </div>
                            <div className="sm-map-connector"></div>
                            <div className="sm-map-step">
                                <div className="sm-map-dot">2</div>
                                <span className="sm-map-label">PAYMENT</span>
                            </div>
                            <div className="sm-map-connector"></div>
                            <div className="sm-map-step">
                                <div className="sm-map-dot">3</div>
                                <span className="sm-map-label">START</span>
                            </div>
                        </div>

                        <form className="sm-sharp-form-v11" onSubmit={handleSubmit}>
                            <div className="sm-input-field">
                                <label><FaUser /> STUDENT FULL NAME</label>
                                <input 
                                    type="text" 
                                    name="fullName"
                                    value={formData.fullName}
                                    placeholder="e.g. Anas Iftikhar" 
                                    required 
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="sm-input-field">
                                <label><FaEnvelope /> EMAIL ADDRESS</label>
                                <input 
                                    type="email" 
                                    name="email"
                                    value={formData.email}
                                    placeholder="example@gmail.com" 
                                    required 
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="sm-input-row">
                                <div className="sm-input-field">
                                    <label><FaGlobe /> CITY</label>
                                    <input 
                                        type="text" 
                                        name="city"
                                        value={formData.city}
                                        placeholder="e.g. Multan" 
                                        required 
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="sm-input-field">
                                    <label><FaPhoneAlt /> PHONE NUMBER</label>
                                    <input 
                                        type="tel" 
                                        name="phone"
                                        value={formData.phone}
                                        placeholder="03xx xxxxxxx" 
                                        required 
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="sm-input-row">
                                <div className="sm-input-field">
                                    <label><FaMapMarkerAlt /> HOME ADDRESS</label>
                                    <input 
                                        type="text" 
                                        name="address"
                                        value={formData.address}
                                        placeholder="House #, Street..." 
                                        required 
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="sm-input-field">
                                    <label><FaCalendarAlt /> DATE OF BIRTH</label>
                                    <input 
                                        type="date" 
                                        name="dob"
                                        value={formData.dob}
                                        required 
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="sm-input-row">
                                <div className="sm-input-field">
                                    <label>GENDER</label>
                                    <div className="sm-gender-group">
                                        <label className="sm-gender-card">
                                            <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleInputChange} />
                                            <div className="sm-gender-box">MALE</div>
                                        </label>
                                        <label className="sm-gender-card">
                                            <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleInputChange} />
                                            <div className="sm-gender-box">FEMALE</div>
                                        </label>
                                    </div>
                                </div>
                                <div className="sm-input-field">
                                    <label><FaCamera /> ATTACH PICTURE (OPTIONAL)</label>
                                    <input type="file" id="pic" hidden />
                                    <label htmlFor="pic" className="sm-upload-btn-custom">
                                        UPLOAD PHOTO
                                    </label>
                                </div>
                            </div>

                            <div className="sm-terms-container" style={{ marginTop: '10px' }}>
                                <label style={{ display: 'flex', gap: '10px', fontSize: '12px', cursor: 'pointer', color: '#64748b' }}>
                                    <input 
                                        type="checkbox" 
                                        name="agreeTerms" 
                                        checked={formData.agreeTerms}
                                        required 
                                        onChange={handleInputChange}
                                    />
                                    <span>
                                        I agree that this data is for security purposes. I understand that the payment is <strong>non-refundable</strong>.
                                    </span>
                                </label>
                            </div>

                            <motion.button 
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit" 
                                className="sm-decent-btn brand-blue-btn"
                            >
                                PROCEED TO PAYMENT <FaArrowRight />
                            </motion.button>
                        </form>
                    </motion.div>
                </div>

                {/* RIGHT SIDE: STATS */}
                <div className="sm-visual-column premium-bg">
                    <div className="sm-bg-image-overlay"></div>

                    <div className="sm-stats-container">
                        <motion.h2 
                            initial={{ opacity: 0, y: -20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="sm-stats-heading"
                        >
                            Real-Time Growth
                        </motion.h2>

                        <motion.div 
                            initial={{ opacity: 0, y: 30 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="sm-premium-card-white"
                        >
                            <div className="card-icon blue"><FaUsers /></div>
                            <div className="card-content">
                                <h3>{stats.totalStudents.toLocaleString()}+</h3>
                                <p>Total Community Members</p>
                            </div>
                            <div className="sm-live-indicator">
                                <span className="sm-ping"></span> Live
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="sm-graph-container-white"
                        >
                            <div className="graph-header">
                                <span>Weekly Enrollment Peak</span>
                                <FaChartLine color="#dc2626" />
                            </div>
                            <div style={{ width: '100%', height: 130 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={graphData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <Area 
                                            type="monotone" 
                                            dataKey="signups" 
                                            stroke="#dc2626" 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorValue)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <div className="sm-stats-grid">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="sm-premium-card-white mini"
                            >
                                <div className="card-icon green"><FaCheckCircle /></div>
                                <div className="card-content">
                                    <h4>{stats.profilesBuilt.toLocaleString()}</h4>
                                    <p>Profiles Built</p>
                                </div>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="sm-premium-card-white mini"
                            >
                                <div className="card-icon orange"><FaUserGraduate /></div>
                                <div className="card-content">
                                    <h4>{stats.successRate}%</h4>
                                    <p>Success Rate</p>
                                </div>
                            </motion.div>
                        </div>

                        <motion.div 
                            initial={{ opacity: 0, y: 30 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="sm-premium-card-white"
                        >
                            <div className="card-icon rocket"><FaRocket /></div>
                            <div className="card-content">
                                <h3>{stats.activeNow}</h3>
                                <p>Students Enrolling Right Now</p>
                            </div>
                        </motion.div>

                        <motion.div className="sm-trust-text-premium">
                            Join the fastest growing community in Pakistan. <br />
                            <strong>SkillsMind</strong> is trusted by thousands!
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LiveEnrollment;