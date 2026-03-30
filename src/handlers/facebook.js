const fbSender = require('../senders/facebook');
const { chat } = require('../ai/gemini');
const config = require('../config');

/**
 * Handle a Facebook Messenger direct message (Multi-tenant).
 */
async function handleDM({ senderId, message, client }) {
    console.log(`💬 [SaaS] FB DM from ${senderId} for client ${client?.id}`);
    const text = message.text || '';

    // Greeting → show menu
    if (['hi', 'hello', 'hey', 'menu', 'start'].includes(text.toLowerCase().trim())) {
        const menuMsg = fbSender.buildButtonTemplate(
            `Hai! Welcome to ${client?.name || config.storeName}! 🎉\nEng help cheyyam? 😊`,
            [
                { title: 'Browse Products', payload: 'BROWSE_PRODUCTS' },
                { title: 'Buy Now', payload: 'BUY_NOW' },
                { title: 'Talk to Human', payload: 'TALK_HUMAN' },
            ]
        );
        return fbSender.sendMessage(senderId, menuMsg, client);
    }

    // AI Chat
    try {
        const reply = await chat(senderId, text, client);
        await fbSender.sendMessage(senderId, reply, client);
    } catch (err) {
        console.error('❌ FB AI chat error:', err.message);
        const bizPhone = client?.whatsappBusinessNumber || config.whatsappBusinessNumber;
        await fbSender.sendMessage(
            senderId,
            `Oru issue und! 😅 WhatsApp-il message cheyyuka: wa.me/${bizPhone}`,
            client
        );
    }
}

/**
 * Handle a Facebook Messenger postback (button click)
 */
async function handlePostback({ senderId, postback, client }) {
    const payload = postback.payload || '';
    const bizPhone = client?.whatsappBusinessNumber || config.whatsappBusinessNumber;
    console.log(`🔘 [SaaS] FB Postback from ${senderId}: ${payload} (Client: ${client?.id})`);

    if (payload === 'TALK_HUMAN') {
        return fbSender.sendMessage(
            senderId,
            `Sure! Nammude team member ithu handle cheyyum 😊\nWhatsApp: wa.me/${bizPhone}`,
            client
        );
    }

    if (payload === 'BROWSE_PRODUCTS' || payload === 'BUY_NOW') {
        return fbSender.sendMessage(
            senderId,
            `Full catalog kaanaan WhatsApp-il vaa! 🛍️\nwa.me/${bizPhone}`,
            client
        );
    }

    // AI fallback
    try {
        const reply = await chat(senderId, postback.title || payload, client);
        await fbSender.sendMessage(senderId, reply, client);
    } catch (err) {
        await fbSender.sendMessage(senderId, 'Oru minute! Our team will help soon. 😊', client);
    }
}

module.exports = { handleDM, handlePostback };
