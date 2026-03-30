const waSender = require('../senders/whatsapp');
const waMessages = require('../whatsapp/messages');
const { generateUPILink, buildPaymentMessage, buildCODMessage } = require('../whatsapp/upi');
const { chat, analyzeImage, analyzeAudio, validateDeliveryAddress } = require('../ai/gemini');
const { getOrCreateSession, updateSession, addToCart, getCartTotal } = require('../ai/context');
const { getAllProducts, getCategories, getProductsByCategory, findProductBySKU, formatProductForCustomer } = require('../db/products');
const { createOrder } = require('../db/orders');
const config = require('../config');
const axios = require('axios');
const aiConfig = require('../ai/config');

/**
 * Main WhatsApp message handler — the full AI shopping assistant.
 * @param {object} opts
 * @param {string} opts.from - Sender's phone number
 * @param {string} opts.customerName
 * @param {object} opts.message - Raw WhatsApp message object
 */
async function handleMessage({ from, customerName, message, client }) {
    console.log(`📱 [Client: ${client.id}] WhatsApp from ${from} (${customerName}): type=${message.type}`);

    // Mark as read
    await waSender.markAsRead(client, message.id);

    // Update customer name in session
    const session = getOrCreateSession(from);
    if (customerName && !session.customerName) {
        updateSession(from, { customerName });
    }

    // Escalated to human — skip AI
    if (session.awaitingHuman) {
        return waSender.sendText(
            client,
            from,
            `Nammude team member ettu connect aagum! 😊\nUr message received.`
        );
    }

    const msgType = message.type;

    // ── Text Message ─────────────────────────────────────────────────────────
    if (msgType === 'text') {
        await handleTextMessage(client, from, customerName, message.text.body);
        return;
    }

    // ── Image Message ────────────────────────────────────────────────────────
    if (msgType === 'image') {
        await handleImageMessage(client, from, message.image);
        return;
    }

    // ── Interactive (List Reply or Button Reply) ───────────────────────────
    if (msgType === 'interactive') {
        await handleInteractiveMessage(client, from, customerName, message.interactive);
        return;
    }

    // ── Audio Message (Voice Note) ───────────────────────────────────────────
    if (msgType === 'audio') {
        await handleAudioMessage(client, from, message.audio);
        return;
    }

    // ── Order Message (Catalog Checkout) ───────────────────────────────────
    if (msgType === 'order') {
        await handleOrderMessage(client, from, customerName, message.order);
        return;
    }

    // ── Sticker / Video — fallback ────────────────────────────────────────
    await waSender.sendText(
        client,
        from,
        `Ithu nte message kandilla 😅 Text cheytu chodichooo! 🙏`
    );
}

