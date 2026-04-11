const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// 🔥 FIX: Log to check if env variables are loaded
console.log('🔧 Cloudinary Config Check:');
console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('   API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Present' : '❌ Missing');
console.log('   API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Present' : '❌ Missing');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('✅ Cloudinary configured');

// Upload file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `skillsmind/${folder}`,
                resource_type: 'auto',
                ...options
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error.message);
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

const deleteFromCloudinary = (publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };