const igSender = require('../senders/instagram');
const { chat, quickReply } = require('../ai/gemini');
const config = require('../config');

/**
 * Handle a new comment on an Instagram post/reel.
 * Sends a private reply (appears in commenter's DM) with WhatsApp CTA.
 */
async function handleComment({ commentId, commenterId, commenterName, commentText, mediaId }) {
    console.log(`📸 IG Comment from ${commenterName}: "${commentText}"`);

    const waLink = `https://wa.me/${config.whatsappBusinessNumber}?text=${encodeURIComponent(
        `Hi! I saw your post and I'm interested. 😊`
    )}`;

    // Use AI to generate a personalised reply
    let replyText;
    try {
        replyText = await quickReply(
            `A customer named "${commenterName}" commented on our Instagram post: "${commentText}". 
Write a short, friendly reply (1-2 sentences max) in Manglish inviting them to WhatsApp for more details.
End with this exact WhatsApp link: ${waLink}
Keep it natural, not spammy.`
        );
    } catch (err) {
        // Fallback reply
        replyText = `Hi ${commenterName}! 👋 Nammude collection full-ah WhatsApp-il kaanaam! DM us: ${waLink}`;
    }

    await igSender.sendPrivateReply(commentId, replyText);
}

/**
 * Handle an Instagram Direct Message.
 * Routes to AI chat or shows a menu.
 */
async function handleDM({ senderId, message }) {
    console.log(`💬 IG DM from ${senderId}`);
    const text = message.text || '';

    // Check for postback-like keywords
    if (text.toLowerCase() === 'menu' || text.toLowerCase() === 'hi' || text.toLowerCase() === 'hello') {
        const menuMsg = igSender.buildButtonTemplate(
            `Hai! Welcome to ${config.storeName} 🛍️\n\nIku help cheyyam?`,
            [
                { title: 'Browse Products', payload: 'BROWSE_PRODUCTS' },
                { title: 'Buy Now', payload: 'BUY_NOW' },
                { title: 'Talk to Human', payload: 'TALK_HUMAN' },
            ]
        );
        return igSender.sendDM(senderId, menuMsg);
    }

    // AI Chat
    try {
        const reply = await chat(senderId, text);
        await igSender.sendDM(senderId, reply);
    } catch (err) {
        console.error('❌ IG AI chat error:', err.message);
        await igSender.sendDM(
            senderId,
            `Sorry, oru chinna issue und! 😅 WhatsApp-il message cheyyuka: wa.me/${config.whatsappBusinessNumber}`
        );
    }
}

/**
 * Handle Instagram postback (button click)
 */
async function handlePostback({ senderId, postback }) {
    const payload = postback.payload || '';
    console.log(`🔘 IG Postback from ${senderId}: ${payload}`);

    if (payload === 'TALK_HUMAN') {
        return igSender.sendDM(
            senderId,
            `Sure! Our team member will connect soon. 😊\nOr WhatsApp: wa.me/${config.whatsappBusinessNumber}`
        );
    }

    if (payload === 'BROWSE_PRODUCTS' || payload === 'BUY_NOW') {
        return igSender.sendDM(
            senderId,
            `Full catalog kaanaan WhatsApp-il vaa! 🛍️\nwa.me/${config.whatsappBusinessNumber}?text=${encodeURIComponent(
                'Hi! I want to see your products 😊'
            )}`
        );
    }

    // Generic AI fallback
    try {
        const reply = await chat(senderId, postback.title || payload);
        await igSender.sendDM(senderId, reply);
    } catch (err) {
        await igSender.sendDM(senderId, 'Oru minute! Our team will assist you soon. 😊');
    }
}

module.exports = { handleComment, handleDM, handlePostback };
