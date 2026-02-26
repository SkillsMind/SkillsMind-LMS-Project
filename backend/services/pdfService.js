const fs = require('fs');
const path = require('path');

class PDFService {
  constructor() {
    this.pdfParse = null;
    this.initParser();
  }

  initParser() {
    try {
      // Simple require
      this.pdfParse = require('pdf-parse');
      console.log('✅ PDF Parser initialized');
    } catch (err) {
      console.log('❌ pdf-parse not available:', err.message);
      this.pdfParse = null;
    }
  }

  async extractText(filePath) {
    try {
      const fullPath = path.join(__dirname, '..', filePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error('File not found');
      }

      // Method 1: Try pdf-parse
      if (this.pdfParse) {
        try {
          const buffer = fs.readFileSync(fullPath);
          const data = await this.pdfParse(buffer);
          
          if (data && data.text && data.text.trim().length > 10) {
            console.log(`✅ PDF extracted: ${data.text.length} chars, ${data.numpages} pages`);
            return {
              success: true,
              text: data.text,
              pages: data.numpages || 1,
              method: 'pdf-parse'
            };
          }
        } catch (e) {
          console.log('⚠️ pdf-parse failed:', e.message);
        }
      }

      // Fallback: Return file info only
      const stats = fs.statSync(fullPath);
      const fileName = path.basename(fullPath);
      
      console.log(`⚠️ Using fallback for PDF: ${fileName}`);
      
      return {
        success: false,
        text: `[PDF FILE: ${fileName}]\n[Size: ${(stats.size / 1024).toFixed(2)} KB]\n[Content extraction failed - PDF may be scanned/image-based]\n\nPlease download and review this PDF manually.`,
        pages: 0,
        method: 'fallback',
        fileSize: stats.size
      };

    } catch (error) {
      console.error('❌ PDF extraction error:', error.message);
      return {
        success: false,
        text: `[Error reading PDF: ${error.message}]`,
        pages: 0,
        method: 'error'
      };
    }
  }
}

module.exports = new PDFService();