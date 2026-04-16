const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const { uploadToCloudinary } = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

const migrateReceipts = async () => {
  try {
    // Find payments with local receipts (not Cloudinary URLs)
    const payments = await Payment.find({
      transactionReceipt: { 
        $exists: true, 
        $nin: [/^http/, /^https/] 
      }
    });
    
    console.log(`📦 Found ${payments.length} receipts to migrate`);
    
    for (const payment of payments) {
      const localPath = path.join(__dirname, '../', payment.transactionReceipt);
      
      if (fs.existsSync(localPath)) {
        try {
          const fileBuffer = fs.readFileSync(localPath);
          const result = await uploadToCloudinary(fileBuffer, 'payments/receipts');
          
          payment.transactionReceipt = result.secure_url;
          await payment.save();
          
          console.log(`✅ Migrated: ${payment._id} - ${payment.studentName} -> ${result.secure_url}`);
          
          // Optional: Delete local file after successful migration
          // fs.unlinkSync(localPath);
        } catch (uploadError) {
          console.error(`❌ Failed to migrate ${payment._id}:`, uploadError.message);
        }
      } else {
        console.log(`⚠️ File not found: ${localPath}`);
      }
    }
    
    console.log('🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateReceipts();