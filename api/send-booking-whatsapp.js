// api/send-booking-whatsapp.js
// Vercel Serverless Function to send WhatsApp notifications and Gmail Alerts
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const ADMIN_PHONE = "919410572857"; // TripGod Admin Number

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "EAAVjnkkrc1ABR0CzprLuR7dFOZClD3yfQ2vhZC39tQjAI7PLL1ZCRSEzc9ZCDZCwxoDZBh6G4N2SafXr4a1KQQtZBJMh1ypMXxB2wZBPoufA83MjR5xdr4yOVEaptkvdgZBnPOxkVM5cP5HlNiI51brQi305GkVegMR67AVjZAMCPZBytCvUqPCcbQZB5OeBxcVi6wZDZD";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || "1242547802272575";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) 
  : null;

// Helper to format phone number to E.164 (without plus sign)
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
  rafting: "919410572857",
  bungee: "919410572857",
  camping: "919410572857",
  bikerent: "919410572857",
  zipline: "919410572857",
  paragliding: "919410572857",
  swing: "919410572857",
  pickup: "919410572857",
  hotels: "919410572857"
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
    const isHotel = category === 'hotels';

    // Extract items array for combo bookings
    const comboItems = Array.isArray(data.items) ? data.items : [];
    const isCombo = category === 'combo' || data.type === 'custom_combo' || comboItems.length > 0;

    // Generate Digital Ticket Web URL
    const ticketUrl = `https://tripgod.in/ticket/${simpleBookingCode}`;

    // Helper to format 1 or 2 vendor phone numbers
    const formatVendorPhoneDisplay = (item) => {
      const phones = [];
      const addPh = (p) => {
        if (!p) return;
        const clean = p.toString().replace(/\D/g, '');
        if (clean.length >= 10 && !phones.includes(clean)) phones.push(clean);
      };
      if (item) {
        addPh(item.operatorPhone);
        addPh(item.phone_number || item.phone);
        addPh(item.whatsapp_number || item.whatsapp);
        addPh(item.secondary_phone);
        if (item.vendors) {
          addPh(item.vendors.phone);
          addPh(item.vendors.whatsapp);
        }
      }
      if (phones.length === 0) addPh(data.operatorPhone);
      if (phones.length === 0) addPh(ADMIN_PHONE);

      return phones.map(p => formatDisplayPhone(p)).join(' / ');
    };

    // Auto-resolve operator/hotel/vendor WhatsApp number from DB if needed
    let rawOperatorPhone = data.operatorPhone;
    if ((!rawOperatorPhone || rawOperatorPhone === ADMIN_PHONE || rawOperatorPhone.endsWith('9410572857')) && supabase) {
      try {
        if (isHotel && activityName) {
          const cleanHotelName = activityName.replace(/ - .*/, '').trim();
          const { data: hotelRow } = await supabase
            .from('hotels')
            .select('whatsapp_number, phone_number, vendors(whatsapp, phone)')
            .ilike('name', `%${cleanHotelName}%`)
            .limit(1)
            .maybeSingle();
          if (hotelRow) {
            rawOperatorPhone = hotelRow.whatsapp_number || hotelRow.vendors?.whatsapp || hotelRow.vendors?.phone || hotelRow.phone_number;
          }
        }
        if ((!rawOperatorPhone || rawOperatorPhone.endsWith('9410572857')) && data.vendor_id) {
          const { data: vendorRow } = await supabase
            .from('vendors')
            .select('whatsapp, phone')
            .eq('id', data.vendor_id)
            .maybeSingle();
          if (vendorRow) {
            rawOperatorPhone = vendorRow.whatsapp || vendorRow.phone;
          }
        }
      } catch (dbErr) {
        console.error('Error auto-resolving vendor phone from Supabase DB:', dbErr);
      }
    }

    const locationLink = LOCATION_MAPS[category] || LOCATION_MAPS.hotels || "https://tripgod.in";

    const paymentOption = data.paymentOption || (totalPrice > 0 && remainingPaid === 0 ? 'full' : 'advance');
    const isFullPayment = paymentOption === 'full' || remainingPaid <= 0;

    const checkInDate = data.checkInDate || "";
    const checkOutDate = data.checkOutDate || "";
    const nights = data.nights || "";

    const paramDate = isHotel && checkInDate ? checkInDate.split('-').reverse().join('/') : date;
    const paramTime = isHotel && checkOutDate ? checkOutDate.split('-').reverse().join('/') : slot;

    // Parameters for approved tripgod_pass_confirmed template (9 parameters):
    const customerPassParams = [
      customerName,                                                            // {{1}} - Name
      `*${simpleBookingCode}*`,                                                // {{2}} - Booking ID
      `*${activityName}${stretch ? ` (${stretch})` : ''}*`,                    // {{3}} - Your Trip
      `*${paramDate}*`,                                                        // {{4}} - Check-in / Date
      `*${paramTime}*`,                                                        // {{5}} - Check-out / Slot
      `*${guests}* Guest${guests > 1 ? 's' : ''}${isHotel ? `, *${nights}* Night${nights > 1 ? 's' : ''} (${slot.split(' (')[0]})` : ''}`, // {{6}} - Details
      ticketUrl,                                                               // {{7}} - Ticket Pass Link
      isFullPayment 
        ? `Paid: *₹${totalPrice.toLocaleString('en-IN')}* (100% Full Online)`
        : `Paid: *₹${advancePaid.toLocaleString('en-IN')}* | Bal: *₹${remainingPaid.toLocaleString('en-IN')}* (Pay at venue)`, // {{8}} - Payment
      `*${formatDisplayPhone(cleanAgencyPhone || ADMIN_PHONE)}*`               // {{9}} - Helpline Contact
    ];

    // Fallback Customer Parameters for tripgod_booking_confirmed template (10 parameters):
    const customerParams = [
      customerName,                                                            // {{1}} - Name
      `*${simpleBookingCode}*`,                                                // {{2}} - Booking ID
      `*${activityName}${stretch ? ` (${stretch})` : ''}*`,                    // {{3}} - Your Trip
      `*${paramDate}*`,                                                        // {{4}} - Check-in / Date
      `*${paramTime}*`,                                                        // {{5}} - Check-out / Slot
      `*${guests}* Guest${guests > 1 ? 's' : ''}${isHotel ? `, *${nights}* Night${nights > 1 ? 's' : ''} (${slot.split(' (')[0]})` : ''}`, // {{6}} - Details
      ticketUrl,                                                               // {{7}} - Ticket Pass Link
      isFullPayment 
        ? `Paid: *₹${totalPrice.toLocaleString('en-IN')}* (100% Full Online)`
        : `Paid: *₹${advancePaid.toLocaleString('en-IN')}* | Bal: *₹${remainingPaid.toLocaleString('en-IN')}* (Pay at venue)`, // {{8}} - Payment
      `*Confirmed!*`,                                                          // {{9}} - Status
      `*${formatDisplayPhone(cleanAgencyPhone || ADMIN_PHONE)}*`               // {{10}} - Helpline Contact
    ];

    // 2. Vendor Parameters (formatted for approved tripgod_booking_confirmed template)
    const vendorParamsConfirmed = [
      `PARTNER ALERT: ${customerName}`,                                       // {{1}} - Vendor Header
      `*${simpleBookingCode}*`,                                                // {{2}} - Booking ID
      `*${activityName}${stretch ? ` (${stretch})` : ''}*`,                    // {{3}} - Trip/Hotel
      `*${paramDate}*`,                                                        // {{4}} - Date
      `*${paramTime}*`,                                                        // {{5}} - Slot/Time
      `*${guests}* Guest${guests > 1 ? 's' : ''}${isHotel ? `, *${nights}* Night${nights > 1 ? 's' : ''} (${slot.split(' (')[0]})` : ''}`, // {{6}} - Details
      locationLink,                                                            // {{7}} - Location
      isFullPayment 
        ? `Paid Online: *₹${totalPrice.toLocaleString('en-IN')}* (100% Full Payment)`
        : `Paid Online: *₹${advancePaid.toLocaleString('en-IN')}* | Collect: *₹${remainingPaid.toLocaleString('en-IN')}* at venue`, // {{8}} - Payment
      `*NEW BOOKING ALERT!*`,                                                 // {{9}} - Alert Tag
      `*Customer Contact: ${formatDisplayPhone(customerPhone)}*`              // {{10}} - Customer Contact
    ];

    // 3. Admin Parameters (formatted for approved tripgod_booking_confirmed template)
    const adminParamsConfirmed = [
      `ADMIN ALERT: ${customerName}`,                                         // {{1}} - Admin Header
      `*${simpleBookingCode}*`,                                                // {{2}} - Booking ID
      `*${activityName}${stretch ? ` (${stretch})` : ''}*`,                    // {{3}} - Trip/Hotel
      `*${paramDate}*`,                                                        // {{4}} - Date
      `*${paramTime}*`,                                                        // {{5}} - Slot/Time
      `*${guests}* Guest${guests > 1 ? 's' : ''}${isHotel ? `, *${nights}* Night${nights > 1 ? 's' : ''} (${slot.split(' (')[0]})` : ''}`, // {{6}} - Details
      locationLink,                                                            // {{7}} - Location
      isFullPayment 
        ? `Paid Online: *₹${totalPrice.toLocaleString('en-IN')}* (Full Online)`
        : `Paid Online: *₹${advancePaid.toLocaleString('en-IN')}* | Bal: *₹${remainingPaid.toLocaleString('en-IN')}* (Razorpay: ${paymentId})`, // {{8}} - Payment
      `*NEW BOOKING ALERT*`,                                                   // {{9}} - Alert Tag
      `*Operator: ${formatDisplayPhone(cleanAgencyPhone)}*`                    // {{10}} - Operator Contact
    ];

    // Helper to send message using Meta Cloud API with fallback support
    const sendWhatsAppMeta = async (to, templateName, parameters) => {
      const cleanTo = to.replace(/\D/g, ''); 
      if (!cleanTo) return null;

      const url = `https://graph.facebook.com/v20.0/${META_PHONE_NUMBER_ID}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        to: cleanTo,
        type: "template",
        template: {
          name: templateName,
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

      console.log(`Sending Meta WhatsApp template '${templateName}' to ${cleanTo}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      console.log(`Meta API response for ${cleanTo} (${templateName}):`, JSON.stringify(result));

      // If template fails and was not already tripgod_booking_confirmed, retry with tripgod_booking_confirmed
      if (result.error && templateName !== 'tripgod_booking_confirmed') {
        console.warn(`Template '${templateName}' failed for ${cleanTo}. Retrying with approved 'tripgod_booking_confirmed'...`);
        return sendWhatsAppMeta(to, 'tripgod_booking_confirmed', customerParams);
      }

      return result;
    };

    // Send notifications in parallel
    const promises = [];
    
    // 1. Send to Customer using new approved tripgod_pass_confirmed template
    if (customerPhone) {
      promises.push(sendWhatsAppMeta(customerPhone, "tripgod_pass_confirmed", customerPassParams).catch(err => console.error("Error sending to customer:", err)));
    }
    
    // 2. Send to Admin
    promises.push(sendWhatsAppMeta(ADMIN_PHONE, "tripgod_booking_confirmed", adminParamsConfirmed).catch(err => console.error("Error sending to admin:", err)));
    
    // 3. Send to Hotel / Agency / Vendor
    if (cleanAgencyPhone) {
      promises.push(sendWhatsAppMeta(cleanAgencyPhone, "tripgod_booking_confirmed", vendorParamsConfirmed).catch(err => console.error("Error sending to vendor:", err)));
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
      agencyPhone: cleanAgencyPhone
    }).catch(err => console.error("Error sending booking alert email:", err)));

    await Promise.all(promises);

    return res.status(200).json({ 
      success: true, 
      message: 'Notifications sent successfully', 
      customerPhone, 
      vendorPhone: cleanAgencyPhone 
    });

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

  let smtpHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  if (!smtpHost.includes('.') || /^\d[\d\.]*$/.test(smtpHost) || smtpHost.startsWith('0.0.')) {
    if (smtpUser.includes('@gmail.com')) {
      smtpHost = "smtp.gmail.com";
    } else if (smtpUser.includes('@zoho') || smtpUser.includes('tripgod.in')) {
      smtpHost = "smtppro.zoho.in";
    } else {
      smtpHost = "smtp.gmail.com";
    }
  }

  let smtpPort = parseInt(process.env.SMTP_PORT || "465");
  if (isNaN(smtpPort) || smtpPort === 587) {
    smtpPort = 465;
  }
  const smtpSecure = smtpPort === 465;

  const notificationEmail = process.env.NOTIFICATION_EMAIL || smtpUser;

  const transportOpts = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  };

  if (smtpHost.toLowerCase().includes('gmail')) {
    transportOpts.service = 'gmail';
  }

  // Create transporter
  const transporter = nodemailer.createTransport(transportOpts);

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

  // Build itemized breakdown HTML if combo items exist
  const comboItems = Array.isArray(data.items) ? data.items : [];
  const ticketPassUrl = `https://tripgod.in/ticket/${simpleBookingCode}`;

  let itemsHtml = '';
  if (comboItems.length > 0) {
    itemsHtml = `
      <h3 style="color: #111; margin-top: 25px; margin-bottom: 12px; font-size: 16px;">📋 Booked Services Breakdown (${comboItems.length} Items)</h3>
      ${comboItems.map((item, i) => {
        const itemMap = item.mapLink || `https://maps.google.com/?q=${encodeURIComponent((item.fullAddress || item.vendorName || item.name) + ' Rishikesh')}`;
        
        // Vendor phone extraction (handles 1 or 2 phones)
        const vPhones = [];
        const addP = (p) => {
          if (!p) return;
          const clean = p.toString().replace(/\D/g, '');
          if (clean.length >= 10 && !vPhones.includes(clean)) vPhones.push(clean);
        };
        addP(item.operatorPhone);
        addP(item.phone_number || item.phone);
        addP(item.whatsapp_number || item.whatsapp);
        addP(item.secondary_phone);
        if (item.vendors) {
          addP(item.vendors.phone);
          addP(item.vendors.whatsapp);
        }
        if (vPhones.length === 0) addP(data.agencyPhone);

        const phoneDisplayStr = vPhones.map((ph, idx) => `<a href="tel:+${ph}" style="color: #FF6B00; text-decoration: none; font-weight: bold;">+${ph}</a>`).join(' / ');

        return `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: font-black; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Item ${i + 1} • ${(item.category || 'Service').toUpperCase()}</div>
            <h4 style="margin: 4px 0 8px 0; color: #0f172a; font-size: 15px;">${item.name || item.title}</h4>
            <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
              <tr>
                <td style="padding: 3px 0;"><strong>Timing Slot:</strong> ${item.slot || item.selectedSlot || 'Flexible'}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0;"><strong>Venue / Address:</strong> ${item.fullAddress || 'Rishikesh Station / Venue'}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0;"><strong>Host Contact:</strong> ${phoneDisplayStr}</td>
              </tr>
            </table>
            <div style="margin-top: 10px; font-size: 12px;">
              <a href="${itemMap}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 12px;">Open Venue Map 📍</a>
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  // --- Email 1: To Customer ---
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

        <div style="text-align: center; margin-bottom: 25px;">
          <a href="${ticketPassUrl}" style="display: inline-block; background: #FF6B00; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 15px; text-decoration: none; box-shadow: 0 4px 12px rgba(255,107,0,0.25);">🎟️ View Digital Adventure Ticket Pass</a>
        </div>

        <h3 style="color: #111; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 0;">Booking Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; width: 40%; border-bottom: 1px solid #eee;">Booking ID:</td>
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #eee; color: #FF6B00;">${simpleBookingCode}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #eee;">Activity / Package:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${data.activityName} ${data.stretch ? `(${data.stretch})` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #eee;">Arrival Date:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${data.date}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #eee;">Total Booked:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${data.guests} ${unitLabel}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #eee;">Payment Status:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">Paid Online: <strong>₹${(data.advancePaid || 0).toLocaleString('en-IN')}</strong> | Balance at Venue: <strong>₹${(data.remainingPaid || 0).toLocaleString('en-IN')}</strong></td>
          </tr>
        </table>

        ${itemsHtml}

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; margin-top: 25px;">
          <p style="margin: 0; font-size: 13px; color: #64748b;">Need help with your booking? Contact TripGod Support at <strong>+91 9410572857</strong></p>
        </div>
      </div>
    `
  };

  // --- Email 2: To Admin ---
  const adminMailOptions = {
    from: `"TripGod Booking Engine" <${smtpUser}>`,
    to: notificationEmail,
    subject: `🚨 NEW BOOKING: ${data.activityName} - ${data.customerName} (${simpleBookingCode})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #FF6B00; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #FF6B00; margin-top: 0;">⚡ New Booking Notification</h2>
        <p>A new customer booking has been successfully processed online.</p>

        <h3>Booking Overview</h3>
        <ul>
          <li><strong>Booking Code:</strong> ${simpleBookingCode}</li>
          <li><strong>Customer Name:</strong> ${data.customerName}</li>
          <li><strong>Phone:</strong> ${formatDisplayPhone(data.customerPhone)}</li>
          <li><strong>Email:</strong> ${data.customerEmail}</li>
          <li><strong>Service / Activity:</strong> ${data.activityName} ${data.stretch ? `(${data.stretch})` : ''}</li>
          <li><strong>Date & Slot:</strong> ${data.date} @ ${data.slot}</li>
          <li><strong>Guests / Units:</strong> ${data.guests} ${unitLabel}</li>
          <li><strong>Total Amount:</strong> ₹${data.totalPrice.toLocaleString('en-IN')}</li>
          <li><strong>Amount Paid Online:</strong> ₹${data.advancePaid.toLocaleString('en-IN')}</li>
          <li><strong>Remaining to Collect at Venue:</strong> ₹${data.remainingPaid.toLocaleString('en-IN')}</li>
          <li><strong>Operator WhatsApp:</strong> ${formatDisplayPhone(data.agencyPhone)}</li>
        </ul>
      </div>
    `
  };

  try {
    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(adminMailOptions);
    console.log("Email alerts sent successfully via Nodemailer");
  } catch (emailErr) {
    console.error("Failed to send email alert:", emailErr);
  }
}
