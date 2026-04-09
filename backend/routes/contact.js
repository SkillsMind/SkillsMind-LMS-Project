const express = require('express');
const router = express.Router();
const SibApiV3Sdk = require('@getbrevo/brevo');

// Initialize Brevo
let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

router.post('/send', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Email content
    const htmlContent = `
      <h2>New Contact Form Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `;
    
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { email: 'skillsmind786@gmail.com', name: 'SkillsMind Contact' };
    sendSmtpEmail.to = [{ email: 'skillsmind786@gmail.com', name: 'SkillsMind Team' }];
    sendSmtpEmail.subject = `Contact Form: ${subject}`;
    sendSmtpEmail.htmlContent = htmlContent;
    
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

module.exports = router;