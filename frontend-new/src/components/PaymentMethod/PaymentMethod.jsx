import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaChevronLeft, FaShieldAlt, FaCloudUploadAlt, FaUser, 
    FaEnvelope, FaUsers, FaInfinity, FaRegClock, FaSignal,
    FaCreditCard, FaCalendarAlt, FaLock, 
    FaHashtag, FaBook, FaIdCard 
} from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';
import './PaymentMethod.css';

const PaymentMethod = () => {
    const { courseId } = useParams(); 
    const location = useLocation();
    const navigate = useNavigate();
    
    // 🔥 FIX: Enrollment data from LiveEnrollment or RecordedEnrollment
    const enrollmentData = location.state?.enrollmentData || {};
    
    // 🔥 NEW: Enrollment mode handle karo (live/recorded)
    const enrollmentMode = location.state?.mode || 'recorded';
    const modeTitle = enrollmentMode === 'live' ? 'Live Class' : 'Recorded Course';
    
    const [course, setCourse] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const studentName = enrollmentData.fullName || localStorage.getItem('userName') || "Student";

    const [formData, setFormData] = useState({
        studentName: enrollmentData.fullName || '',
        studentEmail: enrollmentData.email || '',
        studentCnic: enrollmentData.cnic || '', // 🔥 CNIC from enrollment
        trxId: '',      
        receipt: null,
        cardNumber: '',
        expiry: '',
        cvc: ''
    });

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/courses/${courseId}`);
                if (res.data) {
                    setCourse(res.data); 
                }
            } catch (err) {
                console.error("SkillsMind Database Error:", err.message);
                Swal.fire({
                    title: 'Data Fetch Error',
                    text: 'SkillsMind server se details nahi mil sakin.',
                    icon: 'error'
                });
            } finally {
                setLoading(false);
            }
        };

        if (courseId && courseId !== "undefined") {
            fetchCourse();
        } else {
            setLoading(false);
        }
    }, [courseId]);

    const getImagePath = (path) => {
        if (!path) return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=500"; 
        if (path.startsWith('http')) return path;
        return `${import.meta.env.VITE_API_URL}${path}`; 
    };

    const paymentMethods = [
        { id: 'jazzcash', name: 'JazzCash', logo: '/jazzcashlogo.png', color: '#d71820', sub: 'Mobile Account', account: '0300-1234567', title: 'SkillsMind Edu' },
        { id: 'easypaisa', name: 'EasyPaisa', logo: '/easypesalogo.png', color: '#37b34a', sub: 'Instant Transfer', account: '0345-7654321', title: 'SkillsMind Official' },
        { id: 'card', name: 'Credit/Debit Card', logo: 'https://cdn-icons-png.flaticon.com/512/349/349221.png', color: '#6366f1', sub: 'International Secure Pay' },
        { id: 'bank', name: 'Bank Transfer', logo: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png', color: '#1e293b', sub: 'All Local Banks', account: '1234 5678 9012 01', title: 'SkillsMind Private Ltd', bankName: 'HBL Bank' }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, receipt: e.target.files[0] }));
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        
        if(selectedMethod.id !== 'card' && (!formData.receipt || !formData.trxId || !formData.studentCnic)) {
            Swal.fire({
                title: 'Incomplete Information',
                text: 'Please fill all fields (CNIC, TRX ID) and upload your payment screenshot.',
                icon: 'warning',
                confirmButtonColor: '#0f172a'
            });
            return;
        }

        setIsSubmitting(true);

        const data = new FormData();
        data.append('studentName', formData.studentName);
        data.append('studentEmail', formData.studentEmail);
        data.append('studentCnic', formData.studentCnic);
        data.append('transactionId', formData.trxId);
        data.append('courseId', courseId);
        data.append('courseName', course.title);
        data.append('amount', course.price);
        data.append('paymentMethod', selectedMethod.name);
        data.append('enrollmentMode', enrollmentMode); // 🔥 Mode save karo
        
        if (formData.receipt) {
            data.append('receipt', formData.receipt);
        }

        // 🔥 IMPORTANT: Email ko localStorage mein save karo
        localStorage.setItem('studentEmail', formData.studentEmail);

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/payments/submit-payment`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

            if (response.data.success) {
                Swal.fire({
                    title: '<span style="color: #000B29; font-weight: 800; letter-spacing: 1px;">PAYMENT SUBMITTED!</span>',
                    html: `
                        <div style="text-align: center; font-family: 'Poppins', sans-serif; padding: 5px;">
                            <div style="margin: 15px 0;">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Check_green_icon.svg" 
                                     alt="tick" 
                                     style="width: 60px; height: 60px; display: block; margin: 0 auto;" />
                            </div>
                            <p style="font-size: 18px; color: #333; margin-bottom: 5px;">Thank you, <b>${formData.studentName}</b>!</p>
                            <p style="color: #666; line-height: 1.5; margin: 15px 0; font-size: 15px;">
                                Your transaction details for <b>${course.title}</b> (${modeTitle}) have been securely sent to the <b>SkillsMind</b> verification team.
                            </p>
                            <div style="background: #fff3cd; color: #856404; padding: 8px 15px; border-radius: 50px; display: inline-block; font-size: 13px; font-weight: bold; margin-bottom: 15px;">
                                Status: Pending Verification
                            </div>
                        </div>
                    `,
                    confirmButtonText: 'Go to My Learning →',
                    confirmButtonColor: '#000B29',
                    showClass: { popup: 'animate__animated animate__zoomIn' },
                    hideClass: { popup: 'animate__animated animate__fadeOut' },
                }).then(() => {
                    navigate('/my-learning');
                });
            }
        } catch (error) {
            console.error("SkillsMind Submission Error:", error);
            Swal.fire({
                title: 'Submission Failed',
                text: 'Server connect nahi ho pa raha.',
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="sm-loader-container">
            <div className="spinner"></div>
            <p>SkillsMind is fetching real-time course details...</p>
        </div>
    );

    if (!course) return <div className="error-msg">Course not found.</div>;

    return (
        <div className="sm-payment-page-v2" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
            <div className="sm-payment-nav" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f0f0f0' }}>
                <button 
                    onClick={() => selectedMethod ? setSelectedMethod(null) : navigate(-1)} 
                    className="back-btn"
                    style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px 15px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#334155' }}
                >
                    <FaChevronLeft /> {selectedMethod ? 'Change Method' : 'Back'}
                </button>
                <div className="sm-brand-name">SkillsMind <span>Secure Pay</span></div>
            </div>

            <div className="sm-payment-wrapper">
                <AnimatePresence mode="wait">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="sm-course-preview-sidebar">
                        <div className="premium-course-card-visual">
                            <div className="course-card-top">
                                <div className="premium-badge">{course.badge || course.category || 'Premium'}</div>
                                <img src={getImagePath(course.thumbnail)} alt={course.title} className="course-preview-img" onError={(e) => e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=500"} />
                                {/* 🔥 Mode show karo */}
                                <div className="reserved-label" style={{ background: enrollmentMode === 'live' ? '#dc2626' : '#3b82f6' }}>
                                    {enrollmentMode === 'live' ? '🔴 Live Class' : '▶️ Recorded'} - Reserved for {studentName}
                                </div>
                            </div>
                            <div className="course-card-body-premium">
                                <div className="sm-course-stats-bar">
                                    <span><FaRegClock /> {course.duration || '3 Months'}</span>
                                    <span><FaSignal /> {course.level || 'Beginner'}</span>
                                </div>
                                <h3 className="course-title-main">{course.title}</h3>
                                <div className="course-meta-info">
                                    <span><FaUser /> Instructor: {course.instructor?.name || 'SkillsMind Expert'}</span>
                                    <span><FaUsers /> {course.instructor?.studentsTaught || '1000'}+ Students Taught</span>
                                    <span><FaInfinity /> Lifetime Access</span>
                                </div>
                                <div className="price-section-premium">
                                    <span className="label">Amount to Pay</span>
                                    <h2 className="final-price">Rs. {course.price}</h2>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {!selectedMethod ? (
                        <motion.div key="selection" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="sm-selection-container">
                            <h3 className="section-title">Select Secure Payment Method</h3>
                            <div className="sm-grid-methods">
                                {paymentMethods.map((m) => (
                                    <div key={m.id} className="premium-method-card" onClick={() => setSelectedMethod(m)}>
                                        <img src={m.logo} alt={m.name} className="method-img-logo" />
                                        <div className="method-info"><strong>{m.name}</strong><span>{m.sub}</span></div>
                                        <div className="arrow-circle">→</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="details" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="sm-expanded-payment-card" style={{ background: '#ffffff' }}>
                            <div className="method-header" style={{ borderColor: selectedMethod.color }}>
                                <img src={selectedMethod.logo} alt="logo" style={{width: '60px'}} />
                                <div>
                                    <h4>Pay with {selectedMethod.name}</h4>
                                    <p>{modeTitle} - Amount: Rs. {course.price}</p>
                                </div>
                            </div>

                            {selectedMethod.id === 'card' ? (
                                <form className="sm-verification-form" onSubmit={handleFinalSubmit}>
                                    <div className="sm-field">
                                        <label><FaUser /> Name on Card</label>
                                        <input type="text" placeholder="John Doe" required style={{ background: '#ffffff' }} />
                                    </div>
                                    <div className="sm-field">
                                        <label><FaCreditCard /> Card Number</label>
                                        <input type="text" placeholder="xxxx xxxx xxxx xxxx" required maxLength="19" style={{ background: '#ffffff' }} />
                                    </div>
                                    <button type="submit" className="sm-submit-payment-btn" style={{ background: selectedMethod.color }}>
                                        {isSubmitting ? 'Processing...' : `PAY RS. ${course.price}`}
                                    </button>
                                </form>
                            ) : (
                                <>
                                    <div className="sm-account-details">
                                        <div className="detail-row"><span>Account Title</span><strong>{selectedMethod.title}</strong></div>
                                        <div className="detail-row">
                                            <span>Account Number</span>
                                            <strong className="copyable-text" onClick={() => {
                                                navigator.clipboard.writeText(selectedMethod.account);
                                                Swal.fire({ title: 'Copied!', toast: true, position: 'top-end', timer: 800, showConfirmButton: false, icon: 'success' });
                                            }}>{selectedMethod.account}</strong>
                                        </div>
                                    </div>

                                    <form className="sm-verification-form" onSubmit={handleFinalSubmit}>
                                        <div className="sm-input-group">
                                            <div className="sm-field">
                                                <label><FaUser /> Full Name</label>
                                                <input type="text" name="studentName" required value={formData.studentName} onChange={handleInputChange} style={{ background: '#ffffff' }} />
                                            </div>
                                            <div className="sm-field">
                                                <label><FaEnvelope /> Email Address</label>
                                                <input type="email" name="studentEmail" required value={formData.studentEmail} onChange={handleInputChange} style={{ background: '#ffffff' }} />
                                            </div>
                                        </div>

                                        <div className="sm-input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                                            <div className="sm-field">
                                                <label><FaBook /> Course Name</label>
                                                <input type="text" value={course.title} readOnly style={{ background: '#f8fafc', color: '#64748b' }} />
                                            </div>
                                            <div className="sm-field">
                                                <label><FaHashtag /> Transaction ID (TRX)</label>
                                                <input type="text" name="trxId" placeholder="TRX-123456" required value={formData.trxId} onChange={handleInputChange} style={{ background: '#ffffff' }} />
                                            </div>
                                        </div>

                                        <div className="sm-field" style={{ marginTop: '10px' }}>
                                            <label><FaIdCard /> Student CNIC / Identity No.</label>
                                            <input type="text" name="studentCnic" placeholder="42xxx-xxxxxxx-x" required value={formData.studentCnic} onChange={handleInputChange} style={{ background: '#ffffff' }} />
                                        </div>

                                        <div className="sm-upload-area">
                                            <label>Upload Payment Screenshot</label>
                                            <div className="dropzone-v2" style={{ background: '#ffffff', border: '2px dashed #e2e8f0' }}>
                                                <input type="file" id="ss" hidden required onChange={handleFileChange} accept="image/*" />
                                                <label htmlFor="ss">
                                                    <FaCloudUploadAlt size={30} color={selectedMethod.color} />
                                                    <span>{formData.receipt ? formData.receipt.name : 'Click to Upload Transaction Receipt'}</span>
                                                </label>
                                            </div>
                                        </div>
                                        
                                        <button type="submit" className="sm-submit-payment-btn" disabled={isSubmitting} style={{ background: selectedMethod.color }}>
                                            {isSubmitting ? 'Verifying...' : 'SUBMIT FOR APPROVAL'}
                                        </button>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PaymentMethod;