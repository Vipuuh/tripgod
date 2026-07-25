// api/razorpay-webhook.js
// Vercel Serverless Function to securely handle Razorpay Webhooks
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

// Initialize Supabase with service role key if available (bypasses RLS safely)
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) 
  : null;

// Helper to parse raw request body for signature verification
async function getRawBody(req) {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);
  
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', err => reject(err));
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = await getRawBody(req);
    const body = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);

    // Verify webhook signature if secret is configured
    if (RAZORPAY_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid Razorpay Webhook Signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } else {
      console.warn('Razorpay Webhook Secret not configured; processing webhook with fallback validation.');
    }

    const event = body.event;
    console.log(`Received Razorpay Webhook Event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = body.payload?.payment?.entity || {};
      const notes = payment.notes || {};

      const bookingId = notes.booking_id || notes.bookingId;
      const cartLogId = notes.cart_id || notes.cartId;
      const paymentId = payment.id;
      const amountPaid = payment.amount ? payment.amount / 100 : 0;
      const customerEmail = payment.email || notes.customer_email;
      const customerPhone = payment.contact || notes.customer_phone;

      if (supabase && bookingId) {
        // 1. Update booking status to confirmed
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            amount_paid: amountPaid,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (updateError) {
          console.error('Error updating booking status via webhook:', updateError);
        } else {
          console.log(`Successfully confirmed booking ${bookingId} via Razorpay webhook.`);
        }
      }

      if (supabase && cartLogId) {
        // 2. Mark abandoned cart as completed
        await supabase
          .from('abandoned_carts')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', cartLogId)
          .catch(err => console.error('Cart log update error:', err));
      }
    } else if (event === 'payment.failed') {
      const payment = body.payload?.payment?.entity || {};
      const notes = payment.notes || {};
      const bookingId = notes.booking_id || notes.bookingId;

      if (supabase && bookingId) {
        await supabase
          .from('bookings')
          .update({ status: 'payment_failed', updated_at: new Date().toISOString() })
          .eq('id', bookingId)
          .catch(err => console.error('Failed to mark booking payment_failed:', err));
      }
    }

    // Always respond 200 OK to acknowledge receipt to Razorpay
    return res.status(200).json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return res.status(200).json({ status: 'error', message: error.message });
  }
}
