const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true 
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; 
        }
    },
    profilePic: {
        type: String,
        default: ""
    },
    googleId: {
        type: String,
        default: null
    },
    otp: {
        type: String,
        default: null
    },
    otpExpires: {
        type: Date,
        default: null
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    // 🔥 YEH FIELD ADD KI HAI - Student ke enrolled courses track karne ke liye
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    // Purani 'date' field ko rehne diya hai taake purana data kharab na ho
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }); // Yeh line naye users ke liye 'createdAt' banayegi

module.exports = mongoose.model('User', UserSchema);