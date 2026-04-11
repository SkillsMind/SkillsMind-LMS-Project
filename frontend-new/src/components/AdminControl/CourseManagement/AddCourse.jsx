import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast'; 
import { 
    FaInfoCircle, FaChalkboardTeacher, FaListOl, FaCloudUploadAlt, 
    FaPlus, FaTrash, FaCheckCircle, FaChevronRight, FaRegImage, FaVideo, FaRocket,
    FaEdit, FaEye, FaEyeSlash, FaTasks, FaUserCircle
} from 'react-icons/fa';
import './AddCourse.css';

const AddCourse = () => {
    const [view, setView] = useState('manage'); 
    const [courses, setCourses] = useState([]);
    const [isEditing, setIsEditing] = useState(null); 
    const [activeStep, setActiveStep] = useState(1);

    const [courseData, setCourseData] = useState({
        title: '', description: '', price: '', duration: '', 
        level: 'Beginner', category: '', badge: 'Premium', 
        thumbnail: null, videoFile: null, videoUrl: '',
        instructor: { 
            name: '', bio: '', expertise: '', studentsTaught: 0, 
            profilePic: null, introVideoFile: null, introVideoUrl: ''          
        }, 
        syllabus: [{ week: 1, mainTopic: '', lessons: [''] }]
    });

    const [uploadProgress, setUploadProgress] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toastStyle = {
        border: '1px solid #e31e24',
        padding: '16px',
        color: '#1e293b',
        background: '#ffffff',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
    };

    const fetchCourses = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/courses`);
            setCourses(res.data);
        } catch (err) {
            console.error("Fetch Error:", err);
            toast.error("SkillsMind: Database connection failed", { style: toastStyle });
        }
    };

    useEffect(() => {
        if (view === 'manage') fetchCourses();
    }, [view]);

    const handleHideUnhide = async (id) => {
        const load = toast.loading("SkillsMind: Updating visibility...", { style: toastStyle });
        try {
            const response = await axios.patch(`${import.meta.env.VITE_API_URL}/api/courses/toggle-hide/${id}`);
            if (response.data.success) {
                toast.success(`SkillsMind: Course ${response.data.isHide ? 'Hidden' : 'Visible'}!`, { id: load, style: toastStyle });
                fetchCourses(); 
            }
        } catch (err) {
            toast.error("SkillsMind: Visibility update failed", { id: load, style: toastStyle });
        }
    };

    const handleDelete = (id) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>
                    SkillsMind: Are you sure you want to delete this course?
                </span>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={async () => {
                        toast.dismiss(t.id);
                        const load = toast.loading("SkillsMind: Removing course...", { style: toastStyle });
                        try {
                            await axios.delete(`${import.meta.env.VITE_API_URL}/api/courses/${id}`);
                            toast.success("SkillsMind: Course removed!", { id: load, style: toastStyle });
                            fetchCourses();
                        } catch (err) {
                            toast.error("Delete failed", { id: load, style: toastStyle });
                        }
                    }} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#e31e24', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Yes, Delete</button>
                </div>
            </div>
        ), { duration: 6000, style: { ...toastStyle, borderLeft: '5px solid #e31e24', minWidth: '350px' } });
    };

    const startEdit = (course) => {
        setIsEditing(course._id);
        setCourseData({
            ...course,
            instructor: { 
                ...course.instructor, 
                expertise: Array.isArray(course.instructor?.expertise) ? course.instructor.expertise.join(', ') : course.instructor?.expertise || '' 
            }
        });
        setView('add'); 
        setActiveStep(1); 
    };

    const resetForm = () => {
        setIsEditing(null);
        setCourseData({
            title: '', description: '', price: '', duration: '', 
            level: 'Beginner', category: '', badge: 'Premium', 
            thumbnail: null, videoFile: null, videoUrl: '',
            instructor: { name: '', bio: '', expertise: '', studentsTaught: 0, profilePic: null, introVideoFile: null, introVideoUrl: '' }, 
            syllabus: [{ week: 1, mainTopic: '', lessons: [''] }]
        });
        setUploadProgress({});
        setActiveStep(1);
    };

    const handleFileChange = (e, field) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (field === 'thumbnail') setCourseData({ ...courseData, thumbnail: file });
            else if (field === 'profilePic') setCourseData({ ...courseData, instructor: { ...courseData.instructor, profilePic: file } });
            else if (field === 'videoFile') setCourseData({ ...courseData, videoFile: file });
            else if (field === 'instructorVideo') setCourseData({ ...courseData, instructor: { ...courseData.instructor, introVideoFile: file } });
            
            toast.success(`${field} selected: ${file.name}`, { style: toastStyle });
        }
    };

    const handleLessonChange = (wIdx, lIdx, val) => {
        const newSyllabus = [...courseData.syllabus];
        newSyllabus[wIdx].lessons[lIdx] = val;
        setCourseData({ ...courseData, syllabus: newSyllabus });
    };

    const addWeek = () => {
        setCourseData({
            ...courseData,
            syllabus: [...courseData.syllabus, { week: courseData.syllabus.length + 1, mainTopic: '', lessons: [''] }]
        });
    };

    const addLesson = (weekIndex) => {
        const newSyllabus = [...courseData.syllabus];
        newSyllabus[weekIndex].lessons.push('');
        setCourseData({ ...courseData, syllabus: newSyllabus });
    };

    // ==========================================
    // 🔥 FINAL SUBMIT - COMPLETELY FIXED
    // ==========================================
    const handleFinalSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!courseData.title || !courseData.category || !courseData.price) {
            toast.error("Please fill all required fields", { style: toastStyle });
            return;
        }
        
        setIsSubmitting(true);
        const load = toast.loading("SkillsMind: Saving to Database...", { style: toastStyle });
        
        try {
            const formData = new FormData();
            
            // Append basic text fields
            formData.append('title', courseData.title);
            formData.append('description', courseData.description || '');
            formData.append('price', String(courseData.price));
            formData.append('duration', courseData.duration || '3 Months');
            formData.append('level', courseData.level);
            formData.append('category', courseData.category);
            formData.append('badge', courseData.badge || 'Premium');
            formData.append('videoUrl', courseData.videoUrl || '');

            // Append files (MUST be File objects)
            if (courseData.thumbnail && courseData.thumbnail instanceof File) {
                formData.append('thumbnail', courseData.thumbnail);
                console.log('📷 Thumbnail attached:', courseData.thumbnail.name, courseData.thumbnail.size);
            }
            
            if (courseData.videoFile && courseData.videoFile instanceof File) {
                formData.append('courseVideo', courseData.videoFile);
                console.log('🎥 Course video attached:', courseData.videoFile.name, courseData.videoFile.size);
            }
            
            if (courseData.instructor.profilePic && courseData.instructor.profilePic instanceof File) {
                formData.append('profilePic', courseData.instructor.profilePic);
                console.log('👤 Profile pic attached:', courseData.instructor.profilePic.name);
            }
            
            if (courseData.instructor.introVideoFile && courseData.instructor.introVideoFile instanceof File) {
                formData.append('instructorIntroVideo', courseData.instructor.introVideoFile);
                console.log('📹 Instructor video attached:', courseData.instructor.introVideoFile.name);
            }

            // Prepare instructor object
            const instructorObj = {
                name: courseData.instructor.name || '',
                bio: courseData.instructor.bio || '',
                expertise: typeof courseData.instructor.expertise === 'string' 
                    ? courseData.instructor.expertise.split(',').map(i => i.trim()).filter(i => i) 
                    : (Array.isArray(courseData.instructor.expertise) ? courseData.instructor.expertise : []),
                studentsTaught: Number(courseData.instructor.studentsTaught) || 0,
                introVideoUrl: courseData.instructor.introVideoUrl || ''
            };
            
            formData.append('instructor', JSON.stringify(instructorObj));
            formData.append('syllabus', JSON.stringify(courseData.syllabus));

            // Debug log
            console.log('📤 Submitting form data...');
            for (let pair of formData.entries()) {
                if (pair[1] instanceof File) {
                    console.log(`   ${pair[0]}: [FILE] ${pair[1].name} (${pair[1].size} bytes)`);
                } else {
                    console.log(`   ${pair[0]}: ${pair[1]}`);
                }
            }

            let response;
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            
            if (isEditing) {
                response = await axios.put(`${apiUrl}/api/courses/${isEditing}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress({ ...uploadProgress, overall: percent });
                    }
                });
            } else {
                response = await axios.post(`${apiUrl}/api/courses/add`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress({ ...uploadProgress, overall: percent });
                    }
                });
            }
            
            if (response.data.success) {
                toast.success(isEditing ? "✅ Course Updated Successfully!" : "🚀 Course Launched Successfully!", { id: load, style: toastStyle });
                setView('manage');
                resetForm();
                fetchCourses();
            } else {
                toast.error(response.data.message || "Operation failed", { id: load, style: toastStyle });
            }
            
        } catch (err) {
            console.error("Submit Error:", err);
            const errorMsg = err.response?.data?.message || err.message || "Operation failed";
            toast.error(`Error: ${errorMsg}`, { id: load, style: toastStyle });
        } finally {
            setIsSubmitting(false);
            setUploadProgress({});
        }
    };

    return (
        <div className="sm-admin-container">
            <Toaster position="top-center" />
            
            <div className="sm-admin-header">
                <h2>SkillsMind Admin Panel</h2>
                <div className="sm-header-actions">
                    <button className={view === 'manage' ? 'btn-active' : ''} onClick={() => setView('manage')}>
                        <FaTasks /> Manage Courses
                    </button>
                    <button className={view === 'add' ? 'btn-active' : ''} onClick={() => { setView('add'); if(!isEditing) resetForm(); }}>
                        <FaPlus /> {isEditing ? "Editing Course" : "Add New Course"}
                    </button>
                </div>
            </div>

            {view === 'manage' ? (
                <div className="sm-table-card animate-slide">
                    <table className="sm-course-table">
                        <thead>
                            <tr><th>Thumbnail</th><th>Course Title</th><th>Category</th><th>Price</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {courses.length > 0 ? courses.map(course => (
                                <tr key={course._id} style={course.isHide ? { opacity: 0.6, background: '#f1f5f9' } : {}}>
                                    <td>{course.thumbnail ? <img src={course.thumbnail.startsWith('http') ? course.thumbnail : `${import.meta.env.VITE_API_URL}${course.thumbnail}`} alt="thumb" className="sm-row-img" /> : <span>No img</span>}</td>
                                    <td><strong>{course.title}</strong> {course.isHide && <span style={{fontSize:'10px', color:'#e31e24', marginLeft:'5px'}}>(HIDDEN)</span>}</td>
                                    <td>{course.category}</td>
                                    <td>PKR {course.price}</td>
                                    <td className="sm-actions">
                                        <button onClick={() => startEdit(course)} title="Edit"><FaEdit /></button>
                                        <button onClick={() => handleHideUnhide(course._id)} title={course.isHide ? "Show Course" : "Hide Course"} style={{ color: course.isHide ? '#94a3b8' : '#e31e24' }}>{course.isHide ? <FaEyeSlash /> : <FaEye />}</button>
                                        <button className="del-btn" onClick={() => handleDelete(course._id)} title="Delete"><FaTrash /></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>No courses found in SkillsMind Database.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="sm-step-container">
                    <div className="sm-step-navbar">
                        {[1, 2, 3, 4].map((step) => (
                            <button key={step} className={activeStep === step ? 'active' : activeStep > step ? 'done' : ''} onClick={() => setActiveStep(step)}>
                                <span className="step-num">{activeStep > step ? <FaCheckCircle /> : step}</span> 
                                {step === 1 ? 'Info' : step === 2 ? 'Media' : step === 3 ? 'Instructor' : 'Syllabus'}
                            </button>
                        ))}
                    </div>

                    <div className="sm-step-content-card">
                        {activeStep === 1 && (
                            <div className="sm-step-body animate-slide">
                                <h3><FaInfoCircle /> {isEditing ? "Edit Details" : "General Details"}</h3>
                                <div className="sm-input-row">
                                    <input type="text" placeholder="Course Title *" value={courseData.title} onChange={(e) => setCourseData({...courseData, title: e.target.value})} required />
                                    <input type="text" placeholder="Category *" value={courseData.category} onChange={(e) => setCourseData({...courseData, category: e.target.value})} required />
                                </div>
                                <div className="sm-input-row">
                                    <input type="number" placeholder="Price (PKR) *" value={courseData.price} onChange={(e) => setCourseData({...courseData, price: e.target.value})} required />
                                    <input type="text" placeholder="Duration (e.g., 3 Months)" value={courseData.duration} onChange={(e) => setCourseData({...courseData, duration: e.target.value})} />
                                </div>
                                <div className="sm-input-row">
                                    <select value={courseData.level} onChange={(e) => setCourseData({...courseData, level: e.target.value})}>
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                    <input type="text" placeholder="Badge (e.g. Premium, Bestseller)" value={courseData.badge} onChange={(e) => setCourseData({...courseData, badge: e.target.value})} />
                                </div>
                                <textarea placeholder="Course Description..." value={courseData.description} onChange={(e) => setCourseData({...courseData, description: e.target.value})} rows="4"></textarea>
                            </div>
                        )}

                        {activeStep === 2 && (
                            <div className="sm-step-body animate-slide">
                                <h3><FaCloudUploadAlt /> Media & Assets</h3>
                                <div className="sm-media-upload-section">
                                    <div className="sm-file-upload-box">
                                        <label htmlFor="thumbnail-upload">
                                            <FaRegImage /> {courseData.thumbnail ? `✓ ${courseData.thumbnail.name}` : "Upload Thumbnail"}
                                        </label>
                                        <input id="thumbnail-upload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => handleFileChange(e, 'thumbnail')} style={{ display: 'none' }} />
                                    </div>
                                    <div className="sm-file-upload-box">
                                        <label htmlFor="video-upload">
                                            <FaVideo /> {courseData.videoFile ? `✓ ${courseData.videoFile.name}` : "Upload Intro Video"}
                                        </label>
                                        <input id="video-upload" type="file" accept="video/mp4,video/mpeg,video/quicktime" onChange={(e) => handleFileChange(e, 'videoFile')} style={{ display: 'none' }} />
                                    </div>
                                </div>
                                <input type="text" placeholder="Or Intro Video URL (YouTube/Vimeo)" value={courseData.videoUrl} onChange={(e) => setCourseData({...courseData, videoUrl: e.target.value})} />
                                {uploadProgress.overall > 0 && uploadProgress.overall < 100 && (
                                    <div className="upload-progress">Uploading: {uploadProgress.overall}%</div>
                                )}
                            </div>
                        )}

                        {activeStep === 3 && (
                            <div className="sm-step-body animate-slide">
                                <h3><FaChalkboardTeacher /> Instructor Profile</h3>
                                <div className="sm-media-upload-section">
                                    <div className="sm-file-upload-box">
                                        <label htmlFor="profile-upload">
                                            <FaUserCircle /> {courseData.instructor.profilePic ? `✓ ${courseData.instructor.profilePic.name}` : "Upload Instructor Photo"}
                                        </label>
                                        <input id="profile-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleFileChange(e, 'profilePic')} style={{ display: 'none' }} />
                                    </div>
                                    <div className="sm-file-upload-box">
                                        <label htmlFor="instr-video-upload">
                                            <FaVideo /> {courseData.instructor.introVideoFile ? `✓ ${courseData.instructor.introVideoFile.name}` : "Upload Instructor Intro Video"}
                                        </label>
                                        <input id="instr-video-upload" type="file" accept="video/mp4,video/mpeg" onChange={(e) => handleFileChange(e, 'instructorVideo')} style={{ display: 'none' }} />
                                    </div>
                                </div>
                                <div className="sm-input-row">
                                    <input type="text" placeholder="Instructor Name *" value={courseData.instructor.name} onChange={(e) => setCourseData({...courseData, instructor: {...courseData.instructor, name: e.target.value}})} required />
                                    <input type="number" placeholder="Students Taught" value={courseData.instructor.studentsTaught} onChange={(e) => setCourseData({...courseData, instructor: {...courseData.instructor, studentsTaught: e.target.value}})} />
                                </div>
                                <div className="sm-input-row">
                                    <input type="text" placeholder="Expertise (comma separated e.g., React, Node, MongoDB)" value={courseData.instructor.expertise} onChange={(e) => setCourseData({...courseData, instructor: {...courseData.instructor, expertise: e.target.value}})} />
                                    <input type="text" placeholder="Instructor Intro Video URL" value={courseData.instructor.introVideoUrl} onChange={(e) => setCourseData({...courseData, instructor: {...courseData.instructor, introVideoUrl: e.target.value}})} />
                                </div>
                                <textarea placeholder="Instructor Bio..." value={courseData.instructor.bio} onChange={(e) => setCourseData({...courseData, instructor: {...courseData.instructor, bio: e.target.value}})} rows="3"></textarea>
                            </div>
                        )}

                        {activeStep === 4 && (
                            <div className="sm-step-body animate-slide">
                                <h3><FaListOl /> Course Syllabus</h3>
                                {courseData.syllabus.map((week, wIdx) => (
                                    <div key={wIdx} className="sm-week-module">
                                        <div className="sm-week-header">
                                            <span className="sm-week-tag">Week {week.week}</span>
                                            <input type="text" placeholder="Main Topic" value={week.mainTopic} onChange={(e) => {
                                                let ns = [...courseData.syllabus]; ns[wIdx].mainTopic = e.target.value;
                                                setCourseData({...courseData, syllabus: ns});
                                            }} />
                                            <button className="sm-remove-btn" onClick={() => setCourseData({...courseData, syllabus: courseData.syllabus.filter((_, i) => i !== wIdx)})}><FaTrash /></button>
                                        </div>
                                        <div className="sm-lessons-box">
                                            {week.lessons.map((lesson, lIdx) => (
                                                <div key={lIdx} className="sm-lesson-item">
                                                    <input placeholder={`Lesson ${lIdx + 1}`} value={lesson} onChange={(e) => handleLessonChange(wIdx, lIdx, e.target.value)} />
                                                    <button className="sm-remove-lesson" onClick={() => {
                                                        const newSyllabus = [...courseData.syllabus];
                                                        newSyllabus[wIdx].lessons = newSyllabus[wIdx].lessons.filter((_, i) => i !== lIdx);
                                                        setCourseData({ ...courseData, syllabus: newSyllabus });
                                                    }}><FaTrash /></button>
                                                </div>
                                            ))}
                                            <button className="sm-add-lesson-btn" onClick={() => addLesson(wIdx)}><FaPlus /> Add Lesson</button>
                                        </div>
                                    </div>
                                ))}
                                <button className="sm-add-week-btn" onClick={addWeek}>+ Add Week Module</button>
                            </div>
                        )}

                        <div className="sm-step-footer">
                            {activeStep > 1 && <button className="sm-btn-back" onClick={() => setActiveStep(activeStep - 1)}>Back</button>}
                            {activeStep < 4 ? (
                                <button className="sm-btn-next" onClick={() => setActiveStep(activeStep + 1)}>Save & Next <FaChevronRight /></button>
                            ) : (
                                <button className="sm-btn-publish" onClick={handleFinalSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? "Processing..." : (isEditing ? "Update Course" : "Launch Course")} <FaRocket />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddCourse;