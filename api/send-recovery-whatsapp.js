// api/send-recovery-whatsapp.js
// Vercel Serverless Function to send cart recovery alerts to customers

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "EAAVjnkkrc1ABR0CzprLuR7dFOZClD3yfQ2vhZC39tQjAI7PLL1ZCRSEzc9ZCDZCwxoDZBh6G4N2SafXr4a1KQQtZBJMh1ypMXxB2wZBPoufA83MjR5xdr4yOVEaptkvdgZBnPOxkVM5cP5HlNiI51brQi305GkVegMR67AVjZAMCPZBytCvUqPCcbQZB5OeBxcVi6wZDZD";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || "1242547802272575";

function formatPhone(phone) {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, ''); // Keep only digits
  if (digits.length === 10) {
    return "91" + digits; // Add India country code if 10 digits
  }
  return digits;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, name, cartItems, cartId } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanPhone = formatPhone(phone);
    const customerName = name || "Customer";

    // Format cartItems list to a readable text summary
    let packagesText = "Adventure Booking";
    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      packagesText = cartItems.map(item => item.name || item.title || 'Adventure tour').join(', ');
    }

    if (packagesText.length > 150) {
      packagesText = packagesText.substring(0, 147) + "...";
    }

    const variableUrlPart = `cart?recover=${cartId}`;
    const textCheckoutLink = `https://tripgod.in/${variableUrlPart}`;
    const textSupportLink = `https://wa.me/918630027341`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "template",
      template: {
        name: "cart_recovery_alert",
        language: {
          code: "en"
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: customerName }, // {{1}}
              { type: "text", text: packagesText }, // {{2}}
              { type: "text", text: textCheckoutLink }, // {{3}}
              { type: "text", text: textSupportLink } // {{4}}
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              { type: "text", text: variableUrlPart } // dynamic url part for CTA button
            ]
          }
        ]
      }
    };

    console.log("Sending Meta WhatsApp Recovery payload:", JSON.stringify(payload));

    const metaResponse = await fetch(
      `https://graph.facebook.com/v19.0/${META_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error("Meta API error response:", result);
      return res.status(metaResponse.status).json({
        success: false,
        error: result.error?.message || "Meta API request failed"
      });
    }

    return res.status(200).json({ success: true, messageId: result.messages?.[0]?.id });

  } catch (err) {
    console.error("Fatal WhatsApp Recovery Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
