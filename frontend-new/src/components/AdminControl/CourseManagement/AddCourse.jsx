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
    // --- States ---
    const [view, setView] = useState('manage'); 
    const [courses, setCourses] = useState([]);
    const [isEditing, setIsEditing] = useState(null); 
    const [activeStep, setActiveStep] = useState(1);

    const [courseData, setCourseData] = useState({
        title: '', description: '', price: '', duration: '', 
        level: 'Beginner', category: '', badge: 'Premium', 
        thumbnail: null, videoFile: null, videoUrl: '',
        instructor: { 
            name: '', 
            bio: '', 
            expertise: '', 
            studentsTaught: 0, 
            profilePic: null,          
            introVideoFile: null,      
            introVideoUrl: ''          
        }, 
        syllabus: [{ week: 1, mainTopic: '', lessons: [''] }]
    });

    const toastStyle = {
        border: '1px solid #e31e24',
        padding: '16px',
        color: '#1e293b',
        background: '#ffffff',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
    };

    // --- Logic: Fetch All Courses (SkillsMind Sync) ---
    const fetchCourses = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/courses');
            setCourses(res.data);
        } catch (err) {
            console.error("Fetch Error:", err);
            toast.error("SkillsMind: Database connection failed", { style: toastStyle });
        }
    };

    useEffect(() => {
        if (view === 'manage') fetchCourses();
    }, [view]);

    // --- NEW LOGIC: Handle Hide/Unhide ---
    const handleHideUnhide = async (id) => {
        const load = toast.loading("SkillsMind: Updating visibility...", { style: toastStyle });
        try {
            const response = await axios.patch(`http://localhost:5000/api/courses/toggle-hide/${id}`);
            if (response.data.success) {
                toast.success(`SkillsMind: Course ${response.data.isHide ? 'Hidden' : 'Visible'}!`, { id: load, style: toastStyle });
                fetchCourses(); 
            }
        } catch (err) {
            toast.error("SkillsMind: Visibility update failed", { id: load, style: toastStyle });
            console.error("Hide Error:", err);
        }
    };

    // --- Logic: Handle Delete (Custom Notification) ---
    const handleDelete = (id) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>
                    SkillsMind: Are you sure you want to delete this course?
                </span>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button 
                        onClick={() => toast.dismiss(t.id)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const load = toast.loading("SkillsMind: Removing course...", { style: toastStyle });
                            try {
                                await axios.delete(`http://localhost:5000/api/courses/${id}`);
                                toast.success("SkillsMind: Course removed!", { id: load, style: toastStyle });
                                fetchCourses();
                            } catch (err) {
                                toast.error("Delete failed", { id: load, style: toastStyle });
                            }
                        }}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#e31e24',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        ), {
            duration: 6000,
            style: { ...toastStyle, borderLeft: '5px solid #e31e24', minWidth: '350px' },
        });
    };

    // --- Logic: Edit Course ---
    const startEdit = (course) => {
        setIsEditing(course._id);
        setCourseData({
            ...course,
            instructor: { 
                ...course.instructor, 
                expertise: Array.isArray(course.instructor.expertise) ? course.instructor.expertise.join(', ') : course.instructor.expertise 
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
        setActiveStep(1);
    };

    // --- Form Handlers ---
    const handleFileChange = (e, field) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (field === 'thumbnail') setCourseData({ ...courseData, thumbnail: file });
            else if (field === 'profilePic') setCourseData({ ...courseData, instructor: { ...courseData.instructor, profilePic: file } });
            else if (field === 'videoFile') setCourseData({ ...courseData, videoFile: file });
            else if (field === 'instructorVideo') setCourseData({ ...courseData, instructor: { ...courseData.instructor, introVideoFile: file } });
            
            toast.success(`${field} selected!`, { style: toastStyle });
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

    // --- Final Submit (Add/Update Sync) ---
    const handleFinalSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const load = toast.loading("SkillsMind: Saving to Database...", { style: toastStyle });
        
        try {
            const formData = new FormData();
            
            // Append basic fields
            Object.keys(courseData).forEach(key => {
                if (!['instructor', 'syllabus', 'thumbnail', 'videoFile'].includes(key)) {
                    formData.append(key, courseData[key]);
                }
            });

            // Handle Files (Correcting Keys for Backend Multer)
            if (courseData.thumbnail instanceof File) formData.append('thumbnail', courseData.thumbnail);
            if (courseData.videoFile instanceof File) formData.append('courseVideo', courseData.videoFile);
            if (courseData.instructor.profilePic instanceof File) formData.append('profilePic', courseData.instructor.profilePic);
            if (courseData.instructor.introVideoFile instanceof File) formData.append('instructorIntroVideo', courseData.instructor.introVideoFile);

            const instructorObj = {
                ...courseData.instructor,
                expertise: typeof courseData.instructor.expertise === 'string' 
                    ? courseData.instructor.expertise.split(',').map(i => i.trim()) 
                    : courseData.instructor.expertise
            };
            
            formData.append('instructor', JSON.stringify(instructorObj));
            formData.append('syllabus', JSON.stringify(courseData.syllabus));

            if (isEditing) {
                await axios.put(`http://localhost:5000/api/courses/${isEditing}`, formData);
                toast.success("SkillsMind: Course Updated!", { id: load, style: toastStyle });
            } else {
                await axios.post('http://localhost:5000/api/courses/add', formData);
                toast.success("SkillsMind: Course Launched!", { id: load, style: toastStyle });
            }

            setView('manage');
            resetForm();
        } catch (err) {
            toast.error("Operation failed", { id: load, style: toastStyle });
            console.error(err);
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
                            <tr>
                                <th>Thumbnail</th>
                                <th>Course Title</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.length > 0 ? courses.map(course => (
                                <tr key={course._id} style={course.isHide ? { opacity: 0.6, background: '#f1f5f9' } : {}}>
                                    <td><img src={`http://localhost:5000${course.thumbnail}`} alt="thumb" className="sm-row-img" /></td>
                                    <td><strong>{course.title}</strong> {course.isHide && <span style={{fontSize:'10px', color:'#e31e24', marginLeft:'5px'}}>(HIDDEN)</span>}</td>
                                    <td>{course.category}</td>
                                    <td>PKR {course.price}</td>
                                    <td className="sm-actions">
                                        <button onClick={() => startEdit(course)} title="Edit"><FaEdit /></button>
                                        
                                        <button 
                                            onClick={() => handleHideUnhide(course._id)} 
                                            title={course.isHide ? "Show Course" : "Hide Course"}
                                            style={{ color: course.isHide ? '#94a3b8' : '#e31e24' }}
                                        >
                                            {course.isHide ? <FaEyeSlash /> : <FaEye />}
                                        </button>

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
                                    <input type="text" placeholder="Course Title" value={courseData.title} onChange={(e) => setCourseData({...courseData, title: e.target.value})} />
                                    <input type="text" placeholder="Category" value={courseData.category} onChange={(e) => setCourseData({...courseData, category: e.target.value})} />
                                </div>
                                <div className="sm-input-row">
                                    <input type="number" placeholder="Price (PKR)" value={courseData.price} onChange={(e) => setCourseData({...courseData, price: e.target.value})} />
                                    <input type="text" placeholder="Duration" value={courseData.duration} onChange={(e) => setCourseData({...courseData, duration: e.target.value})} />
                                </div>
                                <div className="sm-input-row">
                                    <select value={courseData.level} onChange={(e) => setCourseData({...courseData, level: e.target.value})}>
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                    <input type="text" placeholder="Badge (e.g. Bestseller)" value={courseData.badge} onChange={(e) => setCourseData({...courseData, badge: e.target.value})} />
                                </div>
                                <textarea placeholder="Course Description..." value={courseData.description} onChange={(e) => setCourseData({...courseData, description: e.target.value})}></textarea>
                            </div>
                        )}

                        {activeStep === 2 && (
                            <div className="sm-step-body animate-slide">
                                <h3><FaCloudUploadAlt /> Media & Assets</h3>
                                <div className="sm-media-upload-section">
                                    <div className="sm-file-upload-box">
                                        <label htmlFor="thumbnail-upload">
                                            <FaRegImage /> {courseData.thumbnail ? "Thumbnail Selected" : "Upload Thumbnail"}
                                        </label>
                                        <input id="thumbnail-upload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'thumbnail')} style={{ display: 'none' }} />
                                    </div>
                                    <div className="sm-file-upload-box">
                                        <label htmlFor="video-upload">
                                            <FaVideo /> {courseData.videoFile ? "Video Selected" : "Upload Video Intro"}
                                        </label>
                                        <input id="video-upload" type="file" accept="video/*" onChange={(e) => handleFileChange(e, 'videoFile')} style={{ display: 'none' }} />
                                    </div>
                                </div>
                                <input type="text" placeholder="Or Intro Video URL (YouTube/Vimeo)" value={courseData.videoUrl} onChange={(e) => setCourseData({...courseData, videoUrl: e.target.value})} />
                            </div>
                        )}

                        {activeStep === 3 && (
                            <div className="sm-step-body animate-slide">
                                <h3><FaChalkboardTeacher /> Instructor Profile</h3>
                                <div className="sm-media-upload-section">
                                    <div className="sm-file-upload-box">
                                        <label htmlFor="profile-upload">
                                            <FaUserCircle /> {courseData.instructor.profilePic ? "Photo Selected" : "Upload Instructor Photo"}
                                        </label>
                                        <input id="profile-upload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePic')} style={{ display: 'none' }} />
                                    </div>
                                    <div className="sm-file-upload-box">
                                        <label htmlFor="instr-video-upload">
                                            <FaVideo /> {courseData.instructor.introVideoFile ? "Intro Video Selected" : "Upload Instructor Intro"}
                                        </label>
                                        <input id="instr-video-upload" type="file" accept="video/*" onChange={(e) => handleFileChange(e, 'instructorVideo')} style={{ display: 'none' }} />
                                    </div>
                                </div>

                                <div className="sm-input-row">
                                    <input type="text" placeholder="Instructor Name" value={courseData.instructor.name} onChange={(e) => setCourseData({...courseData, instructor: {...courseData.instructor, name: e.target.value}})} />
                                    <input type="number" placeholder="Students Taught" value={courseData.instructor.studentsTaught} onChange={(e) => setCourseData({...courseData, instructor: {...courseData.instructor, studentsTaught: e.target.value}})} />
                                </div>
                                <div className="sm-input-row">
                                    <input type="text" placeholder="Expertise (comma separated)" value={courseData.instructor.expertise} onChange={(e) => setCourseData({...courseData, instructor: {...courseData.instructor, expertise: e.target.value}})} />
                                    <input type="text" placeholder="Instructor Intro Video URL (Link)" value={courseData.instructor.introVideoUrl} onChange={(e) => setCourseData({...courseData, instructor: {...courseData.instructor, introVideoUrl: e.target.value}})} />
                                </div>
                                <textarea placeholder="Instructor Bio..." value={courseData.instructor.bio} onChange={(e) => setCourseData({...courseData, instructor: {...courseData.instructor, bio: e.target.value}})}></textarea>
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
                                            <button className="sm-remove-btn" onClick={() => setCourseData({...courseData, syllabus: courseData.syllabus.filter((_, i) => i !== wIdx)}) }><FaTrash /></button>
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
                                <button className="sm-btn-publish" onClick={handleFinalSubmit}>
                                    {isEditing ? "Update Course" : "Launch Course"} <FaRocket />
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