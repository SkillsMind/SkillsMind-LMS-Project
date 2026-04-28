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

// Upload image route for webinars - WITH SMART COMPRESSION
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
        
        // ✅ SMART COMPRESSION - Large files will be compressed automatically
        const result = await cloudinary.uploader.upload(image, {
            folder: 'webinars',
            // Smart compression for large files
            transformation: [
                { width: 1200, crop: 'limit' },      // Max width 1200px (keeps aspect ratio)
                { quality: 'auto:best' },             // Auto quality optimization
                { fetch_format: 'auto' }              // Auto format (WebP for supported browsers)
            ],
            // Allow larger files with timeout
            timeout: 120000  // 2 minutes timeout for large files
        });
        
        console.log('Image uploaded:', result.secure_url);
        console.log('Image size:', result.bytes, 'bytes');
        console.log('Image format:', result.format);
        
        res.json({ 
            success: true, 
            url: result.secure_url,
            public_id: result.public_id,
            size: result.bytes,
            format: result.format
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error.message);
        
        // If still too large, try with more aggressive compression
        if (error.message.includes('File size too large') || error.message.includes('413')) {
            try {
                console.log('Retrying with aggressive compression...');
                const result = await cloudinary.uploader.upload(image, {
                    folder: 'webinars',
                    transformation: [
                        { width: 800, crop: 'limit' },
                        { quality: 60 },
                        { fetch_format: 'auto' }
                    ],
                    timeout: 120000
                });
                
                console.log('Image uploaded with aggressive compression:', result.secure_url);
                
                return res.json({ 
                    success: true, 
                    url: result.secure_url,
                    public_id: result.public_id,
                    compressed: true
                });
            } catch (retryError) {
                console.error('Retry failed:', retryError.message);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Image too large. Please use an image smaller than 5MB.' 
                });
            }
        }
        
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Upload failed' 
        });
    }
});

module.exports = router;