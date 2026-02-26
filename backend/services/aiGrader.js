const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pdfService = require('./pdfService');

class AIGrader {
  constructor() {
    // 🔥 OpenRouter API Key
    this.apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!this.apiKey) {
      console.error('❌ No API key found. Set OPENROUTER_API_KEY in .env');
      throw new Error('API key required');
    }
    
    // Check if it's OpenRouter or Gemini
    this.isOpenRouter = this.apiKey.startsWith('sk-or-') || process.env.USE_OPENROUTER === 'true';
    
    if (this.isOpenRouter) {
      console.log('✅ Using OpenRouter API');
      this.baseURL = 'https://openrouter.ai/api/v1';
      this.model = 'google/gemini-flash-1.5'; // Free model
    } else {
      console.log('✅ Using Gemini API');
      this.baseURL = null; // Will use Google SDK
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }
    
    this.lastRequestTime = 0;
    this.minDelayMs = 2000; // 2 seconds for OpenRouter (faster)
  }

  async readFileContent(filePath) {
    try {
      const fullPath = path.join(__dirname, '..', filePath);
      
      if (!fs.existsSync(fullPath)) {
        return { type: 'error', content: null, error: 'File not found' };
      }

      const ext = path.extname(fullPath).toLowerCase();
      const stats = fs.statSync(fullPath);

      // PDF Files
      if (ext === '.pdf') {
        console.log(`📄 Processing PDF: ${path.basename(filePath)}`);
        const pdfResult = await pdfService.extractText(filePath);
        
        return {
          type: 'pdf',
          content: pdfResult.text,
          metadata: {
            pages: pdfResult.pages,
            filename: path.basename(filePath),
            size: `${(stats.size / 1024).toFixed(2)}KB`,
            extracted: pdfResult.success,
            method: pdfResult.method
          }
        };
      }

      // Text files
      const textExtensions = ['.txt', '.js', '.html', '.css', '.json', '.md', '.jsx', '.ts', '.tsx'];
      if (textExtensions.includes(ext)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        return {
          type: 'text',
          content: content,
          metadata: { filename: path.basename(filePath), size: `${(stats.size / 1024).toFixed(2)}KB` }
        };
      }

      // Word Documents
      if (ext === '.docx' || ext === '.doc') {
        return {
          type: 'doc',
          content: `[Word Document: ${path.basename(fullPath)}]`,
          metadata: { filename: path.basename(filePath), size: `${(stats.size / 1024).toFixed(2)}KB` }
        };
      }

      // Default
      return {
        type: 'file',
        content: `[File: ${path.basename(fullPath)}, Type: ${ext}]`,
        metadata: { filename: path.basename(filePath), size: `${(stats.size / 1024).toFixed(2)}KB` }
      };

    } catch (error) {
      console.error('❌ File Read Error:', error.message);
      return { type: 'error', content: null, error: error.message };
    }
  }

  async gradeAssignment({ 
    assignmentTitle, 
    assignmentDescription, 
    assignmentRequirements = [],
    studentSubmission, 
    totalMarks, 
    rubric = null,
    courseContext = '',
    submissionFiles = []
  }) {
    try {
      console.log('🎯 Starting AI Grading Process...');
      console.log(`📚 Assignment: ${assignmentTitle}`);
      console.log(`👤 Files: ${submissionFiles.length}`);

      // Read all files
      let fullSubmissionContent = '';
      const fileContents = [];
      let pdfExtracted = false;

      if (studentSubmission && studentSubmission.trim()) {
        fullSubmissionContent += `STUDENT COMMENTS:\n${studentSubmission}\n\n`;
      }

      for (const filePath of submissionFiles) {
        const fileData = await this.readFileContent(filePath);
        
        fileContents.push({
          filename: path.basename(filePath),
          type: fileData.type,
          ...fileData.metadata
        });

        if (fileData.content) {
          fullSubmissionContent += `\n\n--- FILE: ${path.basename(filePath)} ---\n`;
          fullSubmissionContent += fileData.content;
          fullSubmissionContent += '\n--- END FILE ---\n';
          
          if (fileData.type === 'pdf' && fileData.metadata.extracted) {
            pdfExtracted = true;
          }
        }
      }

      if (!fullSubmissionContent.trim()) {
        fullSubmissionContent = `[No content extracted]`;
      }

      console.log(`📝 Content: ${fullSubmissionContent.length} chars, PDF extracted: ${pdfExtracted}`);

      // Create prompt
      const prompt = this.createGradingPrompt({
        assignmentTitle,
        assignmentDescription,
        studentSubmission: fullSubmissionContent,
        totalMarks,
        rubric,
        courseContext,
        fileContents,
        pdfExtracted
      });

      // Call AI
      const result = await this.callAIWithRetry(prompt, totalMarks);
      
      return {
        success: true,
        ...result,
        filesProcessed: fileContents,
        contentLength: fullSubmissionContent.length,
        pdfExtracted: pdfExtracted,
        gradedBy: 'AI',
        gradedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ AI Grading Error:', error.message);
      
      return {
        success: false,
        error: error.message,
        marks: 0,
        grade: 'F',
        feedback: `AI grading failed: ${error.message}. Please grade manually.`,
        requiresManualReview: true
      };
    }
  }

  createGradingPrompt({
    assignmentTitle,
    assignmentDescription,
    studentSubmission,
    totalMarks,
    rubric,
    courseContext,
    fileContents,
    pdfExtracted
  }) {
    const rubricText = rubric || `Content(40%), Completeness(30%), Presentation(20%), Originality(10%)`;

    const filesInfo = fileContents.map(f => {
      let info = `- ${f.filename} (${f.type}`;
      if (f.size) info += `, ${f.size}`;
      if (f.pages) info += `, ${f.pages}p`;
      if (f.extracted === false) info += `, NOT READABLE`;
      return info + `)`;
    }).join('\n');

    const pdfNote = !pdfExtracted && fileContents.some(f => f.type === 'pdf')
      ? `\n⚠️ PDF content could not be extracted. Grade based on available info.`
      : '';

    return `You are an expert educator grading student assignments.

ASSIGNMENT: ${assignmentTitle}
DESCRIPTION: ${assignmentDescription}
TOTAL MARKS: ${totalMarks}
${courseContext ? `COURSE: ${courseContext}` : ''}
RUBRIC: ${rubricText}

FILES:
${filesInfo}
${pdfNote}

STUDENT SUBMISSION:
${studentSubmission.substring(0, 15000)}${studentSubmission.length > 15000 ? '...' : ''}

Respond ONLY in this JSON format:
{
  "marks": <number between 0-${totalMarks}>,
  "grade": "<A/B/C/D/F>",
  "feedback": "<detailed feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>"],
  "confidence": <number between 0-100>,
  "aiNotes": "<brief summary>",
  "requirementAnalysis": {
    "met": ["<requirement met>"],
    "partiallyMet": ["<partial>"],
    "notMet": ["<not met>"]
  }
}`;
  }

  async callAIWithRetry(prompt, totalMarks, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 AI Attempt ${attempt}/${maxRetries}`);
        
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minDelayMs) {
          const wait = this.minDelayMs - timeSinceLastRequest;
          console.log(`⏳ Waiting ${wait}ms...`);
          await new Promise(r => setTimeout(r, wait));
        }

        this.lastRequestTime = Date.now();
        
        let data;
        
        if (this.isOpenRouter) {
          // 🔥 OpenRouter API Call
          const response = await axios.post(
            `${this.baseURL}/chat/completions`,
            {
              model: this.model,
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert educator grading assignments. Respond only in JSON format.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.3,
              max_tokens: 2000
            },
            {
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': 'http://localhost:5173', // Your site URL
                'X-Title': 'SkillsMind LMS',
                'Content-Type': 'application/json'
              },
              timeout: 60000
            }
          );
          
          // Parse OpenRouter response
          const content = response.data.choices[0].message.content;
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No JSON in response');
          data = JSON.parse(jsonMatch[0]);
          
        } else {
          // 🔥 Gemini API Call
          const result = await this.model.generateContent(prompt);
          const text = result.response.text();
          const match = text.match(/\{[\s\S]*\}/);
          if (!match) throw new Error('No JSON in response');
          data = JSON.parse(match[0]);
        }
        
        // Validate
        if (typeof data.marks !== 'number' || data.marks < 0 || data.marks > totalMarks) {
          throw new Error(`Invalid marks: ${data.marks}`);
        }

        console.log(`✅ Graded: ${data.marks}/${totalMarks}`);

        return {
          marks: data.marks,
          grade: data.grade || this.calculateGrade(data.marks, totalMarks),
          feedback: data.feedback || 'No feedback',
          strengths: data.strengths || [],
          improvements: data.improvements || [],
          confidence: data.confidence || 70,
          aiNotes: data.aiNotes || '',
          requirementAnalysis: data.requirementAnalysis || { met: [], partiallyMet: [], notMet: [] }
        };

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          const delay = 3000 * attempt;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    
    throw new Error('All AI attempts failed');
  }

  calculateGrade(marks, totalMarks) {
    const pct = (marks / totalMarks) * 100;
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  }

  async testConnection() {
    try {
      if (this.isOpenRouter) {
        const response = await axios.get(`${this.baseURL}/auth/key`, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });
        return {
          success: true,
          message: 'OpenRouter API connected',
          model: this.model,
          data: response.data.data
        };
      } else {
        // Gemini test
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(this.apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Say 'API working'");
        return {
          success: true,
          message: result.response.text(),
          model: 'gemini-2.0-flash'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AIGrader();