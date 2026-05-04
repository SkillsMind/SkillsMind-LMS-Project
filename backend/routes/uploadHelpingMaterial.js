const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage with PUBLIC access
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'helping_materials',
        allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'mp4'],
        resource_type: 'auto',
        // 🔥 IMPORTANT: Make files publicly accessible
        access_mode: 'public',
        // Use raw resource type for better PDF handling
        type: 'upload'
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Upload endpoint
router.post('/', auth, upload.single('file'), async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Determine file type
        let fileType = 'other';
        const mimeType = req.file.mimetype;
        
        if (mimeType === 'application/pdf') fileType = 'pdf';
        else if (mimeType.includes('word')) fileType = 'doc';
        else if (mimeType.includes('presentation')) fileType = 'ppt';
        else if (mimeType.includes('image')) fileType = 'image';
        else if (mimeType.includes('video')) fileType = 'video';

        // Get secure URL with proper format
        let fileUrl = req.file.path;
        
        // For PDFs, ensure raw format for download
        if (fileType === 'pdf') {
            fileUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
        }

        res.json({
            success: true,
            data: {
                fileUrl: req.file.path,
                secureUrl: fileUrl,
                fileName: req.file.originalname,
                fileType: fileType,
                fileSize: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
                publicId: req.file.filename
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
    }
});

module.exports = router;