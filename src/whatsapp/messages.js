const config = require('../config');

/**
 * Build a WhatsApp Interactive List Message payload.
 * Used for multi-item menus like product categories.
 *
 * @param {string} to - Recipient phone number
 * @param {string} headerText
 * @param {string} bodyText
 * @param {string} footerText
 * @param {string} buttonLabel - The "Open list" button text (max 20 chars)
 * @param {Array<{title: string, rows: Array<{id: string, title: string, description: string}>}>} sections
 * @returns {object} WhatsApp API payload
 */
function buildListMessage(to, headerText, bodyText, footerText, buttonLabel, sections) {
    return {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
            type: 'list',
            header: { type: 'text', text: headerText },
            body: { text: bodyText },
            footer: { text: footerText },
            action: {
                button: buttonLabel.slice(0, 20),
                sections: sections.map((s) => ({
                    title: s.title.slice(0, 24),
                    rows: s.rows.map((r) => ({
                        id: String(r.id).slice(0, 200),
                        title: String(r.title).slice(0, 24),
                        description: String(r.description || '').slice(0, 72),
                    })),
                })),
            },
        },
    };
}

/**
 * Build a WhatsApp Interactive Reply Buttons payload.
 * Max 3 buttons.
 *
 * @param {string} to
 * @param {string} bodyText
 * @param {Array<{id: string, title: string}>} buttons - max 3
 * @param {string} [headerText]
 * @param {string} [footerText]
 * @returns {object}
 */
function buildReplyButtons(to, bodyText, buttons, headerText = '', footerText = '') {
    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text: bodyText },
            action: {
                buttons: buttons.slice(0, 3).map((b) => ({
                    type: 'reply',
                    reply: {
                        id: String(b.id).slice(0, 256),
                        title: String(b.title).slice(0, 20),
                    },
                })),
            },
        },
    };

    if (headerText) {
        payload.interactive.header = { type: 'text', text: headerText };
    }
    if (footerText) {
        payload.interactive.footer = { text: footerText };
    }

    return payload;
}

/**
 * Build a category-browse list message from product categories.
 * Groups products by material/category.
 *
 * @param {string} to
 * @param {Array} products - from getAllProducts()
 * @returns {object} - WhatsApp list message payload
 */
function buildCategoryMenu(to, products) {
    // Group products by material (category)
    const grouped = {};
    for (const p of products) {
        const cat = p.material || 'Other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(p);
    }

    const sections = Object.entries(grouped)
        .slice(0, 10) // Max 10 sections
        .map(([category, items]) => ({
            title: category,
            rows: items.slice(0, 10).map((p) => ({
                id: `product_${p.sku}`,
                title: p.name.slice(0, 24),
                description: `₹${p.price} | ${p.stockStatus}`,
            })),
        }));

    return buildListMessage(
        to,
        `🛍️ ${config.storeName}`,
        'Nammalude collection nokku! Oru category select cheyyuka 👇',
        'Powered by AI Sales Bot',
        '📦 Browse Products',
        sections
    );
}

/**
 * Build the main welcome menu buttons (shown to new customers)
 */
function buildWelcomeMenu(to, customerName) {
    return buildReplyButtons(
        to,
        `Hai ${customerName}! 👋\n${config.storeName}-nte WhatsApp-il swagatham! 🎉\n\nNjaan evide help cheyyam?`,
        [
            { id: 'browse_products', title: '🛍️ Browse Products' },
            { id: 'buy_now', title: '🛒 Buy Now' },
            { id: 'talk_to_human', title: '👨‍💼 Talk to Human' },
        ],
        `Welcome to ${config.storeName}!`,
        'Reply below or type your question'
    );
}

/**
 * Build "Buy Now" confirmation buttons for a product
 */
function buildBuyNowButtons(to, product) {
    return buildReplyButtons(
        to,
        `*${product.name}*\n💰 ₹${product.price}\n🧵 ${product.material}\n\nIdu vangaano? 😊`,
        [
            { id: `confirm_buy_${product.sku}`, title: '✅ Yes, Buy Now!' },
            { id: 'browse_products', title: '👀 See More' },
        ],
        '🛒 Interested?',
        'We accept UPI & COD'
    );
}

module.exports = {
    buildListMessage,
    buildReplyButtons,
    buildCategoryMenu,
    buildWelcomeMenu,
    buildBuyNowButtons,
};
