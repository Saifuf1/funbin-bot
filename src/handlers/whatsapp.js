const waSender = require('../senders/whatsapp');
const waMessages = require('../whatsapp/messages');
const { generateUPILink, buildPaymentMessage, buildCODMessage } = require('../whatsapp/upi');
const { chat, analyzeImage, analyzeAudio, validateDeliveryAddress } = require('../ai/gemini');
const { getOrCreateSession, updateSession, addToCart, getCartTotal } = require('../ai/context');
const { getAllProducts, getCategories, getProductsByCategory, findProductBySKU, formatProductForCustomer } = require('../db/products');
const { createOrder } = require('../db/orders');
const config = require('../config');
const axios = require('axios');

/**
 * Main WhatsApp message handler — the full AI shopping assistant.
 * @param {object} opts
 * @param {string} opts.from - Sender's phone number
 * @param {string} opts.customerName
 * @param {object} opts.message - Raw WhatsApp message object
 */
async function handleMessage({ from, customerName, message }) {
    console.log(`📱 WhatsApp from ${from} (${customerName}): type=${message.type}`);

    // Mark as read
    await waSender.markAsRead(message.id);

    // Update customer name in session
    const session = getOrCreateSession(from);
    if (customerName && !session.customerName) {
        updateSession(from, { customerName });
    }

    // Escalated to human — skip AI
    if (session.awaitingHuman) {
        return waSender.sendText(
            from,
            `Nammude team member ettu connect aagum! 😊\nUr message received.`
        );
    }

    const msgType = message.type;

    // ── Text Message ─────────────────────────────────────────────────────────
    if (msgType === 'text') {
        await handleTextMessage(from, customerName, message.text.body);
        return;
    }

    // ── Image Message ────────────────────────────────────────────────────────
    if (msgType === 'image') {
        await handleImageMessage(from, message.image);
        return;
    }

    // ── Interactive (List Reply or Button Reply) ───────────────────────────
    if (msgType === 'interactive') {
        await handleInteractiveMessage(from, customerName, message.interactive);
        return;
    }

    // ── Audio Message (Voice Note) ───────────────────────────────────────────
    if (msgType === 'audio') {
        await handleAudioMessage(from, message.audio);
        return;
    }

    // ── Sticker / Video — fallback ────────────────────────────────────────
    await waSender.sendText(
        from,
        `Ithu nte message kandilla 😅 Text cheytu chodichooo! 🙏`
    );
}

// ─── Audio Handler ────────────────────────────────────────────────────────────
async function handleAudioMessage(from, audioObj) {
    try {
        await waSender.sendText(from, `🎤 Voice note kettukondirikkukayaanu... oru minute! 🎧`);

        const mediaId = audioObj.id;
        const mimeType = audioObj.mime_type || 'audio/ogg';
        console.log(`🎤 Audio received: mediaId=${mediaId}, mime=${mimeType}`);

        // Step 1: Resolve media download URL
        let downloadUrl;
        try {
            const mediaUrlRes = await axios.get(
                `https://graph.facebook.com/v20.0/${mediaId}`,
                { headers: { Authorization: `Bearer ${config.whatsappToken}` } }
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
                headers: { Authorization: `Bearer ${config.whatsappToken}` },
            });
            base64 = Buffer.from(audioRes.data).toString('base64');
            console.log(`🎤 Audio downloaded: ${audioRes.data.byteLength} bytes`);
        } catch (e) {
            console.error('❌ Failed to download audio bytes:', e.message);
            throw new Error('Audio download failed');
        }

        // Step 3: Gemini Audio analysis
        const reply = await analyzeAudio(base64, mimeType, from);
        await waSender.sendText(from, reply);

    } catch (err) {
        console.error('❌ Audio handler error:', err.message);
        try {
            await waSender.sendText(
                from,
                `Voice note process cheyyam pattunnilla 😅\nOru text message aayi chodikkamo? 🙏`
            );
        } catch (sendErr) {
            console.error('❌ Also failed to send audio error reply:', sendErr.message);
        }
    }
}

