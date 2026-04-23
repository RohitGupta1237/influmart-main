const express = require('express');
const { sendOTP, verifyOTP, raiseTicket, sendTicket } = require('../controllers/otpController');
const router = express.Router();


router.post('/sendOTP', sendOTP);

router.post('/verifyOTP', verifyOTP);

router.post('/tickets', raiseTicket);
 
router.post('/send-confirmation-email',sendTicket)

module.exports = router;