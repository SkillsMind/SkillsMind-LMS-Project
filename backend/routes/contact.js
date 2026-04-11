const express = require('express');
const router = express.Router();
const { Resend } = require('resend');

// Initialize Resend with your API key
const resend = new Resend('re_ZqhAwW4V_Jvu9eEYVVgLGhMXmTXqeK9B6');

router.post('/send', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate input
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    // Email to Admin (SkillsMind Team)
    const adminEmail = await resend.emails.send({
      from: 'SkillsMind Contact <onboarding@resend.dev>',
      to: ['skillsmind786@gmail.com'],
      subject: `📬 Contact Form: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>New Contact Message - SkillsMind</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              background-color: #f8fafc;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #000B29 0%, #001845 100%);
              padding: 30px 25px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 800;
              color: #ffffff;
            }
            .header p {
              margin: 8px 0 0;
              color: rgba(255, 255, 255, 0.8);
              font-size: 14px;
            }
            .content {
              padding: 30px 25px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 600;
              color: #000B29;
              margin-bottom: 20px;
            }
            .message-card {
              background: #f8fafc;
              border-radius: 16px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #E30613;
            }
            .field {
              margin-bottom: 18px;
            }
            .field-label {
              font-weight: 700;
              color: #000B29;
              margin-bottom: 6px;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .field-value {
              background: #ffffff;
              padding: 12px 15px;
              border-radius: 10px;
              border: 1px solid #e2e8f0;
              font-size: 14px;
              color: #1e293b;
            }
            .message-content {
              background: #ffffff;
              padding: 15px;
              border-radius: 10px;
              border: 1px solid #e2e8f0;
              font-size: 14px;
              line-height: 1.7;
              white-space: pre-wrap;
            }
            .badge {
              display: inline-block;
              background: #E30613;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 15px;
            }
            .footer {
              background: #f1f5f9;
              padding: 20px 25px;
              text-align: center;
              font-size: 12px;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
            }
            .footer a {
              color: #E30613;
              text-decoration: none;
            }
            .divider {
              height: 1px;
              background: #e2e8f0;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ SkillsMind</h1>
              <p>New Contact Form Submission</p>
            </div>
            <div class="content">
              <div class="badge">📬 New Message Received</div>
              
              <div class="greeting">Hello Team,</div>
              <p>You have received a new message from your website contact form. Here are the details:</p>
              
              <div class="message-card">
                <div class="field">
                  <div class="field-label">👤 Sender Name</div>
                  <div class="field-value">${name}</div>
                </div>
                
                <div class="field">
                  <div class="field-label">📧 Email Address</div>
                  <div class="field-value">
                    <a href="mailto:${email}" style="color: #E30613; text-decoration: none;">${email}</a>
                  </div>
                </div>
                
                <div class="field">
                  <div class="field-label">📝 Subject</div>
                  <div class="field-value">${subject}</div>
                </div>
                
                <div class="divider"></div>
                
                <div class="field">
                  <div class="field-label">💬 Message</div>
                  <div class="message-content">${message.replace(/\n/g, '<br>')}</div>
                </div>
              </div>
              
              <div style="background: #fef2e8; border-radius: 12px; padding: 15px; margin-top: 20px;">
                <p style="margin: 0; font-size: 13px; color: #E30613;">
                  <strong>⚡ Quick Actions:</strong><br>
                  • Reply to this email to respond to ${name}<br>
                  • WhatsApp: <a href="https://wa.me/923116735509" style="color: #E30613;">Click here</a><br>
                  • View all messages in admin panel
                </p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SkillsMind — Empowering Pakistani youth with digital skills</p>
              <p><a href="https://skillsmind.com">Visit Website</a> | <a href="https://instagram.com/skillsmind786">Instagram</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    // Auto-reply to User (Confirmation Email)
    const userEmail = await resend.emails.send({
      from: 'SkillsMind Team <onboarding@resend.dev>',
      to: [email],
      subject: `✅ We've received your message - SkillsMind`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Thank You - SkillsMind</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              background-color: #f8fafc;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 550px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #000B29 0%, #001845 100%);
              padding: 35px 25px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 26px;
              font-weight: 800;
              color: #ffffff;
            }
            .header p {
              margin: 8px 0 0;
              color: rgba(255, 255, 255, 0.8);
            }
            .content {
              padding: 30px 25px;
            }
            .thankyou {
              font-size: 22px;
              font-weight: 700;
              color: #000B29;
              margin-bottom: 10px;
            }
            .highlight {
              color: #E30613;
            }
            .message-preview {
              background: #f8fafc;
              border-radius: 14px;
              padding: 18px;
              margin: 20px 0;
              border-left: 4px solid #E30613;
            }
            .response-time {
              background: #e8f5e9;
              padding: 12px 15px;
              border-radius: 12px;
              margin: 20px 0;
              text-align: center;
            }
            .button {
              display: inline-block;
              background: #E30613;
              color: white;
              padding: 12px 28px;
              border-radius: 40px;
              text-decoration: none;
              font-weight: 600;
              margin-top: 15px;
            }
            .quick-links {
              display: flex;
              gap: 15px;
              justify-content: center;
              margin: 25px 0;
              flex-wrap: wrap;
            }
            .quick-link {
              color: #E30613;
              text-decoration: none;
              font-size: 14px;
            }
            .footer {
              background: #f1f5f9;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ SkillsMind</h1>
              <p>Thank You for Reaching Out!</p>
            </div>
            <div class="content">
              <div class="thankyou">
                Hello <span class="highlight">${name}</span>! 👋
              </div>
              <p>We have received your message and our team will get back to you within <strong>24 hours</strong>.</p>
              
              <div class="message-preview">
                <strong style="color: #000B29;">📝 Your Message:</strong><br>
                <strong>Subject:</strong> ${subject}<br><br>
                <strong>Message:</strong><br>
                ${message.substring(0, 150)}${message.length > 150 ? '...' : ''}
              </div>
              
              <div class="response-time">
                ⏰ <strong>Quick Response Guarantee</strong><br>
                We typically respond within 2-4 hours during business hours.
              </div>
              
              <div class="quick-links">
                <a href="https://skillsmind.com/courses" class="quick-link">📚 Browse Courses</a>
                <a href="https://skillsmind.com/faqs" class="quick-link">❓ FAQs</a>
                <a href="https://wa.me/923116735509" class="quick-link">💬 WhatsApp Us</a>
              </div>
              
              <div style="text-align: center;">
                <a href="https://instagram.com/skillsmind786" class="button">
                  Follow on Instagram 📸
                </a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SkillsMind — Empowering Pakistani youth</p>
              <p>Lahore, Pakistan | info@skillsmind.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log('Admin email sent:', adminEmail.id);
    console.log('User confirmation sent:', userEmail.id);
    
    res.json({ 
      success: true, 
      message: 'Message sent successfully! We will get back to you soon.' 
    });
    
  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to send message. Please try again.' 
    });
  }
});

module.exports = router;