// api/send-booking-whatsapp.js
// Vercel Serverless Function to send WhatsApp notifications via UltraMsg

const ULTRAMSG_INSTANCE = "instance180883";
const ULTRAMSG_TOKEN = "dl5l1lya95t54rtt";
const ADMIN_PHONE = "919837371137"; // TripGod Admin Number

// Helper to format phone number to E.164 (without plus sign) for UltraMsg
function formatPhone(phone) {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, ''); // Keep only digits
  if (digits.length === 10) {
    return "91" + digits; // Add India country code if 10 digits
  }
  return digits;
}

// Mapping of categories to Location links
const LOCATION_MAPS = {
  rafting: "https://maps.app.goo.gl/81zn6x9SS9pDg6bF7",
  bungee: "https://maps.google.com/?q=Shivpuri+Bungee+Jumping+Rishikesh",
  camping: "https://maps.google.com/?q=Shivpuri+Riverside+Camping+Rishikesh",
  bikerent: "https://maps.google.com/?q=Laxman+Jhula+Bike+Rental+Rishikesh",
  zipline: "https://maps.google.com/?q=Shivpuri+Zipline+Rishikesh",
  paragliding: "https://maps.google.com/?q=Rishikesh+Paragliding+Landing+Site",
  swing: "https://maps.google.com/?q=Shivpuri+Giant+Swing+Rishikesh",
  pickup: "https://maps.google.com/?q=Rishikesh+Railway+Station",
  hotels: "https://maps.google.com/?q=Ganga+View+Hotels+Rishikesh"
};

// Mapping of categories to Agency/Vendor Phone numbers
const AGENCY_PHONES = {
  rafting: "918630027341", // Testing agency number
  bungee: "919837371137",
  camping: "919837371137",
  bikerent: "919837371137",
  zipline: "919837371137",
  paragliding: "919837371137",
  swing: "919837371137",
  pickup: "919837371137",
  hotels: "919837371137"
};

export default async function handler(req, res) {
  // CORS Headers
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
    const data = req.body;
    
    // Extract variables
    const customerName = data.name || "Customer";
    const customerEmail = data.email || "N/A";
    const customerPhoneRaw = data.phone || "";
    const customerPhone = formatPhone(customerPhoneRaw);
    
    const activityName = data.activityName || "Rishikesh Experience";
    const stretch = data.stretch || "";
    const date = data.date || "";
    const slot = data.slot || "";
    const guests = data.guests || 1;
    const isBikeRent = data.category === 'bikerent';
    const unitLabel = isBikeRent ? 'Vehicle(s)' : 'Person(s)';
    
    const totalPrice = data.totalPrice || 0;
    const advancePaid = data.advancePaid || 0;
    const remainingPaid = data.remainingPaid || 0;
    const paymentId = data.paymentId || "N/A";
    
    const category = data.category || "rafting";
    
    const locationLink = LOCATION_MAPS[category] || LOCATION_MAPS.rafting;
    const agencyPhone = formatPhone(AGENCY_PHONES[category] || ADMIN_PHONE);

    // --- Message 1: To Customer ---
    const customerMsg = `*TripGod Booking Confirmed!* 🏔️
    
Hi *${customerName}*, your booking is confirmed!

🎒 *Activity:* ${activityName} ${stretch ? `(${stretch})` : ''}
📅 *Date & Time:* ${date} at ${slot}
👥 *${isBikeRent ? 'Vehicles' : 'Guests'}:* ${guests} ${unitLabel}

📍 *Pickup / Activity Location (Google Maps):*
${locationLink}

📞 *Operator Helpdesk:* +${agencyPhone}
🔒 *10% Paid Advance:* ₹${advancePaid.toLocaleString('en-IN')}
💰 *Pay at Rishikesh (90%):* ₹${remainingPaid.toLocaleString('en-IN')}

_Thank you for booking with TripGod! See you in Rishikesh!_`;

    // --- Message 2: To Agency/Vendor ---
    const agencyMsg = `*New Booking from TripGod!* ⚡

Hi Team, a new client has booked your service via TripGod. Please reserve the slot:

👤 *Customer Name:* ${customerName}
📞 *Customer Phone:* +${customerPhone}
📅 *Arrival Date & Time:* ${date} at ${slot}
👥 *Total Booked:* ${guests} ${unitLabel}
🔒 *Booking Status:* 10% Advance Paid (TripGod ID: ${paymentId})

_Please ensure premium service. Thank you!_`;

    // --- Message 3: To Admin (Aapke Personal Number Par Alert) ---
    const adminMsg = `*TripGod Booking Alert!* 🔔

New booking completed successfully:

- *Activity:* ${activityName}
- *Customer:* ${customerName} (+${customerPhone})
- *Date/Slot:* ${date} (${slot})
- *Paid Advance (10%):* ₹${advancePaid}
- *Razorpay ID:* ${paymentId}`;

    // Helper to send message using UltraMsg
    const sendWhatsApp = async (to, body) => {
      const url = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`;
      const payload = {
        token: ULTRAMSG_TOKEN,
        to: to,
        body: body,
        priority: 10
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(payload)
      });
      return response.json();
    };

    // Send notifications in parallel
    const promises = [];
    
    // 1. Send to Customer
    if (customerPhone) {
      promises.push(sendWhatsApp(customerPhone, customerMsg).catch(err => console.error("Error sending to customer:", err)));
    }
    
    // 2. Send to Admin
    promises.push(sendWhatsApp(ADMIN_PHONE, adminMsg).catch(err => console.error("Error sending to admin:", err)));
    
    // 3. Send to Agency (if different from Admin)
    if (agencyPhone && agencyPhone !== ADMIN_PHONE) {
      promises.push(sendWhatsApp(agencyPhone, agencyMsg).catch(err => console.error("Error sending to agency:", err)));
    }

    await Promise.all(promises);

    return res.status(200).json({ success: true, message: 'Notifications sent successfully' });

  } catch (error) {
    console.error('WhatsApp Notification API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
