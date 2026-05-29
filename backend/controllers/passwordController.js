const { RESET_PASSWORD_TOKEN_EXPIRATION } = require("../config/configs");
const bcrypt = require('bcrypt');
const Brand = require("../model/brandDbRequestModel");
const InfluencerSignupRequest = require("../model/influencerSignupRequestModel");

// Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send reset email via Resend
const sendResetEmail = async (email, otp) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Influmart <noreply@influmart.in>',
      to: email,
      subject: 'Influmart Password Reset OTP',
      text: `Your Influmart password reset OTP is: ${otp}\n\nThis OTP expires in 1 hour. Do not share it with anyone.`,
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Resend email failed');
  }
  console.log('Reset email sent via Resend');
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