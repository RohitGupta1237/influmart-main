const nodemailer = require("nodemailer");
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

const transporter = nodemailer.createTransport({
  host: configs.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: configs.OTP_MAIL,
    pass: configs.PASSWORD,
  },
});
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
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('OTP EMAIL ERROR:', error);
        return res.status(500).json({ message: ERROR, error: error.toString() });
      } else {
        console.log('OTP EMAIL SENT:', info.response);
        return res.status(200).json({ message: OTP_SENT });
      }
    });
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


const raiseTicket = (req, res) => {
  const { name, email, subject, description, priority, category } = req.body;
  console.log('RAISE TICKET REQUEST:', { name, email, subject, description, priority, category });
  // Generate a unique ticket ID
  const ticketId = uuidv4();
  // Send an email to your office with the ticket details
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: configs.OTP_MAIL,
      pass: configs.PASSWORD,
    },
  });
  const mailOptions = {
    from: email,
    to: 'macbookairapple90@gmail.com',
    subject: `New Support Ticket: ${subject}`,
    text: `Ticket ID: ${ticketId}\nName: ${name}\nEmail: ${email}\nPriority: ${priority}\nCategory: ${category}\nDescription: ${description}`,
  };
  console.log('SUPPORT TICKET MAIL OPTIONS:', mailOptions);
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('SUPPORT TICKET EMAIL ERROR:', error);
      return res.status(500).send('Error sending email');
    }
    console.log('SUPPORT TICKET EMAIL SENT:', info.response);
    res.status(201).json({ ticketId });
  });
};

const sendTicket = (req, res) => {
  const { email, ticketId } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: configs.OTP_MAIL,
      pass: configs.PASSWORD,
    },
  });

  const mailOptions = {
    from: 'rohitgupta12371380@gmail.com',
    to: email,
    subject: `Your Ticket ID: ${ticketId}`,
    text: `Thank you for raising a ticket. Your Ticket ID is ${ticketId}. We will get back to you soon.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send('Error sending email');
    }
    res.status(200).send('Confirmation email sent');
  });
};


module.exports = { sendOTP, verifyOTP, raiseTicket, sendTicket };
