// Direct HTTPS API call to Brevo - NO SMTP
async function sendOTPEmail(toEmail, userName, otpCode) {
    try {
        console.log('📧 Sending OTP to:', toEmail);
        
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    email: 'skillsmind786@gmail.com',
                    name: 'SkillsMind'
                },
                to: [{
                    email: toEmail,
                    name: userName || 'Student'
                }],
                subject: 'Your SkillsMind OTP Code',
                htmlContent: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                            .otp-code { font-size: 32px; font-weight: bold; color: #e30613; text-align: center; letter-spacing: 5px; margin: 20px 0; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2 style="color: #000B29;">Skills<span style="color: #e30613;">Mind</span></h2>
                            <h3>Hello ${userName || 'Student'}!</h3>
                            <p>Your verification code is:</p>
                            <div class="otp-code">${otpCode}</div>
                            <p>This code will expire in 10 minutes.</p>
                        </div>
                    </body>
                    </html>
                `
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ OTP email sent successfully to:', toEmail);
            return { success: true, messageId: data.messageId };
        } else {
            console.error('❌ Brevo API error:', data);
            return { success: false, error: data.message };
        }
    } catch (error) {
        console.error('❌ Email send failed:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { sendOTPEmail };