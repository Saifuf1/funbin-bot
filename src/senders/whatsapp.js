const axios = require('axios');
const config = require('../config');

const BASE = `https://graph.facebook.com/v20.0/${config.whatsappPhoneNumberId}/messages`;

/**
 * Build headers dynamically every call — ensures token is always fresh from config
 */
function getHeaders() {
    return {
        Authorization: `Bearer ${config.whatsappToken}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Send any WhatsApp message payload.
 * @param {object} payload - Full WhatsApp API message object
 */
async function sendMessage(payload) {
    try {
        const res = await axios.post(BASE, payload, { headers: getHeaders() });
        console.log(`✅ WhatsApp message sent to ${payload.to}`);
        return res.data;
    } catch (err) {
        const errData = err.response?.data;
        console.error('❌ WhatsApp send FAILED');
        console.error('   Status:', err.response?.status);
        console.error('   Error:', JSON.stringify(errData, null, 2));
        console.error('   Token prefix:', config.whatsappToken?.slice(0, 20) + '...');
        // Re-throw so caller knows it failed
        throw err;
    }
}

/**
 * Send a plain text message
 * @param {string} to - Phone number in international format (no +)
 * @param {string} text
 */
async function sendText(to, text) {
    return sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text, preview_url: false },
    });
}

/**
 * Send an interactive message (list or buttons)
 * @param {string} to
 * @param {object} interactivePayload - The full WhatsApp message object (from messages.js)
 */
async function sendInteractive(to, interactivePayload) {
    return sendMessage(interactivePayload);
}

/**
 * Send an image message with optional caption
 * @param {string} to
 * @param {string} imageUrl - Publicly accessible image URL
 * @param {string} [caption]
 */
async function sendImage(to, imageUrl, caption = '') {
    return sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'image',
        image: { link: imageUrl, caption },
    });
}

/**
 * Mark a message as read (shows double blue ticks)
 * @param {string} messageId
 */
async function markAsRead(messageId) {
    try {
        await axios.post(
            BASE,
            {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
            },
            { headers: getHeaders() }
        );
    } catch (err) {
        // Non-critical — log but don't throw
        console.warn('⚠️  markAsRead failed:', err.response?.data?.error?.message || err.message);
    }
}

module.exports = { sendMessage, sendText, sendInteractive, sendImage, markAsRead };
