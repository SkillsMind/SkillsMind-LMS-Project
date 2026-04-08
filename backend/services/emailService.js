const SibApiV3Sdk = require('@getbrevo/brevo');

// Initialize Brevo with API key
let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Function to send OTP email
async function sendOTPEmail(toEmail, userName, otpCode) {
    try {
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        
        sendSmtpEmail.sender = {
            email: 'skillsmind786@gmail.com',
            name: 'SkillsMind'
        };
        
        sendSmtpEmail.to = [{
            email: toEmail,
            name: userName || 'Student'
        }];
        
        sendSmtpEmail.subject = 'Your SkillsMind OTP Code';
        
        sendSmtpEmail.htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .otp-code { font-size: 32px; font-weight: bold; color: #e30613; text-align: center; letter-spacing: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">
                        <h2 style="color: #000B29;">Skills<span style="color: #e30613;">Mind</span></h2>
                    </div>
                    <h3 style="text-align: center;">Hello ${userName || 'Student'}!</h3>
                    <p style="text-align: center;">Your verification code is:</p>
                    <div class="otp-code">${otpCode}</div>
                    <p style="text-align: center; color: #666;">This code will expire in 10 minutes.</p>
                    <p style="text-align: center;">If you didn't request this code, please ignore this email.</p>
                </div>
            </body>
            </html>
        `;
        
        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('✅ OTP email sent successfully');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Email send failed:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { sendOTPEmail };