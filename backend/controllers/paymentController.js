const Razorpay = require('razorpay');
const crypto = require('crypto');
const PaymentLog = require('../model/PaymentLog');
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY, RAZORPAY_WEBHOOK_SECRET } = process.env;

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

// ─── Create order ────────────────────────────────────────────────────────────
// Accepts: amount, currency, receipt, type ('subscription'|'renewal'|'campaign'), metadata
// Saves a PaymentLog with status 'pending' so we always have a record even if frontend crashes.
exports.createOrder = async (req, res) => {
  const { amount, currency, receipt, type, metadata } = req.body;
  try {
    const order = await razorpayInstance.orders.create({ amount, currency, receipt });

    await PaymentLog.create({
      orderId:  order.id,
      amount,
      type:     type || 'subscription',
      metadata: metadata || {},
      status:   'pending',
    });

    res.status(200).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};

// ─── Verify payment signature ─────────────────────────────────────────────────
// Called by frontend after Razorpay success callback.
// Updates PaymentLog to 'captured'. The frontend then does the DB save.
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_SECRET_KEY)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    await PaymentLog.findOneAndUpdate(
      { orderId: razorpay_order_id },
      { status: 'failed', updatedAt: new Date() }
    );
    return res.status(400).json({ message: 'Invalid signature' });
  }

  await PaymentLog.findOneAndUpdate(
    { orderId: razorpay_order_id },
    { paymentId: razorpay_payment_id, status: 'captured', updatedAt: new Date() }
  );

  res.status(200).json({ message: 'Payment verified successfully' });
};

// ─── Mark processed ───────────────────────────────────────────────────────────
// Called by frontend AFTER the DB save (subscribe / createCollabPost / renewSubscription) succeeds.
// Closes the payment audit trail.
exports.markProcessed = async (req, res) => {
  const { orderId } = req.body;
  try {
    await PaymentLog.findOneAndUpdate(
      { orderId },
      { status: 'processed', updatedAt: new Date() }
    );
    res.status(200).json({ message: 'Payment marked as processed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update payment log' });
  }
};

// ─── Refund payment ───────────────────────────────────────────────────────────
exports.refundPayment = async (req, res) => {
  const { paymentId, amount, orderId } = req.body;
  if (!paymentId) return res.status(400).json({ message: 'paymentId is required' });
  try {
    const refund = await razorpayInstance.payments.refund(paymentId, { amount });
    if (orderId) {
      await PaymentLog.findOneAndUpdate(
        { orderId },
        { status: 'refunded', updatedAt: new Date() }
      );
    }
    res.status(200).json({ message: 'Refund initiated', refund });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Failed to initiate refund', error: error?.error || error });
  }
};

// ─── Payment status ───────────────────────────────────────────────────────────
// Frontend can poll this to check if a payment was processed (useful after webhook).
exports.getPaymentStatus = async (req, res) => {
  try {
    const log = await PaymentLog.findOne({ orderId: req.params.orderId });
    if (!log) return res.status(404).json({ message: 'Payment not found' });
    res.status(200).json({ status: log.status, type: log.type });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment status' });
  }
};

// ─── Razorpay Webhook (production) ───────────────────────────────────────────
// Razorpay POSTs here on every payment event.
// Requires RAZORPAY_WEBHOOK_SECRET in .env and a public URL configured in Razorpay dashboard.
// Works as a safety net: if frontend crashes after payment, webhook still completes the DB save.
exports.webhookHandler = async (req, res) => {
  // Verify webhook signature
  if (RAZORPAY_WEBHOOK_SECRET) {
    const signature = req.headers['x-razorpay-signature'];
    const expectedSig = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(req.rawBody) // raw body (see index.js)
      .digest('hex');
    if (signature !== expectedSig) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }
  }

  const { event, payload } = req.body;
  const paymentEntity = payload?.payment?.entity;
  if (!paymentEntity) return res.status(200).json({ received: true });

  const orderId   = paymentEntity.order_id;
  const paymentId = paymentEntity.id;
  const amount    = paymentEntity.amount;

  try {
    const log = await PaymentLog.findOne({ orderId });
    if (!log) return res.status(200).json({ received: true }); // unknown order — ignore

    if (event === 'payment.captured') {
      // Idempotency guard — don't process twice
      if (log.status === 'processed') return res.status(200).json({ received: true });

      await PaymentLog.findOneAndUpdate(
        { orderId },
        { paymentId, status: 'captured', updatedAt: new Date() }
      );

      // Complete the DB save that the frontend may have missed
      if (log.type === 'subscription') {
        const Subscription = require('../model/Subscription');
        const existing = await Subscription.findOne({ userName: log.metadata.userName });
        if (!existing) {
          // Backend calculates dates (same logic as renewSubscription)
          const { PLAN_DURATIONS, addDuration } = require('./subscriptionController');
          const now = new Date();
          const duration = PLAN_DURATIONS[log.metadata.plan];
          if (duration) {
            await Subscription.create({
              userName:        log.metadata.userName,
              plan:            log.metadata.plan,
              startDate:       now,
              endDate:         addDuration(now, duration),
              isFree:          false,
              amount:          String(amount / 100),
              paymentMode:     JSON.stringify({ razorpay_payment_id: paymentId }),
              transactionDate: now,
            });
          }
        }
      } else if (log.type === 'renewal') {
        const Subscription = require('../model/Subscription');
        const existing = await Subscription.findOne({ userName: log.metadata.userName });
        if (existing && existing.status !== 'processed') {
          const { PLAN_DURATIONS, addDuration } = require('./subscriptionController');
          const now = new Date();
          const baseDate = existing.endDate && new Date(existing.endDate) > now
            ? new Date(existing.endDate) : now;
          const duration = PLAN_DURATIONS[log.metadata.plan];
          if (duration) {
            await Subscription.findOneAndUpdate(
              { userName: log.metadata.userName },
              {
                plan:            log.metadata.plan,
                startDate:       baseDate,
                endDate:         addDuration(baseDate, duration),
                amount:          String(amount / 100),
                paymentMode:     JSON.stringify({ razorpay_payment_id: paymentId }),
                transactionDate: now,
                isFree:          false,
              }
            );
          }
        }
      }
      // 'campaign' type: CollabOpening was already saved by the frontend flow.
      // The webhook just marks it processed for audit purposes.

      await PaymentLog.findOneAndUpdate(
        { orderId },
        { status: 'processed', updatedAt: new Date() }
      );

    } else if (event === 'payment.failed') {
      await PaymentLog.findOneAndUpdate(
        { orderId },
        { status: 'failed', updatedAt: new Date() }
      );
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 so Razorpay doesn't keep retrying a permanent error
    res.status(200).json({ received: true, error: error.message });
  }
};
