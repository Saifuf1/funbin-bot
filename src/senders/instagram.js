const axios = require('axios');
const config = require('../config');

const BASE = config.graphApiBase;

/**
 * Send a Private Reply to an Instagram comment.
 * This appears in the commenter's DM inbox.
 *
 * @param {string} commentId - The comment ID to reply to
 * @param {string} message - Text to send
 */
async function sendPrivateReply(commentId, message) {
    try {
        const res = await axios.post(
            `${BASE}/${commentId}/private_replies`,
            { message },
            {
                params: { access_token: config.pageAccessToken },
            }
        );
        console.log(`✅ IG private reply sent to comment ${commentId}`);
        return res.data;
    } catch (err) {
        console.error('❌ IG private reply failed:', err.response?.data || err.message);
    }
}

/**
 * Send a DM to an Instagram user via the Messenger API.
 *
 * @param {string} recipientId - PSID (Page-Scoped User ID)
 * @param {string|object} messageContent - Text string or message object
 */
async function sendDM(recipientId, messageContent) {
    const message =
        typeof messageContent === 'string'
            ? { text: messageContent }
            : messageContent;

    try {
        const res = await axios.post(
            `${BASE}/${config.instagramPageId}/messages`,
            {
                recipient: { id: recipientId },
                message,
                messaging_type: 'RESPONSE',
            },
            {
                params: { access_token: config.pageAccessToken },
            }
        );
        console.log(`✅ IG DM sent to ${recipientId}`);
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
