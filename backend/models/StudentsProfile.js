const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema({
    // 'user' reference for easy population
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    
    // Email field for SkillsMind Profile Sidebar
    email: { type: String }, // student?.email
    
    // Phone Fields (Dono rakhe hain taake mapping mein masla na ho)
    phone: { type: String },  // student?.phone
    mobile: { type: String }, // Old data field
    
    // Education Fields
    education: { type: String }, // student?.education
    status: { type: String },    // student?.status (Work/Student)
    
    city: String,
    dob: String,
    gender: String,
    institute: String,
    interest: String,
    motivation: String,
    passingYear: String,
    
    // Profile Image optimized for SkillsMind
    profileImage: { type: String, default: "" } 
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);