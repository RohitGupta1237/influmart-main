const Brand = require("../model/brandDbRequestModel");
const OTP = require("../model/otp");
const configs = require("../config/configs");
const { v4: uuidv4 } = require('uuid');
const {
  ERR_SAVE_DATA,
  SUBJECT,
  ERROR,
  INVALID_OTP,
  EXPIRE_OTP,
  VERIFY_OTP,
  DOESNT_EXIST,
  OTP_SENT,
  OTP_NOT_EXPIRED,
  BRAND_ALREADY_EXISTS,
  NAME_ALREADY_EXISTS,
} = require("../constant/constants");

const sendResendEmail = async ({ to, subject, text }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Influmart <noreply@influmart.in>',
      to,
      subject,
      text,
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Resend email failed');
  }
  return response.json();
};
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendOTP = async (req, res) => {
  const { email, name } = req.body;
  console.log('OTP SEND REQUEST:', { email, name });
  try {
    // Check if email exists
    let brand = await Brand.findOne({ email });
    let _name = await Brand.findOne({ name });
    console.log('Email exists:', { email, name });

    if (_name) {
      console.log('name exists:', { email, name });

      return res.status(400).json({ message: NAME_ALREADY_EXISTS });
    }
    if (brand) {
      console.log('brand exists:', { email, name });

      return res.status(400).json({ message: BRAND_ALREADY_EXISTS });
    }
    let _email = await OTP.findOne({ email });
    if (_email) {
      if (Date.now() < _email.otpExpires) {
        return res.status(200).json({ message: OTP_NOT_EXPIRED });
      }
    }
    // Generate OTP
    const otp = generateOTP();
    console.log('otp generate exists:', { email, name });

    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    // Save OTP to DB
    await OTP.findOneAndUpdate(
        { email },
        { email, otp, otpExpires },
        { upsert: true, new: true }
    );
    // Send OTP Email
    const mailOptions = {

      from: configs.OTP_MAIL,
      to: email,
      subject: SUBJECT,
      text: `Your OTP is: ${otp}`,
    };
    console.log('SENDING OTP EMAIL:', mailOptions);
    await sendResendEmail(mailOptions);
    console.log('OTP EMAIL SENT');
    return res.status(200).json({ message: OTP_SENT });
  } catch (err) {
    console.error('OTP SEND ERROR:', err);
    return res.status(500).json({ message: ERROR, error: err.toString() });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const user = await OTP.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: DOESNT_EXIST });
  }

  if (user.otp !== otp) {
    return res.status(400).json({ message: INVALID_OTP });
  }

  if (Date.now() > user.otpExpires) {
    return res.status(400).json({ message: EXPIRE_OTP });
  }

  res.status(200).json({ message: VERIFY_OTP });
};


const raiseTicket = async (req, res) => {
  const { name, email, subject, description, priority, category } = req.body;
  console.log('RAISE TICKET REQUEST:', { name, email, subject, description, priority, category });
  const ticketId = uuidv4();
  try {
    await sendResendEmail({
      to: 'macbookairapple90@gmail.com',
      subject: `New Support Ticket: ${subject}`,
      text: `Ticket ID: ${ticketId}\nName: ${name}\nEmail: ${email}\nPriority: ${priority}\nCategory: ${category}\nDescription: ${description}`,
    });
    console.log('SUPPORT TICKET EMAIL SENT');
    res.status(201).json({ ticketId });
  } catch (error) {
    console.error('SUPPORT TICKET EMAIL ERROR:', error);
    res.status(500).send('Error sending email');
  }
};

const sendTicket = async (req, res) => {
  const { email, ticketId } = req.body;
  try {
    await sendResendEmail({
      to: email,
      subject: `Your Ticket ID: ${ticketId}`,
      text: `Thank you for raising a ticket. Your Ticket ID is ${ticketId}. We will get back to you soon.`,
    });
    res.status(200).send('Confirmation email sent');
  } catch (error) {
    res.status(500).send('Error sending email');
  }
};


module.exports = { sendOTP, verifyOTP, raiseTicket, sendTicket };