import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const { EMAIL_USER, EMAIL_PASS } = process.env;

if (!EMAIL_USER || !EMAIL_PASS) {
  throw new Error("Missing email configuration in environment variables");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const generateWelcomeEmail = ({ email, password, firstName }) => {
  return {
    from: `OdySystem Management <${EMAIL_USER}>`,
    to: email,
    subject: "🏥 Welcome to OdySystem - Your Account is Ready!",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to OdySystem</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 0;">
            <div style="background-color: rgba(255,255,255,0.15); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
              <span style="font-size: 36px; color: white;">🏥</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Welcome to OdySystem
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
              Your Hospital Management Platform
            </p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #2d3748; font-size: 24px; font-weight: 600; margin: 0 0 10px 0;">
                Hello, ${firstName || "User"}! 👋
              </h2>
              <p style="color: #718096; font-size: 16px; line-height: 1.6; margin: 0;">
                Your account has been successfully created and is ready to use.
              </p>
            </div>

            <!-- Credentials Card -->
            <div style="background: linear-gradient(145deg, #f7fafc 0%, #edf2f7 100%); border-radius: 16px; padding: 30px; margin: 30px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
              <div style="text-align: center; margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #4299e1 0%, #667eea 100%); width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 20px;">🔐</span>
                </div>
                <h3 style="color: #2d3748; font-size: 20px; font-weight: 600; margin: 0;">
                  Your Login Credentials
                </h3>
              </div>
              
              <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <div style="display: flex; padding: 20px; border-bottom: 1px solid #e2e8f0; align-items: center;">
                  <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                    <span style="color: white; font-size: 16px;">📧</span>
                  </div>
                  <div>
                    <div style="font-weight: 600; color: #2d3748; font-size: 14px; margin-bottom: 4px;">
                      Email Address
                    </div>
                    <div style="color: #4a5568; font-size: 16px; font-family: 'Courier New', monospace; background-color: #f7fafc; padding: 6px 12px; border-radius: 6px; display: inline-block;">
                      ${email}
                    </div>
                  </div>
                </div>
                
                <div style="display: flex; padding: 20px; align-items: center;">
                  <div style="background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                    <span style="color: white; font-size: 16px;">🔑</span>
                  </div>
                  <div>
                    <div style="font-weight: 600; color: #2d3748; font-size: 14px; margin-bottom: 4px;">
                      Password
                    </div>
                    <div style="color: #4a5568; font-size: 16px; font-family: 'Courier New', monospace; background-color: #f7fafc; padding: 6px 12px; border-radius: 6px; display: inline-block;">
                      ${password}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Security Notice -->
            <div style="background: linear-gradient(135deg, #fef5e7 0%, #fed7aa 20%, #fef5e7 100%); border-left: 4px solid #f6ad55; border-radius: 12px; padding: 20px; margin: 30px 0;">
              <div style="display: flex; align-items: flex-start;">
                <div style="background: #f6ad55; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">
                  <span style="color: white; font-size: 16px; font-weight: bold;">⚠️</span>
                </div>
                <div>
                  <h4 style="color: #c05621; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
                    Important Security Notice
                  </h4>
                  <p style="color: #9c4221; font-size: 14px; line-height: 1.5; margin: 0;">
                    For your security, please change your password immediately after your first login. Keep your credentials confidential and never share them with others.
                  </p>
                </div>
              </div>
            </div>

          <!-- Footer -->
          <div style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
              If you have any questions or need assistance, please don't hesitate to contact our support team at odysseyclinsys1@gmail.com
            </p>
            <p style="color: #a0aec0; font-size: 12px; margin: 0;">
              © 2025 OdySystem. Hospital Management Platform.<br>
              This email was sent to ${email}
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// Route for sending welcome email - only email and password
router.post("/", async (req, res) => {
  try {
    const { email, password, firstName } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Generate and send welcome email
    const emailContent = generateWelcomeEmail({ email, password, firstName });
    await transporter.sendMail(emailContent);

    res.status(200).json({
      message: "Welcome email sent successfully",
      user: { email }, // Return email without password for security
    });
  } catch (err) {
    console.error("Email sending error:", err);
    res.status(500).json({
      error: "Failed to send welcome email",
    });
  }
});

export default router;
