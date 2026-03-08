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
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    // ✅ SETTINGS FIELD ADDED
    settings: {
        notifications: {
            type: Object,
            default: {
                emailNotifications: true,
                pushNotifications: true,
                courseUpdates: true,
                assignmentReminders: true,
                quizReminders: true,
                marketingEmails: false
            }
        },
        privacy: {
            type: Object,
            default: {
                profileVisible: true,
                showProgress: true,
                showCertificates: true,
                allowMessages: true
            }
        },
        appearance: {
            type: Object,
            default: {
                theme: 'light',
                fontSize: 'medium',
                compactMode: false
            }
        }
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);