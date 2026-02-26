const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    gender: { type: String },
    education: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// FIX: Model ka naam wahi rakhein jo file ka naam hai taake confusion na ho
module.exports = mongoose.model('StudentRegister', studentSchema);