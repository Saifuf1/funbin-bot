const fbSender = require('../senders/facebook');
const { chat } = require('../ai/gemini');
const config = require('../config');

/**
 * Handle a Facebook Messenger direct message.
 */
async function handleDM({ senderId, message }) {
    console.log(`💬 FB DM from ${senderId}`);
    const text = message.text || '';

    // Greeting → show menu
    if (['hi', 'hello', 'hey', 'menu', 'start'].includes(text.toLowerCase().trim())) {
        const menuMsg = fbSender.buildButtonTemplate(
            `Hai! Welcome to ${config.storeName}! 🎉\nEng help cheyyam? 😊`,
            [
                { title: 'Browse Products', payload: 'BROWSE_PRODUCTS' },
                { title: 'Buy Now', payload: 'BUY_NOW' },
                { title: 'Talk to Human', payload: 'TALK_HUMAN' },
            ]
        );
        return fbSender.sendMessage(senderId, menuMsg);
    }

    // AI Chat
    try {
        const reply = await chat(senderId, text);
        await fbSender.sendMessage(senderId, reply);
    } catch (err) {
        console.error('❌ FB AI chat error:', err.message);
        await fbSender.sendMessage(
            senderId,
            `Oru issue und! 😅 WhatsApp-il message cheyyuka: wa.me/${config.whatsappBusinessNumber}`
        );
    }
}

/**
 * Handle a Facebook Messenger postback (button click)
 */
async function handlePostback({ senderId, postback }) {
    const payload = postback.payload || '';
    console.log(`🔘 FB Postback from ${senderId}: ${payload}`);

    if (payload === 'TALK_HUMAN') {
        return fbSender.sendMessage(
            senderId,
            `Sure! Nammude team member ithu handle cheyyum 😊\nWhatsApp: wa.me/${config.whatsappBusinessNumber}`
        );
    }

    if (payload === 'BROWSE_PRODUCTS' || payload === 'BUY_NOW') {
        return fbSender.sendMessage(
            senderId,
            `Full catalog kaanaan WhatsApp-il vaa! 🛍️\nwa.me/${config.whatsappBusinessNumber}`
        );
    }

    // AI fallback
    try {
        const reply = await chat(senderId, postback.title || payload);
        await fbSender.sendMessage(senderId, reply);
    } catch (err) {
        await fbSender.sendMessage(senderId, 'Oru minute! Our team will help soon. 😊');
    }
}

module.exports = { handleDM, handlePostback };
