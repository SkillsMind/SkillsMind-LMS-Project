const mongoose = require('mongoose');

const liveEnrollmentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    dob: { type: String, required: true },
    gender: { type: String, required: true },
    course: { type: String, required: true }, // Ye SkillsMind ke course ka naam save karega
    status: { type: String, default: 'pending' }, // Payment verify hone tak pending rahega
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LiveEnrollment', liveEnrollmentSchema);