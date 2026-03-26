const instagramHandler = require('./handlers/instagram');
const facebookHandler = require('./handlers/facebook');
const whatsappHandler = require('./handlers/whatsapp');

/**
 * Top-level event dispatcher — reads the Meta webhook `object` field
 * and routes to the correct platform handler.
 */
async function handleEvent(body) {
    const objectType = body.object;

    if (objectType === 'instagram') {
        await handleInstagramEvent(body);
    } else if (objectType === 'page') {
        await handlePageEvent(body);
    } else if (objectType === 'whatsapp_business_account') {
        await handleWhatsAppEvent(body);
    } else {
        console.log(`ℹ️  Unhandled object type: ${objectType}`);
    }
}

// ─── Instagram ────────────────────────────────────────────────────────────────
async function handleInstagramEvent(body) {
    for (const entry of body.entry || []) {
        // Comments on media
        for (const change of entry.changes || []) {
            if (change.field === 'comments') {
                const v = change.value;
                await instagramHandler.handleComment({
                    commentId: v.id,
                    commenterId: v.from?.id,
                    commenterName: v.from?.username || 'there',
                    commentText: v.text,
                    mediaId: v.media?.id,
                });
            }
        }

        // Direct Messages (Instagram Messaging)
        for (const msg of (entry.messaging || [])) {
            if (msg.message) {
                await instagramHandler.handleDM({
                    senderId: msg.sender?.id,
                    message: msg.message,
                });
            } else if (msg.postback) {
                await instagramHandler.handlePostback({
                    senderId: msg.sender?.id,
                    postback: msg.postback,
                });
            }
        }
    }
}

// ─── Facebook Page (Messenger) ────────────────────────────────────────────────
async function handlePageEvent(body) {
    for (const entry of body.entry || []) {
        for (const msg of (entry.messaging || [])) {
            if (msg.message) {
                await facebookHandler.handleDM({
                    senderId: msg.sender?.id,
                    message: msg.message,
                });
            } else if (msg.postback) {
                await facebookHandler.handlePostback({
                    senderId: msg.sender?.id,
                    postback: msg.postback,
                });
            }
        }
    }
}

// ─── WhatsApp Cloud API ───────────────────────────────────────────────────────
async function handleWhatsAppEvent(body) {
    for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
            const value = change.value;
            if (!value || !value.messages) continue;

            for (const message of value.messages) {
                const contact = value.contacts?.[0];
                await whatsappHandler.handleMessage({
                    from: message.from,
                    customerName: contact?.profile?.name || 'Customer',
                    message,
                });
            }
        }
    }
}

module.exports = { handleEvent };
