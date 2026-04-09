import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
    FaCheck, FaTimes, FaEye, FaIdCard, FaSync, FaShieldAlt, 
    FaTrashAlt, FaTimesCircle, FaFileExcel, FaFilePdf, FaCommentAlt
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './PaymentApprovals.css';

const PaymentApprovals = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/payments/all-payments`);
            setPayments(res.data);
        } catch (err) {
            Swal.fire({ 
                icon: 'error', 
                title: 'Connection Failed', 
                text: 'Unable to connect to SkillsMind servers. Please check your backend connection.',
                confirmButtonColor: '#e31e24'
            });
        } finally {
            setLoading(false);
        }
    };

    // 🔥 UPDATED: Handle rejection with reason
    const handleAction = async (e, id, status) => {
        if(e) { e.preventDefault(); e.stopPropagation(); }
        
        // If rejecting, ask for reason first
        if (status === 'rejected') {
            const { value: reason } = await Swal.fire({
                title: 'Reject Payment',
                input: 'textarea',
                inputLabel: 'Rejection Reason',
                inputPlaceholder: 'Enter reason for rejection (e.g., Invalid screenshot, Incorrect amount, etc.)',
                inputAttributes: {
                    'aria-label': 'Type rejection reason here'
                },
                showCancelButton: true,
                confirmButtonColor: '#e31e24',
                confirmButtonText: 'Reject Payment',
                cancelButtonText: 'Cancel',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Please provide a reason for rejection!';
                    }
                }
            });

            if (!reason) return; // Cancelled
            return updateStatus(id, status, reason);
        }
        
        // For approve or pending, proceed directly
        updateStatus(id, status);
    };

    const updateStatus = async (id, status, reason = null) => {
        const statusColors = { approved: '#10b981', rejected: '#e31e24', pending: '#3b82f6' };
        const statusTexts = { approved: 'APPROVE', rejected: 'REJECT', pending: 'RESET' };
        
        const result = await Swal.fire({
            title: `Confirm ${statusTexts[status.toUpperCase()]}`,
            text: `Are you sure you want to ${status} this payment?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: statusColors[status],
            confirmButtonText: 'Yes, Proceed',
            cancelButtonColor: '#64748b',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const payload = { status };
                if (reason) payload.rejectionReason = reason;
                
                const response = await axios.put(`${API_BASE_URL}/api/payments/update-status/${id}`, payload);
                
                if (response.data.success) {
                    fetchPayments(); 
                    
                    const messages = {
                        approved: 'Payment approved! Student can now access the course.',
                        rejected: 'Payment rejected. Student will be notified with reason.',
                        pending: 'Status reset to pending.'
                    };
                    
                    Swal.fire({ 
                        title: 'Updated!', 
                        text: messages[status], 
                        icon: 'success', 
                        timer: 2000, 
                        showConfirmButton: false 
                    });
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to update status. Please try again.', 'error');
            }
        }
    };

    const handleDelete = async (e, id) => {
        if(e) { e.preventDefault(); e.stopPropagation(); }
        const result = await Swal.fire({
            title: 'Delete Permanently?',
            text: "This action cannot be undone and will remove the record from SkillsMind database.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e31e24',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const res = await axios.delete(`${API_BASE_URL}/api/payments/delete/${id}`);
                if (res.data.success) {
                    fetchPayments();
                    Swal.fire('Deleted!', 'The record has been permanently removed.', 'success');
                }
            } catch (error) {
                Swal.fire('Error', 'Deletion failed. Please check server logs.', 'error');
            }
        }
    };

    const exportToExcel = () => {
        if (payments.length === 0) return Swal.fire('No Data', 'There are no records to export.', 'info');

        const fileData = payments.map((p, index) => ({
            "Sr. No": index + 1,
            "Student Name": p.studentName,
            "Email Address": p.studentEmail,
            "CNIC": p.studentCnic || 'N/A',
            "Course Name": p.courseName,
            "Amount (PKR)": p.amount,
            "Payment Method": p.paymentMethod,
            "Transaction ID": p.transactionId,
            "Status": p.status.toUpperCase(),
            "Rejection Reason": p.rejectionReason || '-',
            "Date": new Date(p.createdAt).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(fileData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SkillsMind_Payments");
        
        const colWidths = [
            { wch: 8 }, { wch: 25 }, { wch: 30 }, { wch: 18 }, 
            { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, 
            { wch: 12 }, { wch: 20 }, { wch: 15 }
        ];
        ws['!cols'] = colWidths;
        
        XLSX.writeFile(wb, `SkillsMind_Payments_Report_${new Date().getTime()}.xlsx`);
    };

    const exportToPDF = () => {
        if (payments.length === 0) return Swal.fire('No Data', 'There are no records to export.', 'info');

        try {
            const doc = new jsPDF('l', 'mm', 'a4');
            
            doc.setFontSize(22);
            doc.setTextColor(0, 11, 41); 
            doc.text("SkillsMind Premium", 14, 20);
            
            doc.setFontSize(12);
            doc.setTextColor(227, 30, 36); 
            doc.text("Official Payment Settlement Report", 14, 28);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);
            doc.text(`Total Records: ${payments.length}`, 240, 35);

            const tableColumn = ["#", "Student Details", "CNIC", "Course Info", "Transaction Details", "Status", "Reason"];
            
            const tableRows = payments.map((p, index) => [
                index + 1,
                `${p.studentName}\n${p.studentEmail}`,
                p.studentCnic || 'N/A',
                `${p.courseName}\nRs. ${p.amount}`,
                `${p.paymentMethod}\nID: ${p.transactionId}`,
                p.status.toUpperCase(),
                p.rejectionReason || '-'
            ]);

            autoTable(doc, {
                startY: 40,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                headStyles: { 
                    fillColor: [0, 11, 41], 
                    textColor: [255, 255, 255], 
                    fontSize: 10, 
                    fontStyle: 'bold',
                    halign: 'center'
                },
                styles: { 
                    fontSize: 9, 
                    cellPadding: 4, 
                    valign: 'middle'
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    5: { fontStyle: 'bold', halign: 'center' }
                },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 14, right: 14 },
                
                didParseCell: function (data) {
                    if (data.section === 'body' && data.column.index === 5) {
                        const status = data.cell.raw;
                        if (status === 'APPROVED') {
                            data.cell.styles.textColor = [16, 185, 129];
                        } else if (status === 'REJECTED') {
                            data.cell.styles.textColor = [227, 30, 36];
                        } else if (status === 'PENDING') {
                            data.cell.styles.textColor = [255, 193, 7];
                        }
                    }
                }
            });

            const pageCount = doc.internal.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`SkillsMind Admin Portal - Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            }

            doc.save(`SkillsMind_Report_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            Swal.fire('Export Failed', 'An error occurred while generating the PDF report.', 'error');
        }
    };

    const viewReceipt = (e, path) => {
        if(e) { e.preventDefault(); e.stopPropagation(); }
        if (!path) return Swal.fire('No Proof', 'No transaction receipt was found for this student.', 'info');
        const finalUrl = `${API_BASE_URL}/${path.replace(/\\/g, '/')}`;
        setSelectedImage(finalUrl);
    };

    if (loading) return (
        <div className="sm-loading-container">
            <div className="spinner"></div>
            <p>Syncing SkillsMind Database...</p>
        </div>
    );

    return (
        <div className="payment-approval-container">
            {selectedImage && (
                <div className="sm-image-overlay" onClick={() => setSelectedImage(null)}>
                    <div className="sm-image-content" onClick={(e) => e.stopPropagation()}>
                        <button className="sm-close-modal" onClick={() => setSelectedImage(null)}><FaTimesCircle /></button>
                        <img src={selectedImage} alt="Proof" style={{ width: '100%', borderRadius: '10px' }} />
                        <div style={{ marginTop: '15px', textAlign: 'center' }}>
                            <a href={selectedImage} target="_blank" rel="noreferrer" className="sm-full-view-link">Open Full Resolution</a>
                        </div>
                    </div>
                </div>
            )}

            <div className="sm-header-section">
                <div className="sm-header-text">
                    <h1><FaShieldAlt className="header-icon" /> Payment Approvals</h1>
                    <p>Manage SkillsMind Student Transactions</p>
                </div>
                <div className="sm-header-actions">
                    <button onClick={exportToExcel} className="sm-export-btn excel">
                        <FaFileExcel /> Excel Export
                    </button>
                    <button onClick={exportToPDF} className="sm-export-btn pdf">
                        <FaFilePdf /> PDF Report
                    </button>
                    <button onClick={fetchPayments} className="sm-refresh-btn">
                        <FaSync /> Refresh
                    </button>
                </div>
            </div>

            <div className="sm-table-card">
                <div className="sm-table-responsive">
                    <table className="sm-styled-table">
                        <thead>
                            <tr>
                                <th>Student Details</th>
                                <th>Verification</th>
                                <th>Course & Fee</th>
                                <th>Transaction</th>
                                <th>Proof</th>
                                <th>Status</th>
                                <th style={{textAlign: 'center'}}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length > 0 ? payments.map((pay) => (
                                <tr key={pay._id} style={pay.status === 'rejected' ? { background: '#fef2f2' } : {}}>
                                    <td>
                                        <div className="sm-user-box">
                                            <div className="sm-avatar">{pay.studentName?.charAt(0)}</div>
                                            <div className="sm-info">
                                                <span className="sm-name">{pay.studentName}</span>
                                                <span className="sm-email">{pay.studentEmail}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="sm-cnic-tag"><FaIdCard /> {pay.studentCnic || 'N/A'}</span></td>
                                    <td>
                                        <div className="sm-course-stack">
                                            <span className="sm-course-name-bold">{pay.courseName}</span>
                                            <span className="sm-amount-sub">Rs. {pay.amount}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="sm-trx-stack">
                                            <span className="sm-badge-method">{pay.paymentMethod}</span>
                                            <code className="sm-trx-code">{pay.transactionId}</code>
                                        </div>
                                    </td>
                                    <td>
                                        <button className="sm-view-proof-btn" onClick={(e) => viewReceipt(e, pay.transactionReceipt)}>
                                            <FaEye /> View
                                        </button>
                                    </td>
                                    <td>
                                        <span className={`sm-badge status-${pay.status?.toLowerCase()}`}>
                                            {pay.status?.toUpperCase()}
                                        </span>
                                        {/* 🔥 SHOW REJECTION REASON */}
                                        {pay.rejectionReason && (
                                            <div style={{ 
                                                fontSize: '11px', 
                                                color: '#dc2626', 
                                                marginTop: '4px',
                                                maxWidth: '150px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <FaCommentAlt style={{ fontSize: '10px' }} />
                                                {pay.rejectionReason}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="sm-action-buttons">
                                            {pay.status !== 'approved' && (
                                                <button title="Approve" className="sm-btn-approve" onClick={(e) => handleAction(e, pay._id, 'approved')}>
                                                    <FaCheck />
                                                </button>
                                            )}
                                            {pay.status !== 'rejected' && (
                                                <button title="Reject with Reason" className="sm-btn-reject" onClick={(e) => handleAction(e, pay._id, 'rejected')}>
                                                    <FaTimes />
                                                </button>
                                            )}
                                            {pay.status !== 'pending' && (
                                                <button title="Reset to Pending" className="sm-btn-pending" onClick={(e) => handleAction(e, pay._id, 'pending')}>
                                                    <FaSync />
                                                </button>
                                            )}
                                            <button title="Delete Record" className="sm-btn-delete" onClick={(e) => handleDelete(e, pay._id)}>
                                                <FaTrashAlt />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="7" className="sm-no-data">No payment requests found in the database.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PaymentApprovals;