// api/whatsapp-media-proxy.js
// Proxies Meta WhatsApp media URLs by attaching the META_ACCESS_TOKEN header and setting binary mime types

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "EAAVjnkkrc1ABR0CzprLuR7dFOZClD3yfQ2vhZC39tQjAI7PLL1ZCRSEzc9ZCDZCwxoDZBh6G4N2SafXr4a1KQQtZBJMh1ypMXxB2wZBPoufA83MjR5xdr4yOVEaptkvdgZBnPOxkVM5cP5HlNiI51brQi305GkVegMR67AVjZAMCPZBytCvUqPCcbQZB5OeBxcVi6wZDZD";

export default async function handler(req, res) {
  const { url, media_id } = req.query;

  try {
    let targetUrl = url;

    // If media_id is passed instead of direct URL
    if (!targetUrl && media_id) {
      const metaRes = await fetch(`https://graph.facebook.com/v19.0/${media_id}`, {
        headers: { 'Authorization': `Bearer ${META_ACCESS_TOKEN}` }
      });
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        targetUrl = metaData.url;
      }
    }

    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url or valid media_id' });
    }

    // Fetch the media binary with Authorization header from Meta
    const response = await fetch(targetUrl, {
      headers: {
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch media from Meta Cloud API' });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('Media proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
