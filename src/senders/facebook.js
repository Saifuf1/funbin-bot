const axios = require('axios');
const config = require('../config');

const BASE = config.graphApiBase;

/**
 * Send a message to a Facebook Messenger user (Multi-tenant).
 * @param {string} recipientId - PSID
 * @param {object|string} messageContent - Text or message object
 * @param {object} client - The SaaS client context
 */
async function sendMessage(recipientId, messageContent, client) {
    const token = client?.pageAccessToken || config.pageAccessToken;

    const message = typeof messageContent === 'string'
        ? { text: messageContent }
        : messageContent;

    try {
        const res = await axios.post(
            `${BASE}/me/messages`,
            {
                recipient: { id: recipientId },
                message,
                messaging_type: 'RESPONSE',
            },
            { params: { access_token: token } }
        );
        console.log(`✅ [SaaS] FB message sent to ${recipientId} (Client: ${client?.id})`);
        return res.data;
    } catch (err) {
        console.error('❌ FB message failed:', err.response?.data || err.message);
    }
}

/**
 * Build a button template for Facebook Messenger
 */
function buildButtonTemplate(text, buttons) {
    return {
        attachment: {
            type: 'template',
            payload: {
                template_type: 'button',
                text,
                buttons: buttons.slice(0, 3).map((b) => ({
                    type: 'postback',
                    title: b.title.slice(0, 20),
                    payload: b.payload || b.title,
                })),
            },
        },
    };
}

/**
 * Build a quick reply message
 */
function buildQuickReplies(text, options) {
    return {
        text,
        quick_replies: options.slice(0, 13).map((o) => ({
            content_type: 'text',
            title: o.title.slice(0, 20),
            payload: o.payload || o.title,
        })),
    };
}

module.exports = { sendMessage, buildButtonTemplate, buildQuickReplies };
