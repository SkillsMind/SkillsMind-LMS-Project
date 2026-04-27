import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FaCalendarAlt, FaSave, FaUsers, FaFileExcel, FaFilePdf, FaTrash, 
  FaToggleOn, FaToggleOff, FaPlus, FaClock, FaInfoCircle, 
  FaLink, FaSearch, FaBook, FaChevronDown, FaChevronUp,
  FaDownload, FaUserTie, FaCertificate, FaVideo, FaEdit,
  FaEye, FaEyeSlash, FaList, FaImage, FaUpload
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import './WebinarManager.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const WebinarManager = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [webinarToDelete, setWebinarToDelete] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [regSearchTerm, setRegSearchTerm] = useState('');

  const [settings, setSettings] = useState({
    isActive: false,
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    time: '7:00 PM - 9:00 PM',
    topics: ['Day 1: Introduction', 'Day 2: Advanced Concepts', 'Day 3: Q&A Session'],
    meetingLink: '',
    instructor: 'SkillsMind Expert Team',
    certificateProvided: true,
    recordingAvailable: true,
    image: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCourses();
    fetchWebinars();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/courses`);
      const data = await response.json();
      let coursesList = [];
      if (Array.isArray(data)) coursesList = data;
      else if (data.courses) coursesList = data.courses;
      else if (data.data) coursesList = data.data;
      setCourses(coursesList);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load courses');
    }
  };

  const fetchWebinars = async () => {
    try {
      const response = await fetch(`${API_URL}/api/webinar/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWebinars(data.webinars || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle image upload via Cloudinary
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }
    
    setUploadingImage(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        // Upload to Cloudinary via your backend
        const response = await fetch(`${API_URL}/api/upload/cloudinary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ image: reader.result })
        });
        
        const data = await response.json();
        if (data.success) {
          setSettings({ ...settings, image: data.url });
          toast.success('Image uploaded successfully!');
        } else {
          toast.error(data.message || 'Upload failed');
        }
        setUploadingImage(false);
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      setUploadingImage(false);
    }
  };
  
  // Remove image
  const removeImage = () => {
    setSettings({ ...settings, image: '' });
    toast.success('Image removed');
  };

  const viewRegistrations = async (webinar) => {
    setSelectedWebinar(webinar);
    let regs = webinar.registrations || [];
    
    if (regs.length > 0) {
      setRegistrations(regs);
      setActiveTab('registrations');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/webinar/registrations/${webinar._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.registrations) {
        setRegistrations(data.registrations);
      } else {
        setRegistrations([]);
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setRegistrations([]);
    }
    
    setActiveTab('registrations');
  };

  const loadWebinarForEdit = async (webinar) => {
    setSelectedCourse(courses.find(c => c._id === webinar.courseId));
    setSelectedWebinar(webinar);
    setSettings({
      isActive: webinar.isActive || false,
      title: webinar.title || '',
      description: webinar.description || '',
      startDate: webinar.startDate ? webinar.startDate.split('T')[0] : '',
      endDate: webinar.endDate ? webinar.endDate.split('T')[0] : '',
      time: webinar.time || '7:00 PM - 9:00 PM',
      topics: webinar.topics || ['Day 1: Introduction', 'Day 2: Advanced Concepts', 'Day 3: Q&A Session'],
      meetingLink: webinar.meetingLink || '',
      instructor: webinar.instructor || 'SkillsMind Expert Team',
      certificateProvided: webinar.certificateProvided !== false,
      recordingAvailable: webinar.recordingAvailable !== false,
      image: webinar.image || ''
    });
    setActiveTab('edit');
  };

  const createNewWebinar = () => {
    setSelectedCourse(null);
    setSelectedWebinar(null);
    setSettings({
      isActive: false,
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      time: '7:00 PM - 9:00 PM',
      topics: ['Day 1: Introduction', 'Day 2: Advanced Concepts', 'Day 3: Q&A Session'],
      meetingLink: '',
      instructor: 'SkillsMind Expert Team',
      certificateProvided: true,
      recordingAvailable: true,
      image: ''
    });
    setActiveTab('create');
  };

  const saveSettings = async () => {
    if (!selectedCourse) {
      toast.error('Please select a course first');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/webinar/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: selectedCourse._id,
          courseName: selectedCourse.title,
          ...settings
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(selectedWebinar ? 'Webinar updated!' : 'Webinar created!');
        fetchWebinars();
        setActiveTab('list');
      } else {
        toast.error(data.message || 'Failed to save');
      }
    } catch (error) {
      toast.error('Server error');
    } finally {
      setSaving(false);
    }
  };

  const toggleWebinarStatus = async (webinarId, currentStatus) => {
    try {
      const webinar = webinars.find(w => w._id === webinarId);
      if (!webinar) return;
      
      const response = await fetch(`${API_URL}/api/webinar/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: webinar.courseId,
          courseName: webinar.courseName,
          isActive: !currentStatus,
          title: webinar.title,
          description: webinar.description,
          startDate: webinar.startDate,
          endDate: webinar.endDate,
          time: webinar.time,
          topics: webinar.topics,
          meetingLink: webinar.meetingLink,
          instructor: webinar.instructor,
          certificateProvided: webinar.certificateProvided,
          recordingAvailable: webinar.recordingAvailable,
          image: webinar.image || ''
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Webinar ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchWebinars();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteWebinar = async () => {
    if (!webinarToDelete) return;
    
    try {
      const response = await fetch(`${API_URL}/api/webinar/delete/${webinarToDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Webinar deleted successfully');
        fetchWebinars();
        setShowDeleteModal(false);
        setWebinarToDelete(null);
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  const deleteRegistration = async (registrationId) => {
    if (window.confirm('Are you sure you want to delete this registration?')) {
      try {
        const response = await fetch(`${API_URL}/api/webinar/registration/${registrationId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          toast.success('Registration deleted successfully');
          const updatedRegistrations = registrations.filter(r => r._id !== registrationId);
          setRegistrations(updatedRegistrations);
          if (selectedWebinar) {
            setSelectedWebinar({ ...selectedWebinar, registrations: updatedRegistrations });
          }
        } else {
          toast.error(data.message || 'Failed to delete');
        }
      } catch (error) {
        toast.error('Server error');
      }
    }
  };

  const exportToExcel = () => {
    if (registrations.length === 0) {
      toast.error('No registrations to export');
      return;
    }
    const exportData = registrations.map((reg, idx) => ({
      'S.No': idx + 1,
      'Full Name': reg.fullName,
      'Email': reg.email,
      'Phone': reg.phone,
      'City': reg.city || '',
      'Age': reg.age || '-',
      'Gender': reg.gender || '-',
      'Date of Birth': reg.dateOfBirth ? new Date(reg.dateOfBirth).toLocaleDateString() : '-',
      'Qualification': reg.qualification || '-',
      'Profession': reg.profession || '-',
      'Registered Date': new Date(reg.registeredAt).toLocaleString(),
      'IP Address': reg.ipAddress || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Webinar Registrations');
    XLSX.writeFile(workbook, `webinar-${selectedWebinar?.courseName}-registrations.xlsx`);
    toast.success('Excel file downloaded!');
  };

  const exportToPDF = async () => {
    if (registrations.length === 0) {
      toast.error('No registrations to export');
      return;
    }
    
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(18);
      doc.setTextColor(220, 38, 38);
      doc.text('SkillsMind Webinar Registrations', 14, 20);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Webinar: ${selectedWebinar?.title}`, 14, 32);
      doc.text(`Course: ${selectedWebinar?.courseName}`, 14, 40);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 48);
      doc.text(`Total Registrations: ${registrations.length}`, 14, 56);
      
      const tableData = registrations.map((reg, idx) => [
        idx + 1,
        reg.fullName,
        reg.email,
        reg.phone,
        reg.city || '-',
        reg.age || '-',
        reg.gender || '-',
        reg.qualification || '-',
        reg.profession || '-',
        new Date(reg.registeredAt).toLocaleDateString()
      ]);
      
      autoTable(doc, {
        startY: 65,
        head: [['#', 'Name', 'Email', 'Phone', 'City', 'Age', 'Gender', 'Qualification', 'Profession', 'Date']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38] },
        styles: { fontSize: 8 }
      });
      
      doc.save(`webinar-${selectedWebinar?.courseName}-registrations.pdf`);
      toast.success('PDF file downloaded!');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({ ...settings, [name]: type === 'checkbox' ? checked : value });
  };

  const handleTopicChange = (index, value) => {
    const newTopics = [...settings.topics];
    newTopics[index] = value;
    setSettings({ ...settings, topics: newTopics });
  };

  const addTopic = () => {
    setSettings({
      ...settings,
      topics: [...settings.topics, `Day ${settings.topics.length + 1}: New Topic`]
    });
  };

  const removeTopic = (index) => {
    const newTopics = settings.topics.filter((_, i) => i !== index);
    setSettings({ ...settings, topics: newTopics });
  };

  const filteredWebinars = webinars.filter(webinar =>
    webinar.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    webinar.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRegistrations = registrations.filter(reg =>
    reg.fullName?.toLowerCase().includes(regSearchTerm.toLowerCase()) ||
    reg.email?.toLowerCase().includes(regSearchTerm.toLowerCase()) ||
    reg.phone?.includes(regSearchTerm)
  );

  if (loading && courses.length === 0) {
    return <div className="webinar-loader">Loading...</div>;
  }

  return (
    <div className="webinar-container">
      <div className="webinar-header">
        <div className="header-left">
          <FaCalendarAlt className="header-icon" />
          <h1>Webinar Management</h1>
        </div>
        <button className="create-new-btn" onClick={createNewWebinar}>
          <FaPlus /> Create New Webinar
        </button>
      </div>

      <div className="webinar-tabs">
        <button className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
          <FaList /> All Webinars ({webinars.length})
        </button>
        {(activeTab === 'create' || activeTab === 'edit') && (
          <button className="tab active">
            {activeTab === 'create' ? <FaPlus /> : <FaEdit />}
            {activeTab === 'create' ? 'Create Webinar' : 'Edit Webinar'}
          </button>
        )}
        {activeTab === 'registrations' && selectedWebinar && (
          <button className="tab active">
            <FaUsers /> Registrations ({registrations.length})
          </button>
        )}
      </div>

      {/* LIST VIEW */}
      {activeTab === 'list' && (
        <div className="webinars-list-container">
          <div className="search-bar">
            <FaSearch />
            <input type="text" placeholder="Search by course or title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          {filteredWebinars.length === 0 ? (
            <div className="empty-state"><FaCalendarAlt size={56} /><h4>No Webinars Yet</h4><p>Click "Create New Webinar" to get started</p></div>
          ) : (
            <div className="webinars-table-wrapper">
              <table className="webinars-table">
                <thead>
                  <tr><th>Image</th><th>Course</th><th>Title</th><th>Date & Time</th><th>Registrations</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredWebinars.map(webinar => (
                    <tr key={webinar._id}>
                      <td>
                        {webinar.image ? (
                          <img src={webinar.image} alt={webinar.title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaImage color="#94a3b8" /></div>
                        )}
                      </td>
                      <td><strong>{webinar.courseName}</strong></td>
                      <td>{webinar.title}</td>
                      <td>{webinar.startDate ? new Date(webinar.startDate).toLocaleDateString() : 'TBA'}<br /><small>{webinar.time}</small></td>
                      <td><button className="view-reg-btn" onClick={() => viewRegistrations(webinar)}><FaUsers /> {webinar.registrations?.length || 0} Registrations</button></td>
                      <td><button className={`status-badge ${webinar.isActive ? 'active' : 'inactive'}`} onClick={() => toggleWebinarStatus(webinar._id, webinar.isActive)}>{webinar.isActive ? <FaEye /> : <FaEyeSlash />}{webinar.isActive ? 'Active' : 'Inactive'}</button></td>
                      <td><div className="action-buttons"><button className="edit-btn" onClick={() => loadWebinarForEdit(webinar)}><FaEdit /> Edit</button><button className="delete-btn" onClick={() => { setWebinarToDelete(webinar); setShowDeleteModal(true); }}><FaTrash /> Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE/EDIT FORM */}
      {(activeTab === 'create' || activeTab === 'edit') && (
        <div className="form-container">
          <div className="card"><h3>Select Course</h3><div className="course-select-wrapper"><select value={selectedCourse?._id || ''} onChange={(e) => { const course = courses.find(c => c._id === e.target.value); setSelectedCourse(course); }} className="course-select"><option value="">-- Select a course --</option>{courses.map(course => (<option key={course._id} value={course._id}>{course.title}</option>))}</select></div></div>
          {selectedCourse && (
            <>
              <div className="card status-card"><div className="status-left"><h3>Webinar Status</h3><p>Turn ON to display on student page</p></div><button className={`status-toggle ${settings.isActive ? 'active' : 'inactive'}`} onClick={() => setSettings({ ...settings, isActive: !settings.isActive })}>{settings.isActive ? <FaToggleOn size={40} /> : <FaToggleOff size={40} />}<span>{settings.isActive ? 'Active' : 'Inactive'}</span></button></div>
              
              {/* ✅ NEW: Image Upload Section */}
              <div className="card">
                <h3><FaImage /> Webinar Image/Thumbnail</h3>
                <div className="form-group">
                  <label>Upload Image (Optional - Will show on student page)</label>
                  <div className="image-upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      id="webinar-image-upload"
                    />
                    <label htmlFor="webinar-image-upload" className="upload-btn">
                      <FaUpload /> {uploadingImage ? 'Uploading...' : 'Choose Image'}
                    </label>
                    {settings.image && (
                      <button type="button" className="remove-image-btn" onClick={removeImage}>
                        <FaTrash /> Remove
                      </button>
                    )}
                  </div>
                  {uploadingImage && <p className="upload-status">Uploading to Cloudinary...</p>}
                  {settings.image && (
                    <div className="image-preview">
                      <img src={settings.image} alt="Webinar thumbnail" />
                      <p className="image-url">URL: {settings.image.substring(0, 60)}...</p>
                    </div>
                  )}
                  <p className="help-text">Recommended size: 400x250px. Max 2MB. JPG, PNG, or GIF.</p>
                </div>
              </div>
              
              <div className="card"><h3><FaInfoCircle /> Basic Information</h3><div className="form-group"><label>Webinar Title</label><input type="text" name="title" value={settings.title} onChange={handleSettingChange} /></div><div className="form-group"><label>Description</label><textarea name="description" value={settings.description} onChange={handleSettingChange} rows="3" /></div><div className="form-group"><label><FaUserTie /> Instructor</label><input type="text" name="instructor" value={settings.instructor} onChange={handleSettingChange} /></div></div>
              <div className="card"><h3><FaClock /> Schedule</h3><div className="row-3"><div className="form-group"><label>Start Date</label><input type="date" name="startDate" value={settings.startDate} onChange={handleSettingChange} /></div><div className="form-group"><label>End Date</label><input type="date" name="endDate" value={settings.endDate} onChange={handleSettingChange} /></div><div className="form-group"><label>Time</label><input type="text" name="time" value={settings.time} onChange={handleSettingChange} /></div></div></div>
              <div className="card"><h3>Topics</h3>{settings.topics.map((topic, idx) => (<div key={idx} className="topic-row"><input type="text" value={topic} onChange={(e) => handleTopicChange(idx, e.target.value)} /><button className="remove" onClick={() => removeTopic(idx)}><FaTrash /></button></div>))}<button className="add-topic" onClick={addTopic}><FaPlus /> Add Topic</button></div>
              <div className="card"><h3><FaLink /> Meeting Link</h3><input type="text" name="meetingLink" value={settings.meetingLink} onChange={handleSettingChange} placeholder="Zoom/Google Meet link" /></div>
              <div className="card"><h3>Features</h3><label className="checkbox"><input type="checkbox" name="certificateProvided" checked={settings.certificateProvided} onChange={handleSettingChange} /><span><FaCertificate /> Provide Certificate</span></label><label className="checkbox"><input type="checkbox" name="recordingAvailable" checked={settings.recordingAvailable} onChange={handleSettingChange} /><span><FaVideo /> Provide Recording</span></label></div>
              <button className="save-btn" onClick={saveSettings} disabled={saving}>{saving ? 'Saving...' : <><FaSave /> {activeTab === 'create' ? 'Create Webinar' : 'Update Webinar'}</>}</button>
            </>
          )}
        </div>
      )}

      {/* REGISTRATIONS VIEW */}
      {activeTab === 'registrations' && selectedWebinar && (
        <div className="registrations-view-container">
          <div className="registrations-header">
            <div className="registrations-title">
              <button className="back-to-list" onClick={() => setActiveTab('list')}>← Back to Webinars</button>
              <h3><FaUsers /> Registrations for "{selectedWebinar.title}"</h3>
            </div>
            <div className="registrations-actions">
              <button className="export-excel-btn" onClick={exportToExcel}><FaFileExcel /> Export Excel</button>
              <button className="export-pdf-btn" onClick={exportToPDF}><FaFilePdf /> Export PDF</button>
            </div>
          </div>

          <div className="registrations-toolbar">
            <div className="search-wrapper"><FaSearch /><input type="text" placeholder="Search by name, email or phone..." value={regSearchTerm} onChange={(e) => setRegSearchTerm(e.target.value)} /></div>
            <div className="stats-info">Total: <strong>{filteredRegistrations.length}</strong> registrations</div>
          </div>

          {filteredRegistrations.length === 0 ? (
            <div className="empty-state"><FaUsers size={56} /><h4>No Registrations Yet</h4><p>No students have registered for this webinar yet.</p><p className="small-text">Share the webinar link with students to collect registrations.</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="registrations-table">
                <thead>
                  <tr><th>#</th><th>Full Name</th><th>Email</th><th>Phone</th><th>City</th><th>Age</th><th>Gender</th><th>Qualification</th><th>Profession</th><th>Registered On</th><th>IP Address</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((reg, idx) => (
                    <tr key={reg._id}>
                      <td>{idx + 1}</td>
                      <td><strong>{reg.fullName}</strong></td>
                      <td>{reg.email}</td>
                      <td>{reg.phone}</td>
                      <td>{reg.city || '-'}</td>
                      <td>{reg.age || '-'}</td>
                      <td>{reg.gender || '-'}</td>
                      <td>{reg.qualification || '-'}</td>
                      <td>{reg.profession || '-'}</td>
                      <td>{new Date(reg.registeredAt).toLocaleString()}</td>
                      <td>{reg.ipAddress || '-'}</td>
                      <td><button className="delete-reg-btn" onClick={() => deleteRegistration(reg._id)}><FaTrash /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Webinar</h3>
            <p>Are you sure you want to delete "<strong>{webinarToDelete?.title}</strong>"?</p>
            <p className="warning-text">This will also delete all registrations.</p>
            <div className="modal-buttons"><button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button><button className="confirm-btn" onClick={deleteWebinar}>Delete</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebinarManager;