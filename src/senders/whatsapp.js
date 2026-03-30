const axios = require('axios');
const config = require('../config');

/**
 * Send any WhatsApp message payload.
 * @param {object} payload - Full WhatsApp API message object
 * @param {object} client - The client context (optional)
 */
async function sendMessage(payload, client) {
    const token = client?.whatsappToken || config.whatsappToken;
    const phoneId = client?.whatsappPhoneNumberId || config.whatsappPhoneNumberId;
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

    try {
        const res = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        console.log(`✅ [Client: ${client?.id || 'master'}] WhatsApp message sent to ${payload.to}`);
        return res.data;
    } catch (err) {
        const errData = err.response?.data;
        console.error(`❌ [Client: ${client?.id}] WhatsApp send FAILED`);
        console.error('   Status:', err.response?.status);
        console.error('   Error:', JSON.stringify(errData, null, 2));
        throw err;
    }
}

/**
 * Send a plain text message
 */
async function sendText(client, to, text) {
    return sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text, preview_url: false },
    }, client);
}

/**
 * Send an interactive message (list or buttons)
 */
async function sendInteractive(client, to, interactivePayload) {
    return sendMessage(interactivePayload, client);
}

/**
 * Send an image message with optional caption
 */
async function sendImage(client, to, imageUrl, caption = '') {
    return sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'image',
        image: { link: imageUrl, caption },
    }, client);
}

/**
 * Mark a message as read
 */
async function markAsRead(client, messageId) {
    const token = client?.whatsappToken || config.whatsappToken;
    const phoneId = client?.whatsappPhoneNumberId || config.whatsappPhoneNumberId;
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

    try {
        await axios.post(
            url,
            {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            }
        );
    } catch (err) {
        console.warn('⚠️  markAsRead failed:', err.response?.data?.error?.message || err.message);
    }
}

module.exports = { sendMessage, sendText, sendInteractive, sendImage, markAsRead };