// ─── Text Handler ─────────────────────────────────────────────────────────────
async function handleTextMessage(from, customerName, text) {
    const session = getOrCreateSession(from);

    // Awaiting delivery address?
    if (session.awaitingAddress) {
        const validation = await validateDeliveryAddress(text);

        if (validation.valid) {
            updateSession(from, { awaitingAddress: false, deliveryAddress: validation.formatted });
            console.log(`🏠 Valid Address received for ${from}`);
            return processPurchase(from, session, validation.formatted);
        } else {
            console.log(`⚠️ Invalid address attempt from ${from}`);
            return waSender.sendText(from, validation.message);
        }
    }

    const lower = text.toLowerCase().trim();

    // Greeting → Welcome menu
    if (['hi', 'hello', 'hey', 'start', 'hii', 'menu', 'ഹലോ', 'ഹായ്'].includes(lower)) {
        const menu = waMessages.buildWelcomeMenu(from, customerName || 'there');
        return waSender.sendInteractive(from, menu);
    }

    // HUMAN escalation keyword
    if (lower === 'human' || lower === 'agent' || lower.includes('talk to human')) {
        updateSession(from, { awaitingHuman: true });
        return waSender.sendText(
            from,
            `Sure! 😊 Nammude team member ithu handle cheyyum.\n` +
            `Oru message leave cheyyuka, jaldi reply cheyyam! 🙏\n\n` +
            `_(Type 'hi' to restart the bot later)_`
        );
    }

    // Order status check
    if (lower.includes('my order') || lower.includes('order status') || lower.includes('tracking')) {
        return waSender.sendText(
            from,
            `Ur order status check cheyyaan nammude team-ne contact cheyyuka.\n` +
            `Or ur order ref share cheyyuka (starts with ORD-)! 📦`
        );
    }

    // AI Chat — main path
    try {
        console.log(`🤖 Calling Gemini for: ${from} | text: "${text.slice(0, 60)}"`);
        const reply = await chat(from, text);
        console.log(`🤖 Gemini reply ready, sending to ${from}`);
        await waSender.sendText(from, reply);
    } catch (err) {
        console.error('❌ WA AI chat error:', err.message);
        console.error('   Stack:', err.stack);
        // Try sending error message — if this also fails, log but don't crash
        try {
            await waSender.sendText(
                from,
                `Oru chinna issue und! 😅 Oru minute try again cheyyuka. 🙏`
            );
        } catch (sendErr) {
            console.error('❌ Also failed to send error message:', sendErr.message);
        }
    }
}

// ─── Image Handler ────────────────────────────────────────────────────────────
async function handleImageMessage(from, imageObj) {
    try {
        await waSender.sendText(from, `📸 Image kandii! Oru second... analysing! 🔍`);

        const mediaId = imageObj.id;
        const mimeType = imageObj.mime_type || 'image/jpeg';
        console.log(`🖼️  Image received: mediaId=${mediaId}, mime=${mimeType}`);

        // Step 1: Resolve media download URL
        let downloadUrl;
        try {
            const mediaUrlRes = await axios.get(
                `https://graph.facebook.com/v20.0/${mediaId}`,
                { headers: { Authorization: `Bearer ${config.whatsappToken}` } }
            );
            downloadUrl = mediaUrlRes.data.url;
            console.log(`🖼️  Media URL resolved: ${downloadUrl?.slice(0, 60)}...`);
        } catch (e) {
            console.error('❌ Failed to resolve media URL:', e.response?.data || e.message);
            throw new Error('Media URL resolution failed — token may be expired');
        }

        // Step 2: Download image bytes
        let base64;
        try {
            const imageRes = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                headers: { Authorization: `Bearer ${config.whatsappToken}` },
            });
            base64 = Buffer.from(imageRes.data).toString('base64');
            console.log(`🖼️  Image downloaded: ${imageRes.data.byteLength} bytes`);
        } catch (e) {
            console.error('❌ Failed to download image bytes:', e.message);
            throw new Error('Image download failed');
        }

        // Step 3: Gemini Vision analysis
        const reply = await analyzeImage(base64, mimeType, from);
        await waSender.sendText(from, reply);

        // Step 4: Show buy buttons for first product match
        const products = await getAllProducts();
        if (products.length > 0) {
            const firstMatch = products[0];
            const buttons = waMessages.buildBuyNowButtons(from, firstMatch);
            await waSender.sendInteractive(from, buttons);
        }
    } catch (err) {
        console.error('❌ Image handler error:', err.message);
        try {
            await waSender.sendText(
                from,
                `Image kandii, pakshe process cheyyaan pattunilla 😅\nOru clear screenshot ayakkam! 📸`
            );
        } catch (sendErr) {
            console.error('❌ Also failed to send image error reply:', sendErr.message);
        }
    }
}

// ─── Interactive Message Handler ──────────────────────────────────────────────
async function handleInteractiveMessage(from, customerName, interactive) {
    const type = interactive.type; // 'button_reply' or 'list_reply'

    if (type === 'button_reply') {
        await handleButtonReply(from, customerName, interactive.button_reply);
    } else if (type === 'list_reply') {
        await handleListReply(from, customerName, interactive.list_reply);
    }
}

