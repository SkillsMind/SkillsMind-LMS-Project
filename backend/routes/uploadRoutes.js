const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');

// Cloudinary Config - Your Credentials
cloudinary.config({
    cloud_name: 'dd0ydwfiz',
    api_key: '269991459746826',
    api_secret: 'Ou-sJU2lPbrK4dpKGxeh9eKcD-c'
});

// Upload image route for webinars - NO RESTRICTIONS
router.post('/cloudinary', auth, async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({ 
                success: false, 
                message: 'No image provided' 
            });
        }
        
        console.log('Uploading image to Cloudinary...');
        
        // ✅ NO RESTRICTIONS - Upload as is, no transformation, no quality limits
        const result = await cloudinary.uploader.upload(image, {
            folder: 'webinars'
            // ❌ NO transformation: { width: 400, height: 250, crop: 'fill' }
            // ❌ NO quality restrictions
        });
        
        console.log('Image uploaded:', result.secure_url);
        
        res.json({ 
            success: true, 
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Upload failed' 
        });
    }
});

module.exports = router;