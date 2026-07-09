// api/send-booking-whatsapp.js
// Vercel Serverless Function to send WhatsApp notifications and Gmail Alerts
import nodemailer from 'nodemailer';

const ADMIN_PHONE = "918630027341"; // TripGod Admin Number

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "EAAVjnkkrc1ABR0CzprLuR7dFOZClD3yfQ2vhZC39tQjAI7PLL1ZCRSEzc9ZCDZCwxoDZBh6G4N2SafXr4a1KQQtZBJMh1ypMXxB2wZBPoufA83MjR5xdr4yOVEaptkvdgZBnPOxkVM5cP5HlNiI51brQi305GkVegMR67AVjZAMCPZBytCvUqPCcbQZB5OeBxcVi6wZDZD";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || "1242547802272575";

// Helper to format phone number to E.164 (without plus sign) for UltraMsg
function formatPhone(phone) {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, ''); // Keep only digits
  if (digits.length === 10) {
    return "91" + digits; // Add India country code if 10 digits
  }
  return digits;
}

function formatDisplayPhone(phone) {
  if (!phone) return "";
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.substring(0, 5)} ${clean.substring(5)}`;
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+91 ${clean.substring(2, 7)} ${clean.substring(7)}`;
  }
  if (clean.startsWith('91') && clean.length > 2) {
    return `+91 ${clean.substring(2)}`;
  }
  return `+${clean}`;
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
  rafting: "918630027341",
  bungee: "918630027341",
  camping: "918630027341",
  bikerent: "918630027341",
  zipline: "918630027341",
  paragliding: "918630027341",
  swing: "918630027341",
  pickup: "918630027341",
  hotels: "918630027341"
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
    
    const getSimpleBookingId = (id) => {
      if (!id || id === 'N/A') return 'TG-000000';
      if (id.includes('-') || id.length >= 32) {
        const cleanHex = id.replace(/-/g, '').substring(0, 8);
        const num = parseInt(cleanHex, 16);
        if (!isNaN(num)) {
          return `TG-${String(num).slice(-6)}`;
        }
      }
      const cleanStr = id.replace(/[^a-zA-Z0-9]/g, '');
      let hash = 0;
      for (let i = 0; i < cleanStr.length; i++) {
        hash = (hash << 5) - hash + cleanStr.charCodeAt(i);
        hash = hash & hash;
      }
      return `TG-${String(Math.abs(hash)).slice(-6)}`;
    };
    const simpleBookingCode = getSimpleBookingId(paymentId);
    
    const category = data.category || "rafting";
    
    const locationLink = LOCATION_MAPS[category] || LOCATION_MAPS.rafting;
    const agencyPhone = formatPhone(data.operatorPhone || AGENCY_PHONES[category] || ADMIN_PHONE);

    const paymentOption = data.paymentOption || (totalPrice > 0 && remainingPaid === 0 ? 'full' : 'advance');
    const upiDiscount = Number(data.upiDiscount || 0);
    const commissionPercentage = Number(data.commissionPercentage || 10);

    const isFullPayment = paymentOption === 'full' || remainingPaid <= 0;
    const pctPaid = isFullPayment ? 100 : commissionPercentage;
    const remainingPct = 100 - pctPaid;

    const checkInDate = data.checkInDate || "";
    const checkOutDate = data.checkOutDate || "";
    const nights = data.nights || "";

    const isHotel = category === 'hotels';
    const paramDate = isHotel && checkInDate ? checkInDate.split('-').reverse().join('/') : date;
    const paramTime = isHotel && checkOutDate ? checkOutDate.split('-').reverse().join('/') : slot;
    
    const paramDetails = isHotel 
      ? `${guests} Guest(s), ${nights} Night(s) [Room: ${slot}]` 
      : `${guests} ${unitLabel}`;

    const cleanAgencyPhone = formatPhone(data.operatorPhone || AGENCY_PHONES[category] || ADMIN_PHONE);

    // Dynamic Parameter Mappings for Meta WhatsApp API:

    // 1. Customer Parameters
    const customerParams = [
      `*${simpleBookingCode}*`,                                                // {{1}}
      `*${customerName}*`,                                                     // {{2}}
      `*${activityName}${stretch ? ` (${stretch})` : ''}*`,                    // {{3}}
      `*${paramDate}*`,                                                        // {{4}}
      `*${paramTime}*`,                                                        // {{5}}
      `*${guests}* Guest${guests > 1 ? 's' : ''}${isHotel ? `, *${nights}* Night${nights > 1 ? 's' : ''} (${slot.split(' (')[0]})` : ''}`, // {{6}}
      locationLink,                                                            // {{7}}
      `*${formatDisplayPhone(data.operatorPhone || AGENCY_PHONES[category] || ADMIN_PHONE)}*`, // {{8}}
      isFullPayment 
        ? `Paid: *₹${totalPrice.toLocaleString('en-IN')}* (100% Full Online)`
        : `Paid: *₹${advancePaid.toLocaleString('en-IN')}* | Bal: *₹${remainingPaid.toLocaleString('en-IN')}* (Pay at venue)`, // {{9}}
      `*Confirmed!* Have a great time! 🌟`                                     // {{10}}
    ];

    // 2. Vendor Parameters
    const vendorParams = [
      `*${simpleBookingCode}*`,                                                // {{1}}
      `*${customerName}* (${formatDisplayPhone(customerPhone)})`,              // {{2}}
      `*${activityName}${stretch ? ` (${stretch})` : ''}*`,                    // {{3}}
      `*${paramDate}*`,                                                        // {{4}}
      `*${paramTime}*`,                                                        // {{5}}
      `*${guests}* Guest${guests > 1 ? 's' : ''}${isHotel ? `, *${nights}* Night${nights > 1 ? 's' : ''} (${slot.split(' (')[0]})` : ''}`, // {{6}}
      locationLink,                                                            // {{7}}
      `*${formatDisplayPhone(ADMIN_PHONE)}* (TripGod Support)`,                 // {{8}}
      isFullPayment 
        ? `Paid Online: *₹${totalPrice.toLocaleString('en-IN')}* (100% Full Payment)`
        : `Paid Online: *₹${advancePaid.toLocaleString('en-IN')}* | Collect: *₹${remainingPaid.toLocaleString('en-IN')}* at venue`, // {{9}}
      `*New Booking Alert!* Please provide premium service.`                  // {{10}}
    ];

    // 3. Admin Parameters
    const adminParams = [
      `*${simpleBookingCode}*`,                                                // {{1}}
      `*${customerName}* (${formatDisplayPhone(customerPhone)})`,              // {{2}}
      `*${activityName}${stretch ? ` (${stretch})` : ''}*`,                    // {{3}}
      `*${paramDate}*`,                                                        // {{4}}
      `*${paramTime}*`,                                                        // {{5}}
      `*${guests}* Guest${guests > 1 ? 's' : ''}${isHotel ? `, *${nights}* Night${nights > 1 ? 's' : ''} (${slot.split(' (')[0]})` : ''}`, // {{6}}
      locationLink,                                                            // {{7}}
      `*${formatDisplayPhone(data.operatorPhone || AGENCY_PHONES[category] || ADMIN_PHONE)}* (Operator)`, // {{8}}
      isFullPayment 
        ? `Paid Online: *₹${totalPrice.toLocaleString('en-IN')}* (100% Full Payment)`
        : `Paid Online: *₹${advancePaid.toLocaleString('en-IN')}* | Balance: *₹${remainingPaid.toLocaleString('en-IN')}* (Razorpay ID: ${paymentId})`, // {{9}}
      `*New Booking Alert* - Have a great time!`                               // {{10}}
    ];

    // Helper to send message using Meta Cloud API
    const sendWhatsAppMeta = async (to, parameters) => {
      const cleanTo = to.replace(/\D/g, ''); 
      if (!cleanTo) return null;

      const url = `https://graph.facebook.com/v20.0/${META_PHONE_NUMBER_ID}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        to: cleanTo,
        type: "template",
        template: {
          name: "booking_alert",
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: parameters.map(p => ({
                type: "text",
                text: String(p).substring(0, 1024)
              }))
            }
          ]
        }
      };

      console.log(`Sending Meta WhatsApp template to ${cleanTo}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      console.log(`Meta API response for ${cleanTo}:`, result);
      return result;
    };

    // Send notifications in parallel
    const promises = [];
    
    // 1. Send to Customer
    if (customerPhone) {
      promises.push(sendWhatsAppMeta(customerPhone, customerParams).catch(err => console.error("Error sending to customer:", err)));
    }
    
    // 2. Send to Admin
    promises.push(sendWhatsAppMeta(ADMIN_PHONE, adminParams).catch(err => console.error("Error sending to admin:", err)));
    
    // 3. Send to Agency/Vendor
    if (cleanAgencyPhone && cleanAgencyPhone !== ADMIN_PHONE) {
      promises.push(sendWhatsAppMeta(cleanAgencyPhone, vendorParams).catch(err => console.error("Error sending to agency:", err)));
    }

    // 4. Send Gmail Alerts (to Admin and Customer) via Nodemailer
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
      paymentId,
      locationLink,
      agencyPhone
    }).catch(err => console.error("Error sending booking alert email:", err)));

    await Promise.all(promises);

    return res.status(200).json({ success: true, message: 'Notifications sent successfully' });

  } catch (error) {
    console.error('WhatsApp Notification API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
// Helper to send email notifications using SMTP (Gmail or Hostinger) via Nodemailer
async function sendEmailAlert(data) {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;
  
  if (!smtpUser || !smtpPass) {
    console.log("SMTP credentials (SMTP_USER / SMTP_PASS) not set. Skipping email notifications.");
    return null;
  }

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "465");
  const smtpSecure = smtpPort === 465; // true for 465 (SSL), false for 587 (TLS)

  const notificationEmail = process.env.NOTIFICATION_EMAIL || smtpUser;

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  const isBikeRent = data.category === 'bikerent';
  const unitLabel = isBikeRent ? 'Vehicle(s)' : 'Person(s)';

  const getSimpleBookingId = (id) => {
    if (!id || id === 'N/A') return 'TG-000000';
    if (id.includes('-') || id.length >= 32) {
      const cleanHex = id.replace(/-/g, '').substring(0, 8);
      const num = parseInt(cleanHex, 16);
      if (!isNaN(num)) {
        return `TG-${String(num).slice(-6)}`;
      }
    }
    const cleanStr = id.replace(/[^a-zA-Z0-9]/g, '');
    let hash = 0;
    for (let i = 0; i < cleanStr.length; i++) {
      hash = (hash << 5) - hash + cleanStr.charCodeAt(i);
      hash = hash & hash;
    }
    return `TG-${String(Math.abs(hash)).slice(-6)}`;
  };
  const simpleBookingCode = getSimpleBookingId(data.paymentId);

  const paymentOption = data.paymentOption || (data.totalPrice > 0 && data.remainingPaid === 0 ? 'full' : 'advance');
  const upiDiscount = Number(data.upiDiscount || 0);
  const commissionPercentage = Number(data.commissionPercentage || 10);

  const isFullPayment = paymentOption === 'full' || data.remainingPaid <= 0;
  const pctPaid = isFullPayment ? 100 : commissionPercentage;
  const remainingPct = 100 - pctPaid;

  // --- Email 1: To Customer (Booking Confirmation / Ticket) ---
  const customerMailOptions = {
    from: `"TripGod" <${smtpUser}>`,
    to: data.customerEmail,
    subject: `🎟️ TripGod Booking Confirmed! - ${data.activityName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff; color: #333333; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0F172A; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1.5px;">TRIP<span style="background: #FF6B00; background: linear-gradient(135deg, #FF6B00 0%, #FF3D00 100%); padding: 3px 10px; border-radius: 6px; color: #ffffff; margin-left: 4px;">GOD</span></h1>
          <p style="color: #666; font-size: 14px; margin-top: 5px;">Rishikesh's #1 Adventure Booking Partner</p>
        </div>
        
        <div style="background-color: #FFF0E5; border-left: 4px solid #FF6B00; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
          <h3 style="color: #FF6B00; margin: 0 0 5px 0;">Booking Confirmed! 🏔️</h3>
          <p style="margin: 0; font-size: 14px; color: #555;">Hi <strong>${data.customerName}</strong>, your adventure booking is successfully confirmed. See you in Rishikesh!</p>
        </div>

        <h3 style="color: #111; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 0;">Adventure Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; width: 40%; border-bottom: 1px solid #eee;">Booking ID:</td>
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #eee; color: #FF6B00;">${simpleBookingCode}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #eee;">Activity:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${data.activityName} ${data.stretch ? `(${data.stretch})` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #eee;">Arrival Date:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${data.date}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #eee;">Arrival Slot/Time:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${data.slot}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #eee;">Total Booked:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${data.guests} ${unitLabel}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #eee;">Location:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;"><a href="${data.locationLink}" style="color: #FF6B00; font-weight: bold; text-decoration: none;">Open in Google Maps 📍</a></td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #eee;">Local Contact / Host:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">+${data.agencyPhone}</td>
          </tr>
        </table>

        <h3 style="color: #111; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px;">Payment Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; width: 40%; border-bottom: 1px solid #eee;">Total Price:</td>
            <td style="padding: 12px; font-weight: bold; color: #111; border-bottom: 1px solid #eee;">₹${data.totalPrice.toLocaleString('en-IN')}</td>
          </tr>
          ${upiDiscount > 0 ? `
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #10B981; border-bottom: 1px solid #eee;">UPI Discount:</td>
            <td style="padding: 12px; font-weight: bold; color: #10B981; border-bottom: 1px solid #eee;">- ₹${upiDiscount.toLocaleString('en-IN')}</td>
          </tr>
          ` : ''}
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; color: green; border-bottom: 1px solid #eee;">${isFullPayment ? 'Paid Online (100%)' : `Paid Advance (${pctPaid}%)`}:</td>
            <td style="padding: 12px; font-weight: bold; color: green; border-bottom: 1px solid #eee;">₹${data.advancePaid.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #d97706; border-bottom: 1px solid #eee;">${isFullPayment ? 'Remaining Balance' : `Remaining Balance (${remainingPct}%)`}:</td>
            <td style="padding: 12px; font-weight: bold; color: #d97706; border-bottom: 1px solid #eee;">₹${data.remainingPaid.toLocaleString('en-IN')} ${isFullPayment ? '(Paid in Full)' : '(To be paid at venue)'}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #eee;">Booking Transaction ID:</td>
            <td style="padding: 12px; font-family: monospace; font-size: 13px; border-bottom: 1px solid #eee;">${data.paymentId}</td>
          </tr>
        </table>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; font-size: 12px; color: #888;">
          <p style="margin: 0 0 5px 0;">Need help? Contact TripGod Support at +91 8630027341 or reply to this email.</p>
          <p style="margin: 0;">© 2026 TripGod Rishikesh. All rights reserved.</p>
        </div>
      </div>
    `
  };

  // --- Email 2: To Admin (Booking Alert) ---
  const adminMailOptions = {
    from: `"TripGod Alert" <${smtpUser}>`,
    to: notificationEmail,
    subject: `🔔 New Booking Alert: ${data.activityName} - ${data.customerName}`,
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
          ${upiDiscount > 0 ? `
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #10B981; border-bottom: 1px solid #eee;">UPI Discount:</td>
            <td style="padding: 10px; font-weight: bold; color: #10B981; border-bottom: 1px solid #eee;">- ₹${upiDiscount.toLocaleString('en-IN')}</td>
          </tr>
          ` : ''}
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px; font-weight: bold; color: green; border-bottom: 1px solid #eee;">${isFullPayment ? 'Paid Online (100%)' : `Paid Advance (${pctPaid}%)`}:</td>
            <td style="padding: 10px; font-weight: bold; color: green; border-bottom: 1px solid #eee;">₹${data.advancePaid.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #d97706; border-bottom: 1px solid #eee;">${isFullPayment ? 'Remaining Balance' : `Remaining Balance (${remainingPct}%)`}:</td>
            <td style="padding: 10px; font-weight: bold; color: #d97706; border-bottom: 1px solid #eee;">₹${data.remainingPaid.toLocaleString('en-IN')}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Razorpay Payment ID:</td>
            <td style="padding: 10px; font-family: monospace; font-size: 13px; border-bottom: 1px solid #eee;">${data.paymentId}</td>
          </tr>
        </table>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #FFF0E5; border-left: 4px solid #FF6B00; border-radius: 4px; font-size: 12px; color: #555;">
          <strong>TipGod Operator Helpdesk Alert:</strong> Please ensure the client slot is reserved with the local guide/agency.
        </div>
      </div>
    `
  };

  const mailPromises = [];
  
  // 1. Send confirmation ticket to customer
  if (data.customerEmail && data.customerEmail !== "N/A" && data.customerEmail.includes('@')) {
    console.log(`Sending customer booking ticket to ${data.customerEmail}...`);
    mailPromises.push(transporter.sendMail(customerMailOptions).catch(err => console.error("Error sending email to customer:", err)));
  }

  // 2. Send booking alert to admin
  console.log(`Sending admin booking alert to ${notificationEmail}...`);
  mailPromises.push(transporter.sendMail(adminMailOptions).catch(err => console.error("Error sending email to admin:", err)));

  return Promise.all(mailPromises);
}
