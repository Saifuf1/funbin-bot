const axios = require('axios');
const config = require('../config');

const BASE = `https://graph.facebook.com/v20.0/${config.whatsappPhoneNumberId}/messages`;

const HEADERS = {
    Authorization: `Bearer ${config.whatsappToken}`,
    'Content-Type': 'application/json',
};

/**
 * Send any WhatsApp message payload.
 * @param {object} payload - Full WhatsApp API message object
 */
async function sendMessage(payload) {
    try {
        const res = await axios.post(BASE, payload, { headers: HEADERS });
        console.log(`✅ WhatsApp message sent to ${payload.to}`);
        return res.data;
    } catch (err) {
        console.error('❌ WhatsApp send failed:', err.response?.data || err.message);
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
        text: { body: text, preview_url: true },
    });
}

/**
 * Send an interactive message (list or buttons)
 * @param {string} to
 * @param {object} interactivePayload - The full interactive payload object (from messages.js)
 */
async function sendInteractive(to, interactivePayload) {
    // interactivePayload is already a full WhatsApp message object from messages.js
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
            { headers: HEADERS }
        );
    } catch (err) {
        // Non-critical — swallow errors
    }
}

module.exports = { sendMessage, sendText, sendInteractive, sendImage, markAsRead };
