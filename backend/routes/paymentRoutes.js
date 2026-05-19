const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Webhook MUST use raw body (before JSON middleware) for Razorpay signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body;
    req.body = JSON.parse(req.body.toString());
    next();
  },
  paymentController.webhookHandler
);

router.post('/create-order',    paymentController.createOrder);
router.post('/verify-payment',  paymentController.verifyPayment);
router.post('/mark-processed',  paymentController.markProcessed);
router.post('/refund',          paymentController.refundPayment);
router.get('/status/:orderId',  paymentController.getPaymentStatus);

module.exports = router;
