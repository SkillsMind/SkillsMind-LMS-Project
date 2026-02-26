import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaMapMarkerAlt, FaUniversity, FaGraduationCap, FaLightbulb, FaRocket } from 'react-icons/fa';
import './BuildProfile.css'; // Apni CSS file zaroor banayein

const BuildProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    // Initial State
    const [formData, setFormData] = useState({
        userId: userId,
        firstName: '',
        lastName: '',
        city: '',
        institute: '',
        passingYear: '',
        interest: '',
        motivation: ''
    });

    // --- 1. AUTO-FILL LOGIC ---
    useEffect(() => {
        // Agar GetEnrollment se data bhej gaya hai (location.state)
        if (location.state && location.state.existingData) {
            setFormData(location.state.existingData);
        } else {
            // Agar state nahi hai to LocalStorage se check karein
            const savedData = localStorage.getItem('skillsmind_profile');
            if (savedData) {
                setFormData(JSON.parse(savedData));
            }
        }
    }, [location.state]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- 2. SUBMIT / UPDATE LOGIC ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/student-profile/submit', formData);
            if (res.data.success) {
                alert("SkillsMind: Profile Sync Successful!");
                // Update local storage with new data
                localStorage.setItem('skillsmind_profile', JSON.stringify(res.data.profile));
                navigate('/get-enrollment'); // Wapis main page par bhej dein
            }
        } catch (err) {
            console.error("Submission Error:", err);
            alert("Error updating profile.");
        }
    };

    return (
        <div className="build-profile-container">
            <div className="form-card">
                <h2>{location.state?.isUpdating ? "Update Your Path" : "Build Your Profile"}</h2>
                <p>SkillsMind helps you shape your future.</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-grid">
                        <div className="input-group">
                            <label><FaUser /> First Name</label>
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                        </div>
                        <div className="input-group">
                            <label><FaUser /> Last Name</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="input-group">
                        <label><FaMapMarkerAlt /> City</label>
                        <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Lahore" />
                    </div>

                    <div className="input-group">
                        <label><FaUniversity /> Institute / University</label>
                        <input type="text" name="institute" value={formData.institute} onChange={handleChange} />
                    </div>

                    <div className="input-grid">
                        <div className="input-group">
                            <label><FaGraduationCap /> Passing Year</label>
                            <input type="number" name="passingYear" value={formData.passingYear} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label><FaLightbulb /> Area of Interest</label>
                            <select name="interest" value={formData.interest} onChange={handleChange}>
                                <option value="">Select Interest</option>
                                <option value="Graphic Design">Graphic Design</option>
                                <option value="Web Development">Web Development</option>
                                <option value="UI/UX Design">UI/UX Design</option>
                                <option value="Digital Marketing">Digital Marketing</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label><FaRocket /> Motivation & Goals</label>
                        <textarea name="motivation" value={formData.motivation} onChange={handleChange} placeholder="What drives you?"></textarea>
                    </div>

                    <button type="submit" className="submit-btn">
                        {location.state?.isUpdating ? "Save Changes" : "Complete Profile"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BuildProfile;