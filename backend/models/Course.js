const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true }, 
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    category: { type: String, required: true },
    thumbnail: { type: String }, // Image path (uploads/)
    
    // SkillsMind: External Video Link (YouTube/Vimeo)
    videoUrl: { type: String }, 
    
    // SkillsMind: Actual Uploaded Course Intro Video path
    videoFile: { type: String }, 
    
    badge: { type: String }, // e.g., "Premium", "Bestseller"
    
    instructor: {
        name: { type: String, required: true },
        bio: { type: String },
        profilePic: { type: String }, 
        expertise: [String], 
        studentsTaught: { type: Number, default: 0 },
        // Instructor ki uploaded intro video path
        introVideoFile: { type: String },
        // Instructor ki video ka link (agar link dena ho)
        introVideoUrl: { type: String }
    },

    syllabus: [
        {
            week: { type: Number },
            mainTopic: { type: String }, 
            lessons: [String] 
        }
    ],

    enrolledStudents: { type: Number, default: 0 }, 
    
    // 🔥 YEH LINE ADD KI HAI - Enrolled Students ki Detail ke liye
    enrolledStudentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    isHide: { 
        type: Boolean, 
        default: false 
    }, 
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);