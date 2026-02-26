import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // SkillsMind Security: Check kar rahay hain ke user logged in hai ya nahi
    const studentEmail = localStorage.getItem('studentEmail');
    const location = useLocation();

    // Agar email nahi hai, matlab user login nahi hai, usay wapis login par bhej do
    if (!studentEmail) {
        console.warn("SkillsMind Security: Unauthorized access blocked.");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Agar login hai, toh usay dashboard dekhne do
    return children;
};

export default ProtectedRoute;