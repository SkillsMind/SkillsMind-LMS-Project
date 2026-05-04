const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const User = require('../models/User');
const LiveEnrollment = require('../models/LiveEnrollment');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

// ==========================================
// Helper Functions
// ==========================================
function getNextMilestone(currentCount) {
    if (currentCount < 1) return { referralsNeeded: 1, discount: 5 };
    if (currentCount < 2) return { referralsNeeded: 2, discount: 10 };
    if (currentCount < 3) return { referralsNeeded: 3, discount: 15 };
    if (currentCount < 4) return { referralsNeeded: 4, discount: 20 };
    if (currentCount < 5) return { referralsNeeded: 5, discount: 25 };
    return null;
}

// ==========================================
// 1. GET - ENSURE REFERRAL (Auto-create if not exists) - USE THIS!
// ==========================================
router.get('/ensure-referral', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        let referral = await Referral.findOne({ referrerId: userId });
        
        if (!referral) {
            const user = await User.findById(userId);
            const namePart = user.name.substring(0, 3).toUpperCase();
            const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
            const referralCode = `${namePart}${randomPart}`;
            
            referral = new Referral({
                referrerId: userId,
                referralCode: referralCode,
                referredFriends: []
            });
            
            await referral.save();
            console.log(`✅ Referral auto-created for ${user.email}: ${referralCode}`);
        }
        
        const discountPercent = referral.getDiscountPercentage();
        
        res.json({
            success: true,
            referralCode: referral.referralCode,
            totalReferrals: referral.totalReferrals,
            successfulReferrals: referral.successfulReferrals,
            discountPercent: discountPercent,
            nextMilestone: getNextMilestone(referral.successfulReferrals),
            referredFriends: referral.referredFriends
        });
        
    } catch (error) {
        console.error('Ensure referral error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// 2. GET - Get Referral Statistics (Legacy - keep for compatibility)
// ==========================================
router.get('/my-stats', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        let referral = await Referral.findOne({ referrerId: userId });
        
        if (!referral) {
            return res.json({
                success: true,
                referralCode: null,
                totalReferrals: 0,
                successfulReferrals: 0,
                discountPercent: 0,
                nextMilestone: { referralsNeeded: 1, discount: 5 },
                referredFriends: []
            });
        }
        
        // Update status for signed_up friends
        let updated = false;
        for (let i = 0; i < referral.referredFriends.length; i++) {
            const friend = referral.referredFriends[i];
            if (friend.status === 'signed_up') {
                const liveEnrollment = await LiveEnrollment.findOne({
                    email: friend.friendEmail,
                    status: 'active'
                });
                
                if (liveEnrollment) {
                    referral.referredFriends[i].status = 'enrolled';
                    referral.referredFriends[i].enrolledAt = liveEnrollment.createdAt;
                    referral.successfulReferrals += 1;
                    updated = true;
                }
            }
        }
        
        if (updated) {
            await referral.save();
        }
        
        const discountPercent = referral.getDiscountPercentage();
        
        res.json({
            success: true,
            referralCode: referral.referralCode,
            totalReferrals: referral.totalReferrals,
            successfulReferrals: referral.successfulReferrals,
            discountPercent: discountPercent,
            nextMilestone: getNextMilestone(referral.successfulReferrals),
            referredFriends: referral.referredFriends
        });
        
    } catch (error) {
        console.error('Error getting referral stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// 3. POST - Track when someone signs up using referral link
// ==========================================
router.post('/track-signup', async (req, res) => {
    try {
        const { referralCode, friendEmail, friendName } = req.body;
        
        if (!referralCode || !friendEmail) {
            return res.status(400).json({ success: false, message: 'Referral code and email required' });
        }
        
        const referral = await Referral.findOne({ referralCode: referralCode.toUpperCase() });
        
        if (!referral) {
            return res.status(404).json({ success: false, message: 'Invalid referral code' });
        }
        
        const existingFriend = referral.referredFriends.find(f => f.friendEmail === friendEmail);
        
        if (existingFriend) {
            return res.json({ success: true, message: 'Already tracked', alreadyTracked: true });
        }
        
        referral.referredFriends.push({
            friendEmail: friendEmail,
            friendName: friendName || 'New Student',
            status: 'signed_up',
            signedUpAt: new Date()
        });
        
        referral.totalReferrals = referral.referredFriends.length;
        await referral.save();
        
        res.json({
            success: true,
            message: 'Referral tracked successfully',
            referral: {
                totalReferrals: referral.totalReferrals,
                successfulReferrals: referral.successfulReferrals
            }
        });
        
    } catch (error) {
        console.error('Error tracking signup:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// 4. POST - Check and Update when friend enrolls
// ==========================================
router.post('/check-enrollment', async (req, res) => {
    try {
        const { friendEmail, courseId } = req.body;
        
        const referral = await Referral.findOne({
            'referredFriends.friendEmail': friendEmail
        });
        
        if (!referral) {
            return res.json({ success: true, message: 'No referral found' });
        }
        
        const friendIndex = referral.referredFriends.findIndex(f => f.friendEmail === friendEmail);
        
        if (friendIndex === -1) {
            return res.json({ success: true, message: 'Friend not found' });
        }
        
        const friend = referral.referredFriends[friendIndex];
        
        if (friend.status === 'enrolled') {
            return res.json({ 
                success: true, 
                message: 'Already counted',
                alreadyEnrolled: true 
            });
        }
        
        // Check actual enrollment
        let isEnrolled = false;
        
        const liveEnrollment = await LiveEnrollment.findOne({
            email: friendEmail,
            status: 'active'
        });
        
        if (liveEnrollment) isEnrolled = true;
        
        if (!isEnrolled) {
            const payment = await Payment.findOne({
                studentEmail: friendEmail,
                status: 'approved'
            });
            if (payment) isEnrolled = true;
        }
        
        if (isEnrolled && friend.status === 'signed_up') {
            referral.referredFriends[friendIndex].status = 'enrolled';
            referral.referredFriends[friendIndex].enrolledAt = new Date();
            referral.referredFriends[friendIndex].courseEnrolled = courseId;
            
            referral.successfulReferrals += 1;
            
            await referral.save();
            
            const newDiscount = referral.getDiscountPercentage();
            
            return res.json({
                success: true,
                message: 'Referral completed!',
                discountEarned: newDiscount,
                totalReferrals: referral.successfulReferrals
            });
        }
        
        res.json({ success: true, message: 'Not enrolled yet', status: friend.status });
        
    } catch (error) {
        console.error('Error checking enrollment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// 5. POST - Validate Referral Code
// ==========================================
router.post('/validate', async (req, res) => {
    try {
        const { referralCode } = req.body;
        
        if (!referralCode) {
            return res.json({ success: true, valid: false });
        }
        
        const referral = await Referral.findOne({ 
            referralCode: referralCode.toUpperCase() 
        }).populate('referrerId', 'name');
        
        if (referral) {
            res.json({
                success: true,
                valid: true,
                referrerName: referral.referrerId?.name || 'a SkillsMind Student'
            });
        } else {
            res.json({ success: true, valid: false });
        }
        
    } catch (error) {
        console.error('Error validating referral:', error);
        res.json({ success: true, valid: false });
    }
});

// ==========================================
// 6. GET - Get available discount for user
// ==========================================
router.get('/my-discount', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const referral = await Referral.findOne({ referrerId: userId });
        
        let discountPercent = 0;
        let successfulReferrals = 0;
        
        if (referral) {
            successfulReferrals = referral.successfulReferrals;
            discountPercent = referral.getDiscountPercentage();
        }
        
        res.json({
            success: true,
            discountPercent: discountPercent,
            successfulReferrals: successfulReferrals,
            maxDiscount: 25
        });
        
    } catch (error) {
        console.error('Error getting discount:', error);
        res.json({ success: true, discountPercent: 0, successfulReferrals: 0 });
    }
});

module.exports = router;