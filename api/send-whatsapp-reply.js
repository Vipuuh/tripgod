// api/send-whatsapp-reply.js
// Vercel Serverless Function to dispatch outbound WhatsApp replies & Template Messages via Meta Cloud API
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://xiqirxnnwljwtkabeukr.supabase.co";
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_AhBs9zs5xpkeR0obLfXaXQ_dQlTPdRI";

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "EAAVjnkkrc1ABR0CzprLuR7dFOZClD3yfQ2vhZC39tQjAI7PLL1ZCRSEzc9ZCDZCwxoDZBh6G4N2SafXr4a1KQQtZBJMh1ypMXxB2wZBPoufA83MjR5xdr4yOVEaptkvdgZBnPOxkVM5cP5HlNiI51brQi305GkVegMR67AVjZAMCPZBytCvUqPCcbQZB5OeBxcVi6wZDZD";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || "1242547802272575";

const getSupabase = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  } catch (err) {
    console.error("Supabase init error in send reply:", err);
    return null;
  }
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
    const {
      chat_id,
      recipient_phone,
      message_type = 'text',
      text,
      media_url,
      media_filename,
      template_name,
      template_language = 'en_US',
      template_variables = [],
      agent_name = 'TripGod Support'
    } = req.body;

    if (!recipient_phone || (!text && !media_url && !template_name)) {
      return res.status(400).json({ error: 'Recipient phone number and message content, media URL, or template name are required' });
    }

    const cleanPhone = recipient_phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;

    // Build Payload for Meta Graph API
    let metaPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone
    };

    if (message_type === 'template' && template_name) {
      metaPayload.type = 'template';
      metaPayload.template = {
        name: template_name,
        language: { code: template_language }
      };

      if (Array.isArray(template_variables) && template_variables.length > 0) {
        metaPayload.template.components = [
          {
            type: "body",
            parameters: template_variables.map((val) => ({
              type: "text",
              text: String(val)
            }))
          }
        ];
      }
    } else if (message_type === 'image' && media_url) {
      metaPayload.type = 'image';
      metaPayload.image = {
        link: media_url,
        caption: text || ''
      };
    } else if (message_type === 'document' && media_url) {
      metaPayload.type = 'document';
      metaPayload.document = {
        link: media_url,
        caption: text || '',
        filename: media_filename || 'Voucher.pdf'
      };
    } else if (message_type === 'video' && media_url) {
      metaPayload.type = 'video';
      metaPayload.video = {
        link: media_url,
        caption: text || ''
      };
    } else if (message_type === 'audio' && media_url) {
      metaPayload.type = 'audio';
      metaPayload.audio = {
        link: media_url
      };
    } else {
      metaPayload.type = 'text';
      metaPayload.text = {
        preview_url: true,
        body: text
      };
    }

    // Call Meta Graph API
    const metaUrl = `https://graph.facebook.com/v19.0/${META_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metaPayload)
    });

    const metaData = await response.json();

    if (!response.ok || metaData.error) {
      console.error("Meta WhatsApp Send Error:", metaData);
      return res.status(400).json({
        error: metaData.error?.message || 'Failed to send WhatsApp message via Meta Cloud API',
        details: metaData.error || metaData
      });
    }

    const waMessageId = metaData.messages?.[0]?.id || null;

    // Record outbound message in Supabase
    const supabase = getSupabase();
    if (supabase && chat_id) {
      const messageContent = message_type === 'template'
        ? `📋 Approved Template: ${template_name} ${text ? `(${text})` : ''}`
        : text || (message_type === 'image' ? '📷 Photo' : message_type === 'video' ? '🎥 Video' : message_type === 'audio' ? '🎤 Voice' : '📄 Document');

      // 1. Insert into whatsapp_messages
      await supabase
        .from('whatsapp_messages')
        .insert({
          chat_id,
          wa_message_id: waMessageId,
          direction: 'outbound',
          sender_type: 'agent',
          sender_name: agent_name,
          message_type,
          content: messageContent,
          media_url: media_url || null,
          status: 'sent'
        });

      // 2. Update whatsapp_chats last message & reset unread count
      await supabase
        .from('whatsapp_chats')
        .update({
          last_message: messageContent,
          last_message_at: new Date().toISOString(),
          unread_count: 0 // Reset unread count since agent responded
        })
        .eq('id', chat_id);
    }

    return res.status(200).json({
      success: true,
      message_id: waMessageId,
      meta_response: metaData
    });
  } catch (err) {
    console.error("Error sending WhatsApp reply:", err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
