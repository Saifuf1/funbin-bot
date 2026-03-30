const instagramHandler = require('./handlers/instagram');
const facebookHandler = require('./handlers/facebook');
const whatsappHandler = require('./handlers/whatsapp');
const { findClientByMetaId } = require('./db/saas');

/**
 * Top-level event dispatcher — reads the Meta webhook `object` field
 * and routes to the correct platform handler with a Client Context.
 */
async function handleEvent(body) {
    const objectType = body.object;

    // SaaS Identification: Load the client based on Meta ID
    let metaId = null;
    if (objectType === 'instagram' || objectType === 'page') {
        metaId = body.entry?.[0]?.id;
    } else if (objectType === 'whatsapp_business_account') {
        metaId = body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    }

    // Default to 'owner' if no client found (backward compatibility)
    const client = findClientByMetaId(metaId) || { id: 'owner', name: 'Master Admin' };
    console.log(`🔌 Multi-Tenant: Routing event for client [${client.id}] — Meta ID: ${metaId}`);

    if (objectType === 'instagram') {
        await handleInstagramEvent(body, client);
    } else if (objectType === 'page') {
        await handlePageEvent(body, client);
    } else if (objectType === 'whatsapp_business_account') {
        await handleWhatsAppEvent(body, client);
    } else {
        console.log(`ℹ️  Unhandled object type: ${objectType}`);
    }
}

// ─── Instagram ────────────────────────────────────────────────────────────────
async function handleInstagramEvent(body, client) {
    for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
            if (change.field === 'comments') {
                const v = change.value;
                await instagramHandler.handleComment({
                    commentId: v.id,
                    commenterId: v.from?.id,
                    commenterName: v.from?.username || 'there',
                    commentText: v.text,
                    mediaId: v.media?.id,
                    client
                });
            }
        }

        for (const msg of (entry.messaging || [])) {
            if (msg.message) {
                await instagramHandler.handleDM({
                    senderId: msg.sender?.id,
                    message: msg.message,
                    client
                });
            } else if (msg.postback) {
                await instagramHandler.handlePostback({
                    senderId: msg.sender?.id,
                    postback: msg.postback,
                    client
                });
            }
        }
    }
}

// ─── Facebook Page (Messenger) ────────────────────────────────────────────────
async function handlePageEvent(body, client) {
    for (const entry of body.entry || []) {
        for (const msg of (entry.messaging || [])) {
            if (msg.message) {
                await facebookHandler.handleDM({
                    senderId: msg.sender?.id,
                    message: msg.message,
                    client
                });
            } else if (msg.postback) {
                await facebookHandler.handlePostback({
                    senderId: msg.sender?.id,
                    postback: msg.postback,
                    client
                });
            }
        }
    }
}

// ─── WhatsApp Cloud API ───────────────────────────────────────────────────────
async function handleWhatsAppEvent(body, client) {
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
                    client
                });
            }
        }
    }
}

module.exports = { handleEvent };
