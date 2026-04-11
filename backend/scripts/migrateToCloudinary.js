const mongoose = require('mongoose');
const Course = require('../models/Course');
const { uploadToCloudinary } = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

const migrateImages = async () => {
  try {
    const courses = await Course.find({});
    
    for (const course of courses) {
      let updated = false;
      
      // Migrate thumbnail
      if (course.thumbnail && !course.thumbnail.startsWith('http')) {
        const localPath = path.join(__dirname, '../', course.thumbnail);
        if (fs.existsSync(localPath)) {
          const fileBuffer = fs.readFileSync(localPath);
          const result = await uploadToCloudinary(fileBuffer, 'courses/thumbnails');
          course.thumbnail = result.secure_url;
          updated = true;
          console.log(`✅ Migrated thumbnail for: ${course.title}`);
        }
      }
      
      // Migrate video
      if (course.videoFile && !course.videoFile.startsWith('http')) {
        const localPath = path.join(__dirname, '../', course.videoFile);
        if (fs.existsSync(localPath)) {
          const fileBuffer = fs.readFileSync(localPath);
          const result = await uploadToCloudinary(fileBuffer, 'courses/videos');
          course.videoFile = result.secure_url;
          updated = true;
          console.log(`✅ Migrated video for: ${course.title}`);
        }
      }
      
      if (updated) {
        await course.save();
      }
    }
    
    console.log('🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateImages();