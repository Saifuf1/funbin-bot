const axios = require('axios');
const config = require('../config');

const BASE = config.graphApiBase;

/**
 * Send a Private Reply to an Instagram comment (Multi-tenant)
 * @param {string} commentId
 * @param {string} message
 * @param {object} client - The SaaS client context
 */
async function sendPrivateReply(commentId, message, client) {
    const token = client?.pageAccessToken || config.pageAccessToken;
    try {
        const res = await axios.post(
            `${BASE}/${commentId}/private_replies`,
            { message },
            { params: { access_token: token } }
        );
        console.log(`✅ [SaaS] IG private reply sent to comment ${commentId} (Client: ${client?.id})`);
        return res.data;
    } catch (err) {
        console.error('❌ IG private reply failed:', err.response?.data || err.message);
    }
}

/**
 * Send a DM to an Instagram user (Multi-tenant)
 * @param {string} recipientId
 * @param {string|object} messageContent
 * @param {object} client - The SaaS client context
 */
async function sendDM(recipientId, messageContent, client) {
    const token = client?.pageAccessToken || config.pageAccessToken;
    const pageId = client?.instagramPageId || config.instagramPageId;

    const message = typeof messageContent === 'string'
        ? { text: messageContent }
        : messageContent;

    try {
        const res = await axios.post(
            `${BASE}/${pageId}/messages`,
            {
                recipient: { id: recipientId },
                message,
                messaging_type: 'RESPONSE',
            },
            { params: { access_token: token } }
        );
        console.log(`✅ [SaaS] IG DM sent to ${recipientId} (Client: ${client?.id})`);
        return res.data;
    } catch (err) {
        console.error('❌ IG DM failed:', err.response?.data || err.message);
    }
}

/**
 * Build a generic button template for Instagram Messenger
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

module.exports = { sendPrivateReply, sendDM, buildButtonTemplate };
