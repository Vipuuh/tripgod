// api/send-booking-whatsapp.js
// Vercel Serverless Function to send WhatsApp notifications and Gmail Alerts
import nodemailer from 'nodemailer';

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
⏰ *Date:* ${date}
⏰ *Time/Slot:* ${slot}
👥 *Guests:* ${guests} ${unitLabel}

📍 *Pickup / Activity Location (Google Maps):*
${locationLink}

📞 *Operator Helpdesk:* +${agencyPhone}

💵 *Total Amount:* ₹${totalPrice.toLocaleString('en-IN')}
✅ *Paid Advance (10%):* ₹${advancePaid.toLocaleString('en-IN')}
⏳ *Remaining Balance (90%):* ₹${remainingPaid.toLocaleString('en-IN')}

_Thank you for booking with TripGod! See you in Rishikesh!_`;

    // --- Message 2: To Agency/Vendor ---
    const agencyMsg = `*New Booking from TripGod!* ⚡

Hi Team, a new client has booked your service via TripGod. Please reserve the slot:

🎒 *Activity:* ${activityName} ${stretch ? `(${stretch})` : ''}
👤 *Customer Name:* ${customerName}
📞 *Customer Phone:* +${customerPhone}
⏰ *Arrival Date:* ${date}
⏰ *Arrival Time:* ${slot}
👥 *Total Booked:* ${guests} ${unitLabel}

💵 *Total Amount:* ₹${totalPrice.toLocaleString('en-IN')}
✅ *Paid Advance (10%):* ₹${advancePaid.toLocaleString('en-IN')}
⏳ *Remaining Balance (90%):* ₹${remainingPaid.toLocaleString('en-IN')} (To be collected from customer)

🔒 *Booking Status:* 10% Advance Paid (TripGod ID: ${paymentId})

_Please ensure premium service. Thank you!_`;

    // --- Message 3: To Admin (Aapke Personal Number Par Alert) ---
    const adminMsg = `*TripGod Booking Alert!* 🔔

New booking completed successfully:

- 🎒 *Activity:* ${activityName}
- 👤 *Customer:* ${customerName} (+${customerPhone})
- ⏰ *Date:* ${date}
- ⏰ *Slot/Time:* ${slot}
- 💵 *Total Price:* ₹${totalPrice.toLocaleString('en-IN')}
- ✅ *Paid Advance (10%):* ₹${advancePaid.toLocaleString('en-IN')}
- ⏳ *Remaining Balance (90%):* ₹${remainingPaid.toLocaleString('en-IN')}
- 🔑 *Razorpay ID:* ${paymentId}`;

    // Helper to send message using UltraMsg
    const sendWhatsApp = async (to, body) => {
      const url = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`;
      const payload = {
        token: ULTRAMSG_TOKEN,
        to: to,
        body: body,
        priority: 10
      };

      console.log(`Sending WhatsApp message to ${to}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(payload).toString()
      });
      
      const result = await response.json();
      console.log(`UltraMsg response for ${to}:`, result);
      return result;
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

    // 4. Send Gmail Alert to Admin/Vendor via Nodemailer
    promises.push(sendEmailAlert({
      activityName,
      stretch,
      customerName,
      customerEmail,
      customerPhone,
      date,
      slot,
      guests,
      category,
      totalPrice,
      advancePaid,
      remainingPaid,
      paymentId
    }).catch(err => console.error("Error sending booking alert email:", err)));

    await Promise.all(promises);

    return res.status(200).json({ success: true, message: 'Notifications sent successfully' });

  } catch (error) {
    console.error('WhatsApp Notification API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Helper to send email notification using Gmail SMTP via Nodemailer
async function sendEmailAlert(data) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;
  
  if (!gmailUser || !gmailPass) {
    console.log("Gmail credentials (GMAIL_USER / GMAIL_PASS) not set. Skipping email notification.");
    return null;
  }

  const notificationEmail = process.env.NOTIFICATION_EMAIL || gmailUser;

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass
    }
  });

  const isBikeRent = data.category === 'bikerent';
  const unitLabel = isBikeRent ? 'Vehicle(s)' : 'Person(s)';

  const mailOptions = {
    from: `"TripGod Booking Alert" <${gmailUser}>`,
    to: notificationEmail,
    subject: `🔔 New TripGod Booking: ${data.activityName} - ${data.customerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff; color: #333333;">
        <h2 style="color: #FF6B00; margin-top: 0; border-bottom: 2px solid #FF6B00; padding-bottom: 10px;">New Booking Confirmed! 🏔️</h2>
        <p>A new customer booking has been completed successfully via TripGod. Here are the details:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px; font-weight: bold; width: 40%; border-bottom: 1px solid #eee;">Activity:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.activityName} ${data.stretch ? `(${data.stretch})` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Customer Name:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.customerName}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Customer Email:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Customer Phone:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">+${data.customerPhone}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Arrival Date:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Arrival Time/Slot:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.slot}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Total Booked:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.guests} ${unitLabel}</td>
          </tr>
        </table>
        
        <h3 style="color: #111; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 25px;">Payment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px; font-weight: bold; width: 40%; border-bottom: 1px solid #eee;">Total Amount:</td>
            <td style="padding: 10px; font-weight: bold; color: #111; border-bottom: 1px solid #eee;">₹${data.totalPrice.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: green; border-bottom: 1px solid #eee;">Paid Advance (10%):</td>
            <td style="padding: 10px; font-weight: bold; color: green; border-bottom: 1px solid #eee;">₹${data.advancePaid.toLocaleString('en-IN')}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px; font-weight: bold; color: #d97706; border-bottom: 1px solid #eee;">Remaining Balance (90%):</td>
            <td style="padding: 10px; font-weight: bold; color: #d97706; border-bottom: 1px solid #eee;">₹${data.remainingPaid.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Razorpay Payment ID:</td>
            <td style="padding: 10px; font-family: monospace; font-size: 13px;">${data.paymentId}</td>
          </tr>
        </table>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #FFF0E5; border-left: 4px solid #FF6B00; border-radius: 4px; font-size: 12px; color: #555;">
          <strong>TipGod Operator Helpdesk Alert:</strong> Please ensure the client slot is reserved with the local guide/agency.
        </div>
      </div>
    `
  };

  console.log(`Sending booking alert email to ${notificationEmail}...`);
  return transporter.sendMail(mailOptions);
}
