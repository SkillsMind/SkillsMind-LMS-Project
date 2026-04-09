import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaTrash, FaUserGraduate, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaBookOpen, FaFilePdf, FaFileExcel, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './RegistrationData.css';

const RegistrationData = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔵 RegistrationData component mounted');
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    console.log('🟡 fetchRegistrations called');
    setLoading(true);
    setError(null);
    
    const apiUrl = `${import.meta.env.VITE_API_URL}/api/enroll/all`;
    console.log('📡 API URL:', apiUrl);
    console.log('📡 VITE_API_URL:', import.meta.env.VITE_API_URL);
    
    try {
      console.log('🟢 Sending fetch request...');
      const response = await fetch(apiUrl);
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response status text:', response.statusText);
      console.log('📥 Response ok?', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Data received from backend:', data);
      console.log('📊 Data type:', Array.isArray(data) ? 'Array' : typeof data);
      console.log('📊 Data length:', Array.isArray(data) ? data.length : 'N/A');
      
      if (Array.isArray(data)) {
        console.log('✅ Setting registrations with', data.length, 'records');
        setRegistrations(data);
        if (data.length === 0) {
          console.log('⚠️ No enrollment records found in database');
          toast('No enrollment records found', { icon: 'ℹ️' });
        } else {
          console.log('🎉 Successfully loaded', data.length, 'enrollments');
        }
      } else {
        console.error('❌ Data is not an array:', data);
        setError('Invalid data format received from server');
        setRegistrations([]);
        toast.error('Invalid data format from server');
      }
      
    } catch (error) {
      console.error('❌ Fetch Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(error.message);
      toast.error(`SkillsMind: Server Connection Error! ${error.message}`);
      setRegistrations([]);
    } finally {
      setLoading(false);
      console.log('🔵 fetchRegistrations completed, loading:', false);
    }
  };

  const handleDeleteClick = (id) => {
    console.log('🗑️ Delete clicked for ID:', id);
    setSelectedId(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    console.log('🗑️ Confirm delete for ID:', selectedId);
    if (!selectedId) return;
    
    const deleteUrl = `${import.meta.env.VITE_API_URL}/api/enroll/delete/${selectedId}`;
    console.log('📡 DELETE URL:', deleteUrl);
    
    try {
      const res = await fetch(deleteUrl, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('📥 DELETE response status:', res.status);
      
      if (res.ok) {
        console.log('✅ Delete successful');
        toast.success("SkillsMind: Record Deleted Successfully!");
        setShowModal(false);
        fetchRegistrations(); // Refresh list
      } else {
        console.error('❌ Delete failed with status:', res.status);
        toast.error("Delete failed!");
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      toast.error("SkillsMind: Connection Error!");
    }
  };

  // --- EXCEL EXPORT ---
  const downloadExcel = () => {
    console.log('📊 downloadExcel called, registrations count:', registrations.length);
    if (registrations.length === 0) return toast.error("No data available!");
    
    const fullData = registrations.map((reg, i) => ({
      "Sr No": i + 1,
      "Full Name": reg.fullName,
      "Email Address": reg.email,
      "Phone Number": reg.phone,
      "Course": reg.course,
      "City": reg.city,
      "Full Address": reg.address,
      "Date of Birth": reg.dob,
      "Gender": reg.gender,
      "Reg Date": new Date(reg.createdAt).toLocaleDateString(),
      "Reg Time": new Date(reg.createdAt).toLocaleTimeString()
    }));

    const ws = XLSX.utils.json_to_sheet(fullData);
    const wscols = [
      { wch: 8 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 20 },
      { wch: 15 }, { wch: 45 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SkillsMind_Students");
    XLSX.writeFile(wb, "SkillsMind_Full_Report.xlsx");
    toast.success("Excel Exported!");
    console.log('✅ Excel export completed');
  };

  // --- PDF EXPORT ---
  const downloadPDF = () => {
    console.log('📄 downloadPDF called, registrations count:', registrations.length);
    if (registrations.length === 0) return toast.error("No data!");
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      
      doc.setFontSize(18);
      doc.setTextColor(227, 30, 36);
      doc.text("SkillsMind - Complete Student Enrollment Report", 14, 15);
      
      const headers = [["#", "Name", "Course", "Contact Info", "DOB/Gender", "City & Address", "Reg. Date/Time"]];
      
      const data = registrations.map((r, i) => [
        i + 1,
        r.fullName,
        r.course,
        `${r.email}\n${r.phone}`, 
        `${r.dob}\n(${r.gender})`, 
        `${r.city?.toUpperCase() || ''}\n${r.address || ''}`, 
        `${new Date(r.createdAt).toLocaleDateString()}\n${new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      ]);

      autoTable(doc, {
        head: headers,
        body: data,
        startY: 22,
        theme: 'grid',
        headStyles: { fillColor: [227, 30, 36], textColor: [255, 255, 255], fontSize: 10, halign: 'center' },
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 45 },
          4: { cellWidth: 30 },
          5: { cellWidth: 80 },
          6: { cellWidth: 35 }
        },
        margin: { top: 20 }
      });
      
      doc.save("SkillsMind_Detailed_Report.pdf");
      toast.success("Detailed PDF Downloaded!");
      console.log('✅ PDF export completed');
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("PDF Export Failed!");
    }
  };

  // Debug render
  console.log('🎨 Rendering RegistrationData component, state:', {
    loading,
    registrationsCount: registrations.length,
    error,
    showModal
  });

  return (
    <div className="registration-container">
      {showModal && (
        <div className="sm-modal-overlay">
          <div className="sm-modal-box">
            <div className="sm-modal-icon"><FaExclamationTriangle size={50} color="#e31e24" /></div>
            <h3>Are you sure?</h3>
            <p>SkillsMind: This record will be permanently deleted!</p>
            <div className="sm-modal-btns">
              <button className="btn-cancel-del" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-confirm-del" onClick={confirmDelete}>Yes, Delete it</button>
            </div>
          </div>
        </div>
      )}

      <div className="sm-content-header">
        <div className="title-area">
          <h2><FaUserGraduate color="#e31e24" /> Student Records ({registrations.length})</h2>
          <p>Managing SkillsMind live enrollments</p>
        </div>
        <div className="action-tools">
          <button onClick={fetchRegistrations} className="btn-tool refresh"><FaSync /> Refresh</button>
          <button onClick={downloadPDF} className="btn-tool pdf"><FaFilePdf /> Export PDF</button>
          <button onClick={downloadExcel} className="btn-tool excel"><FaFileExcel /> Export Excel</button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message" style={{ background: '#fee2e2', color: '#e30613', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="sm-data-card">
        <table className="sm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student & Course</th>
              <th>Contact Details</th>
              <th>Personal Info</th>
              <th>Address & City</th>
              <th>Reg. Date</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '50px' }}>
                <div className="spinner"></div>
                SkillsMind: Loading...
              </td></tr>
            ) : registrations.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '50px' }}>
                <FaExclamationTriangle size={30} color="#e30613" />
                <p>No enrollment records found.</p>
                <button onClick={fetchRegistrations} className="btn-tool refresh" style={{ marginTop: '10px' }}>
                  <FaSync /> Refresh
                </button>
              </td></tr>
            ) : (
              registrations.map((reg, index) => (
                <tr key={reg._id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="info-cell">
                      <strong>{reg.fullName}</strong>
                      <span className="badge-course"><FaBookOpen size={10}/> {reg.course}</span>
                    </div>
                  </td>
                  <td>
                    <div className="info-cell">
                      <span><FaEnvelope size={10} color="#e31e24" /> {reg.email}</span>
                      <span style={{ color: '#888' }}><FaPhone size={10} /> {reg.phone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="info-cell">
                      <span>DOB: {reg.dob}</span>
                      <span style={{ textTransform: 'capitalize' }}>{reg.gender}</span>
                    </div>
                  </td>
                  <td>
                    <div className="info-cell">
                      <strong><FaMapMarkerAlt size={10} /> {reg.city}</strong>
                      <small>{reg.address?.substring(0, 30)}...</small>
                    </div>
                  </td>
                  <td>
                    <div className="info-cell">
                      <strong>{new Date(reg.createdAt).toLocaleDateString()}</strong>
                      <span>{new Date(reg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-delete-sm" onClick={() => handleDeleteClick(reg._id)}><FaTrash /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegistrationData;