const igSender = require('../senders/instagram');
const { chat, quickReply } = require('../ai/gemini');
const config = require('../config');

/**
 * Handle a new comment on an Instagram post/reel (Multi-tenant).
 */
async function handleComment({ commentId, commenterId, commenterName, commentText, client }) {
    console.log(`📸 [SaaS] IG Comment from ${commenterName} for client ${client?.id}`);

    const bizPhone = client?.whatsappBusinessNumber || config.whatsappBusinessNumber;
    const waLink = `https://wa.me/${bizPhone}?text=${encodeURIComponent(
        `Hi! I saw your post on Instagram and I'm interested. 😊`
    )}`;

    // Use AI to generate a personalised reply
    let replyText;
    try {
        replyText = await quickReply(
            `A customer named "${commenterName}" commented on our Instagram post: "${commentText}". 
Write a short, friendly reply (1-2 sentences max) inviting them to WhatsApp for more details.
End with this exact WhatsApp link: ${waLink}
Keep it natural, not spammy.`,
            client
        );
    } catch (err) {
        replyText = `Hi ${commenterName}! 👋 Nammude collection full-ah WhatsApp-il kaanaam! DM us: ${waLink}`;
    }

    await igSender.sendPrivateReply(commentId, replyText, client);
}

/**
 * Handle an Instagram Direct Message (Multi-tenant).
 */
async function handleDM({ senderId, message, client }) {
    console.log(`💬 [SaaS] IG DM from ${senderId} for client ${client?.id}`);
    const text = message.text || '';

    if (text.toLowerCase() === 'menu' || text.toLowerCase() === 'hi' || text.toLowerCase() === 'hello') {
        const menuMsg = igSender.buildButtonTemplate(
            `Hai! Welcome to ${client?.name || config.storeName} 🛍️\n\nIku help cheyyam?`,
            [
                { title: 'Browse Products', payload: 'BROWSE_PRODUCTS' },
                { title: 'Buy Now', payload: 'BUY_NOW' },
                { title: 'Talk to Human', payload: 'TALK_HUMAN' },
            ]
        );
        return igSender.sendDM(senderId, menuMsg, client);
    }

    // AI Chat
    try {
        const reply = await chat(senderId, text, client);
        await igSender.sendDM(senderId, reply, client);
    } catch (err) {
        console.error('❌ IG AI chat error:', err.message);
        const bizPhone = client?.whatsappBusinessNumber || config.whatsappBusinessNumber;
        await igSender.sendDM(
            senderId,
            `Sorry, oru chinna issue und! 😅 WhatsApp-il message cheyyuka: wa.me/${bizPhone}`,
            client
        );
    }
}

/**
 * Handle Instagram postback (button click)
 */
async function handlePostback({ senderId, postback, client }) {
    const payload = postback.payload || '';
    const bizPhone = client?.whatsappBusinessNumber || config.whatsappBusinessNumber;

    if (payload === 'TALK_HUMAN') {
        return igSender.sendDM(
            senderId,
            `Sure! Our team member will connect soon. 😊\nOr WhatsApp: wa.me/${bizPhone}`,
            client
        );
    }

    if (payload === 'BROWSE_PRODUCTS' || payload === 'BUY_NOW') {
        return igSender.sendDM(
            senderId,
            `Full catalog kaanaan WhatsApp-il vaa! 🛍️\nwa.me/${bizPhone}?text=${encodeURIComponent(
                'Hi! I want to see your products 😊'
            )}`,
            client
        );
    }

    // Generic AI fallback
    try {
        const reply = await chat(senderId, postback.title || payload, client);
        await igSender.sendDM(senderId, reply, client);
    } catch (err) {
        await igSender.sendDM(senderId, 'Oru minute! Our team will assist you soon. 😊', client);
    }
}

module.exports = { handleComment, handleDM, handlePostback };
