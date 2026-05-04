const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    referrerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    referralCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    referredFriends: [{
        friendId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        friendEmail: {
            type: String,
            required: true
        },
        friendName: String,
        status: {
            type: String,
            enum: ['pending', 'signed_up', 'enrolled', 'completed'],
            default: 'pending'
        },
        signedUpAt: Date,
        enrolledAt: Date,
        courseEnrolled: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    }],
    totalReferrals: {
        type: Number,
        default: 0
    },
    successfulReferrals: {
        type: Number,
        default: 0
    },
    totalDiscountEarned: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 🔥 Method to calculate discount percentage
referralSchema.methods.getDiscountPercentage = function() {
    const count = this.successfulReferrals;
    if (count >= 5) return 25;
    if (count >= 4) return 20;
    if (count >= 3) return 15;
    if (count >= 2) return 10;
    if (count >= 1) return 5;
    return 0;
};

// 🔥 FIXED: Remove this pre-save middleware completely
// (Don't add any pre('save') middleware)

module.exports = mongoose.model('Referral', referralSchema);