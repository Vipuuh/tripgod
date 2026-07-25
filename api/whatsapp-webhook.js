// api/whatsapp-webhook.js
// Vercel Serverless Endpoint to handle Meta WhatsApp Cloud API Webhooks
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://tripgod-supabase-placeholder.supabase.co";
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "tripgod_wa_verify_2026";
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "EAAVjnkkrc1ABR0CzprLuR7dFOZClD3yfQ2vhZC39tQjAI7PLL1ZCRSEzc9ZCDZCwxoDZBh6G4N2SafXr4a1KQQtZBJMh1ypMXxB2wZBPoufA83MjR5xdr4yOVEaptkvdgZBnPOxkVM5cP5HlNiI51brQi305GkVegMR67AVjZAMCPZBytCvUqPCcbQZB5OeBxcVi6wZDZD";

const getSupabase = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  } catch (err) {
    console.error("Supabase init error in webhook:", err);
    return null;
  }
};

export default async function handler(req, res) {
  // 1. Handle GET Webhook Verification Handshake
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log("WhatsApp Webhook Verified Successfully!");
      return res.status(200).send(challenge);
    } else {
      return res.status(403).json({ error: 'Verification failed' });
    }
  }

  // 2. Handle POST Incoming Webhook Events from Meta
  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (!body || !body.entry || !body.entry[0]) {
        return res.status(200).json({ status: 'ignored' });
      }

      const value = body.entry[0].changes?.[0]?.value;
      if (!value) return res.status(200).json({ status: 'no_value' });

      // Handle Status Updates (sent, delivered, read)
      if (value.statuses && value.statuses[0]) {
        const statusObj = value.statuses[0];
        const supabase = getSupabase();
        if (supabase) {
          await supabase
            .from('whatsapp_messages')
            .update({ status: statusObj.status })
            .eq('wa_message_id', statusObj.id);
        }
        return res.status(200).json({ status: 'status_updated' });
      }

      // Handle Incoming Messages
      if (value.messages && value.messages[0]) {
        const message = value.messages[0];
        const contact = value.contacts?.[0];

        const rawPhone = message.from; // e.g. '919837371137'
        const cleanPhone = rawPhone.replace(/\D/g, '');
        const customerName = contact?.profile?.name || `Customer (${cleanPhone.slice(-4)})`;
        const waMessageId = message.id;
        const msgType = message.type || 'text';

        let messageContent = '';
        let mediaUrl = null;
        let mediaMimeType = null;

        if (msgType === 'text') {
          messageContent = message.text?.body || '';
        } else if (msgType === 'image') {
          messageContent = message.image?.caption || '📷 Photo';
          mediaMimeType = message.image?.mime_type || 'image/jpeg';
          const mediaId = message.image?.id;
          if (mediaId) {
            mediaUrl = await fetchMetaMediaUrl(mediaId);
          }
        } else if (msgType === 'document') {
          messageContent = message.document?.caption || message.document?.filename || '📄 Document PDF';
          mediaMimeType = message.document?.mime_type || 'application/pdf';
          const mediaId = message.document?.id;
          if (mediaId) {
            mediaUrl = await fetchMetaMediaUrl(mediaId);
          }
        } else if (msgType === 'location') {
          const loc = message.location;
          messageContent = `📍 Location: ${loc?.name || 'Shared Location'} (${loc?.latitude}, ${loc?.longitude})`;
        } else if (msgType === 'button' || msgType === 'interactive') {
          messageContent = message.button?.text || message.interactive?.button_reply?.title || 'Interactive Reply';
        } else {
          messageContent = `[${msgType.toUpperCase()} Message]`;
        }

        const supabase = getSupabase();
        if (supabase) {
          // 24-hour customer service window expiry date
          const windowExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

          // Find or Create Chat in whatsapp_chats
          let { data: existingChat } = await supabase
            .from('whatsapp_chats')
            .select('*')
            .eq('phone_number', cleanPhone)
            .single();

          let chatId = existingChat?.id;

          if (!existingChat) {
            const { data: newChat, error: createErr } = await supabase
              .from('whatsapp_chats')
              .insert({
                phone_number: cleanPhone,
                customer_name: customerName,
                last_message: messageContent,
                last_message_at: new Date().toISOString(),
                unread_count: 1,
                status: 'open',
                window_expires_at: windowExpiresAt,
                metadata: { wa_id: contact?.wa_id || cleanPhone }
              })
              .select()
              .single();

            if (!createErr && newChat) {
              chatId = newChat.id;
            }
          } else {
            const newUnread = (existingChat.unread_count || 0) + 1;
            await supabase
              .from('whatsapp_chats')
              .update({
                customer_name: existingChat.customer_name === `Customer (${cleanPhone.slice(-4)})` ? customerName : existingChat.customer_name,
                last_message: messageContent,
                last_message_at: new Date().toISOString(),
                unread_count: newUnread,
                status: existingChat.status === 'closed' ? 'open' : existingChat.status,
                window_expires_at: windowExpiresAt
              })
              .eq('id', chatId);
          }

          // Insert Message into whatsapp_messages
          if (chatId) {
            await supabase
              .from('whatsapp_messages')
              .insert({
                chat_id: chatId,
                wa_message_id: waMessageId,
                direction: 'inbound',
                sender_type: 'customer',
                sender_name: customerName,
                message_type: msgType,
                content: messageContent,
                media_url: mediaUrl,
                media_mime_type: mediaMimeType,
                status: 'delivered'
              });
          }
        }
      }

      return res.status(200).json({ status: 'success' });
    } catch (err) {
      console.error("Webhook processing error:", err);
      return res.status(200).json({ status: 'error', error: err.message }); // Return 200 to prevent Meta webhook retries loop
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Helper function to fetch media download URL from Meta Graph API
async function fetchMetaMediaUrl(mediaId) {
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`
      }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.url || null; // Direct Meta download URL
  } catch (err) {
    console.error("Failed to fetch Meta media URL:", err);
    return null;
  }
}
