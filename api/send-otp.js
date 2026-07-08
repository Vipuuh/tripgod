// api/send-otp.js
// Vercel Serverless Function to dispatch Login OTP emails using SMTP
import nodemailer from 'nodemailer';

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
    const { email, phone, name, otp } = req.body;
    if (!otp || (!email && !phone)) {
      return res.status(400).json({ error: 'OTP and either Email or Phone are required' });
    }

    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "EAAVjnkkrc1ABR0aIJMZC3BeypPWwlTBfhDXsPzkJx8ZB1BgxeJZBXT2gPEUIz1zKO6UD7lTzqtyg78vtpQnZBe1UQk6ahaOwNId6MhyNTZC9zXqsAATR0JKn62rXPwNoUD4WWjythZCkp4deKkTYS2NZA0ehn5xWMCIVZAEhl1Mq9DhHiy0noERNSbsp8OcrtZCAynJYAy2vaE0r4wXiBZCwk46ZCwW1jMWabORqjRgyNFaxZAM021YhF0cRWwLd6DOYgytJjBRjklIGZBl0jkxbSDU8x";
    const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || "1242547802272575";

    // 1. Send via WhatsApp if Phone Number is provided
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;

      const url = `https://graph.facebook.com/v20.0/${META_PHONE_NUMBER_ID}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: "otp_verification",
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: otp
                }
              ]
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [
                {
                  type: "text",
                  text: otp
                }
              ]
            }
          ]
        }
      };

      console.log(`Sending OTP WhatsApp message to +${formattedPhone}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${META_ACCESS_TOKEN}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log(`Meta OTP API response for +${formattedPhone}:`, result);

      if (response.ok && !result.error) {
        return res.status(200).json({ success: true, message: 'OTP sent via WhatsApp successfully' });
      } else {
        console.error('Meta OTP sending failed:', result.error);
        return res.status(500).json({ error: result.error?.message || 'Failed to send OTP via WhatsApp' });
      }
    }

    // 2. Otherwise send via Email using Nodemailer
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;

    if (!smtpUser || !smtpPass) {
      console.warn('SMTP credentials not configured. Mocking OTP success. OTP code:', otp);
      return res.status(200).json({ success: true, message: 'Mock OTP sent (SMTP not configured)' });
    }

    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "465");
    const smtpSecure = smtpPort === 465;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"TripGod" <${smtpUser}>`,
      to: email,
      subject: `🔑 TripGod Login OTP: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff; color: #333333; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #FF6B00; margin: 0; font-size: 28px; font-weight: 900;">TRIP<span style="background-color: #f3f4f6; padding: 2px 8px; border-radius: 4px; color: #111; margin-left: 2px;">GOD</span></h1>
            <p style="color: #666; font-size: 14px; margin-top: 5px;">Rishikesh's #1 Adventure Booking Partner</p>
          </div>
          
          <div style="background-color: #FFF0E5; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;">Hi <strong>${name || 'User'}</strong>, here is your 6-digit OTP code to log in to your account:</p>
            <h2 style="color: #FF6B00; font-size: 32px; letter-spacing: 5px; margin: 10px 0; font-weight: 900;">${otp}</h2>
            <p style="margin: 0; font-size: 12px; color: #888;">Valid for 10 minutes. Do not share this OTP with anyone.</p>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; font-size: 11px; color: #888;">
            <p style="margin: 0;">© 2026 TripGod Rishikesh. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP Serverless API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