async function handleButtonReply(from, customerName, reply) {
    const id = reply.id;
    const title = reply.title;
    console.log(`🔘 Button reply from ${from}: ${id}`);

    // BROWSE PRODUCTS
    if (id === 'browse_products') {
        const products = await getAllProducts();
        if (!products.length) {
            return waSender.sendText(from, `Products currently loading. Oru minute! 😊`);
        }
        const listMsg = waMessages.buildCategoryMenu(from, products);
        return waSender.sendInteractive(from, listMsg);
    }

    // TALK TO HUMAN
    if (id === 'talk_to_human') {
        updateSession(from, { awaitingHuman: true });
        return waSender.sendText(
            from,
            `Okay! Nammude team member ettu connect aagum! 😊\n` +
            `_(Type 'hi' to restart the bot later)_`
        );
    }

    // BUY NOW (generic — from welcome menu)
    if (id === 'buy_now') {
        const session = getOrCreateSession(from);
        if (session.cart.length > 0) {
            return processPurchase(from, session);
        }
        // Show product list first
        const products = await getAllProducts();
        const listMsg = waMessages.buildCategoryMenu(from, products);
        await waSender.sendText(from, `Oru product select cheyyuka aadhyam! 👇`);
        return waSender.sendInteractive(from, listMsg);
    }

    // CONFIRM BUY (specific product SKU)
    if (id.startsWith('confirm_buy_')) {
        const sku = id.replace('confirm_buy_', '');
        return handleConfirmBuy(from, customerName, sku);
    }

    // Fallback
    try {
        const reply = await chat(from, title);
        await waSender.sendText(from, reply);
    } catch {
        await waSender.sendText(from, `Got it! Type your question and I'll help. 😊`);
    }
}

async function handleListReply(from, customerName, reply) {
    const id = reply.id;
    const title = reply.title;
    console.log(`📋 List reply from ${from}: ${id} (${title})`);

    // Product selected from category list
    if (id.startsWith('product_')) {
        const sku = id.replace('product_', '');
        const product = await findProductBySKU(sku);
        if (!product) {
            return waSender.sendText(from, `Product kandilla! Admin-ne contact cheyyuka. 😊`);
        }

        // Send product details
        await waSender.sendText(from, formatProductForCustomer(product));

        // Send product image — skip Amazon CDN URLs (hotlink blocked by WhatsApp servers)
        const BLOCKED_HOSTS = ['m.media-amazon.com', 'amazon.com', 'amzn.to', 'ssl-images-amazon'];
        const imageUrl = product.imageUrl || '';
        const isBlocked = BLOCKED_HOSTS.some((host) => imageUrl.includes(host));

        if (imageUrl && !isBlocked) {
            try {
                await waSender.sendImage(from, imageUrl, product.name);
            } catch (imgErr) {
                console.warn(`⚠️  Image send failed for ${product.name}: ${imgErr.message}`);
            }
        } else if (isBlocked) {
            console.log(`⚠️  Skipping Amazon CDN image for ${product.name} — not accessible by WhatsApp servers`);
        }

        // Send buy buttons
        const buttons = waMessages.buildBuyNowButtons(from, product);
        return waSender.sendInteractive(from, buttons);
    }
}

// ─── Buy Flow Helpers ─────────────────────────────────────────────────────────
async function handleConfirmBuy(from, customerName, sku) {
    const product = await findProductBySKU(sku);
    if (!product) {
        return waSender.sendText(from, `Oru issue und 😅 Restart cheyyuka.`);
    }

    // Add to cart
    addToCart(from, product);
    const total = getCartTotal(from);

    // Ask for Delivery Address instead of showing payment buttons
    updateSession(from, { awaitingAddress: true });

    const message =
        `✅ *${product.name}* added to cart!\n` +
        `💰 Total: ₹${total}\n\n` +
        `Please reply with your full *Delivery Address, Pincode, and Phone Number* to proceed with the order. 🚚`;

    return waSender.sendText(from, message);
}

async function processPurchase(from, session, address) {
    const total = getCartTotal(from);
    const upiLink = generateUPILink(total, from, `ORD-${from}`);

    let orderRef;
    try {
        orderRef = await createOrder({
            customerName: session.customerName || 'Customer',
            phone: from,
            items: session.cart,
            totalAmount: total,
            paymentLink: upiLink,
            address: address, // Save address to Google Sheet
        });
    } catch (e) {
        console.error('❌ Order save error:', e.message);
        orderRef = `ORD-${from}-${Date.now()}`;
    }

    // Save to payment store for the redirect page
    const { savePayment } = require('../pay/store');
    const productName = session.cart.map((i) => `${i.name} x${i.qty || 1}`).join(', ');
    savePayment(orderRef, {
        storeName: config.storeName || 'Fun bin',
        amount: total,
        productName,
        upiId: config.upiId,
        upiLink,
        orderRef,
    });

    // Generate clickable HTTPS payment link
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `https://funbin-salesbot.onrender.com`;
    const payLink = `${baseUrl}/pay/${orderRef}`;

    const itemLines = session.cart
        .map((i) => `  • ${i.name} x${i.qty || 1} — ₹${i.price * (i.qty || 1)}`)
        .join('\n');

    const text =
        `🧾 *Order Placed!*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `${itemLines}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💰 *Total: ₹${total}*\n\n` +
        `📲 *Click to Pay ↓*\n` +
        `${payLink}\n\n` +
        `☝️ Please click the link to pay via GPay / PhonePe / Paytm.\n\n` +
        `*Awaiting payment screenshot to confirm your order!* ✅\n` +
        `🔑 Ref: \`${orderRef}\``;

    // Clear cart
    updateSession(from, { cart: [] });

    return waSender.sendText(from, text);
}

module.exports = { handleMessage };
