// api/create-razorpay-order.js
// Vercel Serverless Function to create a Razorpay Order with mandatory auto-capture (payment_capture: 1)

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
    const { amount, currency = 'INR', notes = {}, receipt } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const keyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_live_TAd3hYpU1J84mE';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || '';

    if (!keySecret) {
      console.warn('RAZORPAY_KEY_SECRET missing in server environment.');
      return res.status(200).json({ 
        success: false, 
        fallback: true,
        message: 'RAZORPAY_KEY_SECRET not configured in server environment' 
      });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const amountInPaise = Math.round(Number(amount));

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        payment_capture: 1, // Mandatory Auto-Capture
        receipt: receipt || `receipt_${Date.now()}`,
        notes
      })
    });

    const data = await response.json();

    if (response.ok && data.id) {
      return res.status(200).json({
        success: true,
        order_id: data.id,
        order: data
      });
    } else {
      console.error('Razorpay Orders API error:', data);
      return res.status(500).json({
        success: false,
        error: data.error?.description || 'Failed to create Razorpay Order'
      });
    }
  } catch (err) {
    console.error('Create Razorpay Order Server Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
