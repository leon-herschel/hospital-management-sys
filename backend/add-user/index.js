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

const generateWelcomeEmail = ({ email, password }) => {
  return {
    from: `Hospital Management System <${EMAIL_USER}>`,
    to: email,
    subject: "🏥 Welcome to Hospital Management System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
        <h2 style="color: #2563eb; text-align: center;">🏥 Welcome to Hospital Management System</h2>
        <p style="font-size: 16px;">Hello,</p>

        <p style="font-size: 15px;">Your account has been successfully created. Here are your login credentials:</p>

        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>📧 Email:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>🔐 Password:</strong></td>
              <td style="padding: 10px;">${password}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; font-size: 14px; color: #856404;">
            <strong>⚠️ Security Notice:</strong> For your security, please change your password after your first login.
          </p>
        </div>

        <p style="margin-top: 30px; font-size: 15px;">You can now access the Hospital Management System using these credentials. If you have any questions, please contact the system administrator.</p>

        <p style="font-size: 14px; color: #555;">— Hospital Management Team</p>
      </div>
    `,
  };
};

// Route for sending welcome email - only email and password
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Generate and send welcome email
    const emailContent = generateWelcomeEmail({ email, password });
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
