const { RESET_PASSWORD_TOKEN_EXPIRATION, PASSWORD, OTP_MAIL } = require("../config/configs");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Brand = require("../model/brandDbRequestModel");
const InfluencerSignupRequest = require("../model/influencerSignupRequestModel");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: OTP_MAIL,
    pass: PASSWORD,
  },
});

// Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send reset email — returns a Promise so errors are caught properly
const sendResetEmail = (email, otp) => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: OTP_MAIL,
      to: email,
      subject: 'Influmart Password Reset OTP',
      text: `Your Influmart password reset OTP is: ${otp}\n\nThis OTP expires in 1 hour. Do not share it with anyone.`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending reset email:', error);
        reject(error);
      } else {
        console.log('Reset email sent:', info.response);
        resolve(info);
      }
    });
  });
};

// Forgot Password — sends OTP to email
exports.forgotPassword = async (req, res) => {
  const { email, type } = req.body;
  try {
    const Model = type === 'brand' ? Brand : InfluencerSignupRequest;
    const user = await Model.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const otp = generateOTP();
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await sendResetEmail(email, otp);
    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Error during password reset request:', error);
    res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
  }
};

// Reset Password — verifies OTP and updates password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword, type } = req.body;
  try {
    const Model = type === 'brand' ? Brand : InfluencerSignupRequest;
    const user = await Model.findOne({ email });
    if (!user || user.resetPasswordToken !== otp || Date.now() > Date.parse(user.resetPasswordExpires)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
