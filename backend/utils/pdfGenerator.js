const { launchBrowser } = require('./browser');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// SkillsMind Professional Template
const resultTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quiz Result - SkillsMind</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #000B29 0%, #001a4d 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
        }
        
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }
        
        .logo span {
            color: #E30613;
        }
        
        .certificate-title {
            font-size: 24px;
            margin-top: 20px;
            font-weight: 300;
            letter-spacing: 3px;
            text-transform: uppercase;
        }
        
        /* Student Info */
        .student-section {
            padding: 40px;
            background: #f8f9fa;
            border-bottom: 3px solid #E30613;
        }
        
        .student-info {
            display: flex;
            align-items: center;
            gap: 30px;
        }
        
        .student-avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 4px solid #E30613;
            object-fit: cover;
        }
        
        .student-details h2 {
            color: #000B29;
            font-size: 28px;
            margin-bottom: 5px;
        }
        
        .student-details p {
            color: #666;
            font-size: 16px;
        }
        
        /* Quiz Info */
        .quiz-info {
            padding: 30px 40px;
            background: white;
        }
        
        .quiz-title {
            font-size: 22px;
            color: #000B29;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #eee;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px dashed #ddd;
        }
        
        .info-label {
            color: #666;
            font-weight: 500;
        }
        
        .info-value {
            color: #000B29;
            font-weight: bold;
        }
        
        /* Score Section */
        .score-section {
            padding: 40px;
            background: linear-gradient(135deg, #000B29 0%, #001a4d 100%);
            color: white;
            text-align: center;
        }
        
        .score-circle {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            border: 8px solid #E30613;
            margin: 0 auto 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.1);
        }
        
        .score-percentage {
            font-size: 56px;
            font-weight: bold;
            line-height: 1;
        }
        
        .score-label {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 5px;
        }
        
        .grade-badge {
            display: inline-block;
            padding: 15px 40px;
            background: {{gradeBg}};
            color: {{gradeColor}};
            font-size: 36px;
            font-weight: bold;
            border-radius: 50px;
            margin-bottom: 20px;
        }
        
        .pass-status {
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        
        .pass-status.passed {
            color: #4CAF50;
        }
        
        .pass-status.failed {
            color: #f44336;
        }
        
        /* Details Table */
        .details-section {
            padding: 40px;
        }
        
        .section-title {
            font-size: 20px;
            color: #000B29;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #E30613;
        }
        
        .details-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .details-table th,
        .details-table td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        
        .details-table th {
            background: #f8f9fa;
            color: #000B29;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 1px;
        }
        
        .status-badge {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-correct {
            background: #d4edda;
            color: #155724;
        }
        
        .status-wrong {
            background: #f8d7da;
            color: #721c24;
        }
        
        /* Footer */
        .footer {
            padding: 30px 40px;
            background: #000B29;
            color: white;
            text-align: center;
        }
        
        .footer-text {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .date-generated {
            margin-top: 10px;
            font-size: 12px;
            opacity: 0.6;
        }
        
        .signature-section {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid rgba(255,255,255,0.2);
        }
        
        .signature-line {
            width: 200px;
            height: 2px;
            background: white;
            margin: 0 auto 10px;
        }
        
        /* Watermark */
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            color: rgba(0,11,41,0.03);
            pointer-events: none;
            z-index: 0;
        }
    </style>
</head>
<body>
    <div class="watermark">SKILLSMIND</div>
    
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">SKILLS<span>MIND</span></div>
            <div class="certificate-title">Quiz Result Card</div>
        </div>
        
        <!-- Student Info -->
        <div class="student-section">
            <div class="student-info">
                <img src="{{studentProfilePic}}" alt="Student" class="student-avatar" onerror="this.src='https://via.placeholder.com/100'">
                <div class="student-details">
                    <h2>{{studentName}}</h2>
                    <p>{{studentEmail}}</p>
                    <p style="margin-top: 10px; color: #E30613; font-weight: bold;">Student ID: {{studentId}}</p>
                </div>
            </div>
        </div>
        
        <!-- Quiz Info -->
        <div class="quiz-info">
            <h3 class="quiz-title">{{quizTitle}}</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Course</span>
                    <span class="info-value">{{courseName}}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Quiz Code</span>
                    <span class="info-value">{{quizNumber}}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Date Taken</span>
                    <span class="info-value">{{submittedDate}}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Time Taken</span>
                    <span class="info-value">{{timeTaken}}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total Marks</span>
                    <span class="info-value">{{totalMarks}}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Passing Marks</span>
                    <span class="info-value">{{passingMarks}}%</span>
                </div>
            </div>
        </div>
        
        <!-- Score Section -->
        <div class="score-section">
            <div class="score-circle">
                <div class="score-percentage">{{percentage}}%</div>
                <div class="score-label">Score</div>
            </div>
            
            <div class="grade-badge">{{grade}}</div>
            
            <div class="pass-status {{#if isPassed}}passed{{else}}failed{{/if}}">
                {{#if isPassed}}✓ PASSED{{else}}✗ FAILED{{/if}}
            </div>
            
            <p style="margin-top: 20px; opacity: 0.9;">
                Obtained: {{obtainedMarks}} / {{totalMarks}} Marks
            </p>
        </div>
        
        <!-- Question Details -->
        <div class="details-section">
            <h3 class="section-title">Question-wise Performance</h3>
            <table class="details-table">
                <thead>
                    <tr>
                        <th>Q#</th>
                        <th>Question</th>
                        <th>Your Answer</th>
                        <th>Status</th>
                        <th>Marks</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each answers}}
                    <tr>
                        <td>{{questionNumber}}</td>
                        <td>{{questionText}}</td>
                        <td>Option {{selectedOption}}</td>
                        <td>
                            {{#if isCorrect}}
                            <span class="status-badge status-correct">Correct</span>
                            {{else}}
                            <span class="status-badge status-wrong">Wrong</span>
                            {{/if}}
                        </td>
                        <td>{{marksObtained}}/{{totalQuestionMarks}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">This is a computer generated result card. For any queries, contact admin@skillsmind.com</p>
            <p class="date-generated">Generated on: {{generatedDate}}</p>
            
            <div class="signature-section">
                <div class="signature-line"></div>
                <p style="font-size: 14px;">Authorized Signature</p>
                <p style="font-size: 12px; opacity: 0.6; margin-top: 5px;">SkillsMind LMS Administrator</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

const generateResultPDF = async (data) => {
  try {
    // Compile template
    const template = handlebars.compile(resultTemplate);
    
    // Calculate grade
    const percentage = parseFloat(data.percentage);
    let grade = 'F';
    let gradeColor = '#dc2626';
    let gradeBg = '#fee2e2';
    
    if (percentage >= 90) { grade = 'A+'; gradeColor = '#16a34a'; gradeBg = '#dcfce7'; }
    else if (percentage >= 80) { grade = 'A'; gradeColor = '#22c55e'; gradeBg = '#dcfce7'; }
    else if (percentage >= 70) { grade = 'B'; gradeColor = '#3b82f6'; gradeBg = '#dbeafe'; }
    else if (percentage >= 60) { grade = 'C'; gradeColor = '#f59e0b'; gradeBg = '#fef3c7'; }
    else if (percentage >= 50) { grade = 'D'; gradeColor = '#f97316'; gradeBg = '#ffedd5'; }
    
    // Prepare data
    const templateData = {
      ...data,
      grade,
      gradeColor,
      gradeBg,
      generatedDate: new Date().toLocaleString(),
      answers: data.answers.map((ans, idx) => ({
        ...ans,
        questionNumber: idx + 1,
        questionText: ans.questionText.substring(0, 50) + '...',
        selectedOption: String.fromCharCode(65 + ans.selectedOption)
      }))
    };
    
    // Generate HTML
    const html = template(templateData);
    
    // 🔥 USE UNIFIED BROWSER LAUNCHER
    const browser = await launchBrowser();
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    await browser.close();
    
    return pdf;
    
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};

module.exports = { generateResultPDF };