// ─── Audio Handler ────────────────────────────────────────────────────────────
async function handleAudioMessage(client, from, audioObj) {
    try {
        await waSender.sendText(client, from, `🎤 Voice note kettukondirikkukayaanu... oru minute! 🎧`);

        const mediaId = audioObj.id;
        const mimeType = audioObj.mime_type || 'audio/ogg';
        const token = client.whatsappToken || config.whatsappToken;

        // Step 1: Resolve media download URL
        let downloadUrl;
        try {
            const mediaUrlRes = await axios.get(
                `https://graph.facebook.com/v20.0/${mediaId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            downloadUrl = mediaUrlRes.data.url;
        } catch (e) {
            console.error('❌ Failed to resolve audio URL:', e.response?.data || e.message);
            throw new Error('Audio URL resolution failed');
        }

        // Step 2: Download audio bytes
        let base64;
        try {
            const audioRes = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                headers: { Authorization: `Bearer ${token}` },
            });
            base64 = Buffer.from(audioRes.data).toString('base64');
        } catch (e) {
            console.error('❌ Failed to download audio bytes:', e.message);
            throw new Error('Audio download failed');
        }

        // Step 3: Gemini Audio analysis (Context Aware)
        const reply = await analyzeAudio(base64, mimeType, from, client);
        await waSender.sendText(client, from, reply);

    } catch (err) {
        console.error('❌ Audio handler error:', err.message);
        await waSender.sendText(client, from, `Voice note process cheyyam pattunnilla 😅\nOru text message aayi chodikkamo? 🙏`);
    }
}

// ─── Text Handler ─────────────────────────────────────────────────────────────
async function handleTextMessage(client, from, customerName, text) {
    const session = getOrCreateSession(from);

    if (session.awaitingAddress) {
        const combinedText = session.tempAddress ? session.tempAddress + ', ' + text : text;
        const validation = await validateDeliveryAddress(combinedText);

        if (validation.valid) {
            updateSession(from, { awaitingAddress: false, deliveryAddress: validation.formatted, tempAddress: null });
            return processPurchase(client, from, session, validation.formatted);
        } else {
            updateSession(from, { tempAddress: combinedText });
            return waSender.sendText(client, from, validation.message);
        }
    }

    const lower = text.toLowerCase().trim();

    if (['hi', 'hello', 'hey', 'start', 'hii', 'menu', 'ഹലോ', 'ഹായ്'].includes(lower)) {
        const menu = waMessages.buildWelcomeMenu(from, customerName || 'there');
        return waSender.sendInteractive(client, from, menu);
    }

    if (lower === 'human' || lower === 'agent' || lower.includes('talk to human')) {
        updateSession(from, { awaitingHuman: true });
        return waSender.sendText(client, from, `Sure! 😊 Nammude team member ithu handle cheyyum.\nType 'hi' to restart.`);
    }

    // AI Chat — main path
    try {
        const activeAiConfig = client.aiConfig || aiConfig.get();
        if (!activeAiConfig.enabled) {
            return waSender.sendText(client, from, `Namaskaram! 😊 Nammude automated system ippo off aanu.`);
        }

        const reply = await chat(from, text, client);
        await waSender.sendText(client, from, reply);
    } catch (err) {
        console.error('❌ WA AI chat error:', err.message);
        await waSender.sendText(client, from, `Oru chinna issue und! 😅 Try again cheyyuka. 🙏`);
    }
}

// ─── Image Handler (Context Aware) ───────────────────────────────────────────
async function handleImageMessage(client, from, imageObj) {
    try {
        await waSender.sendText(client, from, `📸 Image kandu! Oru second... analysing! 🔍`);
        const token = client.whatsappToken || config.whatsappToken;

        const mediaUrlRes = await axios.get(`https://graph.facebook.com/v20.0/${imageObj.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const imageRes = await axios.get(mediaUrlRes.data.url, {
            responseType: 'arraybuffer',
            headers: { Authorization: `Bearer ${token}` },
        });

        const base64 = Buffer.from(imageRes.data).toString('base64');
        const reply = await analyzeImage(base64, imageObj.mime_type, from, client);
        await waSender.sendText(client, from, reply);

        const products = await getAllProducts(client.googleSheetsId);
        if (products.length > 0) {
            const buttons = waMessages.buildBuyNowButtons(from, products[0]);
            await waSender.sendInteractive(client, from, buttons);
        }
    } catch (err) {
        await waSender.sendText(client, from, `Image kandii, pakshe process cheyyaan pattunilla 😅`);
    }
}

// (Updating remainders of handlers to pass client...)
async function handleInteractiveMessage(client, from, customerName, interactive) {
    if (interactive.type === 'button_reply') {
        const id = interactive.button_reply.id;
        if (id === 'browse_products') {
            const products = await getAllProducts(client.googleSheetsId);
            const listMsg = waMessages.buildCategoryMenu(from, products);
            return waSender.sendInteractive(client, from, listMsg);
        }
        if (id === 'talk_to_human') {
            updateSession(from, { awaitingHuman: true });
            return waSender.sendText(client, from, `Connecting to team...`);
        }
        if (id.startsWith('confirm_buy_')) {
            const sku = id.replace('confirm_buy_', '');
            return handleConfirmBuy(client, from, customerName, sku);
        }
    }
}

async function handleConfirmBuy(client, from, customerName, sku) {
    const product = await findProductBySKU(sku, client.googleSheetsId);
    addToCart(from, product);
    updateSession(from, { awaitingAddress: true });
    return waSender.sendText(client, from, `✅ *${product.name}* added to cart! Please reply with your address.`);
}

async function processPurchase(client, from, session, address) {
    const total = getCartTotal(from);
    const orderRef = await createOrder({
        customerName: session.customerName || 'Customer',
        phone: from,
        items: session.cart,
        totalAmount: total,
        address,
        sheetsId: client.googleSheetsId
    });

    const baseUrl = process.env.RENDER_EXTERNAL_URL || `https://funbin-salesbot.onrender.com`;
    const payLink = `${baseUrl}/pay/${orderRef}?clientId=${client.id}`;

    await waSender.sendText(client, from, `🧾 *Order Placed!* \n💰 Total: ₹${total}\n📲 Pay here: ${payLink}`);
    updateSession(from, { cart: [] });
}

module.exports = { handleMessage };

module.exports = { handleMessage };
