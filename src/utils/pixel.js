// Meta Pixel Analytics Helper for TripGod

export const trackPixelEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', eventName, params);
      console.log(`[Meta Pixel] Tracked ${eventName}:`, params);
    } catch (err) {
      console.error(`[Meta Pixel] Error tracking ${eventName}:`, err);
    }
  }
};

/**
 * Track Lead event (e.g., WhatsApp inquiry, Call support, Custom package inquiry)
 * @param {string} leadType - Source/Category of lead (e.g. 'WhatsApp Floating Widget', 'Hotels WhatsApp')
 * @param {object} customData - Additional parameters (e.g. { content_name: 'Bungee Jump', value: 3500, currency: 'INR' })
 */
export const trackLead = (leadType = 'WhatsApp Inquiry', customData = {}) => {
  trackPixelEvent('Lead', {
    content_category: leadType,
    currency: 'INR',
    ...customData,
  });
};

/**
 * Track Contact event (e.g., Direct Call)
 */
export const trackContact = (contactType = 'Phone Call', customData = {}) => {
  trackPixelEvent('Contact', {
    content_category: contactType,
    currency: 'INR',
    ...customData,
  });
};

/**
 * Track InitiateCheckout event
 */
export const trackInitiateCheckout = (contentName, value, currency = 'INR') => {
  trackPixelEvent('InitiateCheckout', {
    content_name: contentName,
    value: Number(value) || 0,
    currency: currency,
  });
};

/**
 * Track Purchase event
 */
export const trackPurchase = (value, currency = 'INR', transactionId = '', contentName = '') => {
  trackPixelEvent('Purchase', {
    value: Number(value) || 0,
    currency: currency,
    transaction_id: transactionId,
    content_name: contentName,
  });
};
