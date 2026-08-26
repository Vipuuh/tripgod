// api/capture-razorpay-payment.js
// Vercel Serverless Function to immediately capture a Razorpay payment on completion

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { payment_id, amount, currency = 'INR' } = req.body;

    if (!payment_id) {
      return res.status(400).json({ error: 'Missing payment_id' });
    }

    const keyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_live_TAd3hYpU1J84mE';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || '';

    if (!keySecret) {
      console.warn('RAZORPAY_KEY_SECRET missing in server environment.');
      return res.status(200).json({ 
        success: false, 
        message: 'RAZORPAY_KEY_SECRET not configured' 
      });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const amountInPaise = amount ? Math.round(Number(amount)) : undefined;

    const captureBody = { currency };
    if (amountInPaise) {
      captureBody.amount = amountInPaise;
    }

    const response = await fetch(`https://api.razorpay.com/v1/payments/${payment_id}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(captureBody)
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({
        success: true,
        payment: data
      });
    } else {
      console.error('Razorpay Capture API error:', data);
      return res.status(200).json({
        success: false,
        error: data.error?.description || 'Failed to capture payment'
      });
    }
  } catch (err) {
    console.error('Capture Razorpay Payment Server Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
