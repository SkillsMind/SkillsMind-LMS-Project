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

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/enroll/all'); 
      const data = await response.json();
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("SkillsMind: Server Connection Error!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/enroll/delete/${selectedId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        toast.success("SkillsMind: Record Deleted Successfully!");
        setShowModal(false);
        fetchRegistrations();
      } else {
        toast.error("Delete failed!");
      }
    } catch (error) {
      toast.error("SkillsMind: Connection Error!");
    }
  };

  // --- IMPROVED EXCEL EXPORT (Better Formatting) ---
  const downloadExcel = () => {
    if (registrations.length === 0) return toast.error("No data available!");
    
    // Mapping data for Excel
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

    // --- Excel Style Improvement: Setting Column Widths ---
    const wscols = [
      { wch: 8 },  // Sr No
      { wch: 25 }, // Full Name
      { wch: 30 }, // Email Address
      { wch: 15 }, // Phone Number
      { wch: 20 }, // Course
      { wch: 15 }, // City
      { wch: 45 }, // Full Address (Longer for better visibility)
      { wch: 12 }, // Date of Birth
      { wch: 10 }, // Gender
      { wch: 15 }, // Reg Date
      { wch: 15 }  // Reg Time
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SkillsMind_Students");
    XLSX.writeFile(wb, "SkillsMind_Full_Report.xlsx");
    toast.success("Excel Exported with decent styling!");
  };

  // --- UPDATED PDF EXPORT (All Details Included) ---
  const downloadPDF = () => {
    if (registrations.length === 0) return toast.error("No data!");
    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape mode
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(227, 30, 36);
      doc.text("SkillsMind - Complete Student Enrollment Report", 14, 15);
      
      // Headers
      const headers = [["#", "Name", "Course", "Contact Info", "DOB/Gender", "City & Address", "Reg. Date/Time"]];
      
      // Data Mapping
      const data = registrations.map((r, i) => [
        i + 1,
        r.fullName,
        r.course,
        `${r.email}\n${r.phone}`, 
        `${r.dob}\n(${r.gender})`, 
        `${r.city.toUpperCase()}\n${r.address}`, 
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
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("PDF Export Failed!");
    }
  };

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
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '50px' }}>SkillsMind: Loading...</td></tr>
            ) : registrations.map((reg, index) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegistrationData;