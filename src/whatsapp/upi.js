const config = require('../config');

/**
 * Generate a UPI deep link for payment.
 *
 * Format: upi://pay?pa=UPI_ID&pn=STORE&am=AMOUNT&tn=ORDER_REF&cu=INR
 *
 * @param {number} amount - Total amount in INR
 * @param {string} phone - Customer's phone number (used in transaction note)
 * @param {string} [orderRef] - Order reference string
 * @returns {string} UPI deep link
 */
function generateUPILink(amount, phone, orderRef) {
    const transactionNote = orderRef || `Order_${phone}`;
    const params = new URLSearchParams({
        pa: config.upiId,
        pn: config.storeName,
        am: amount.toFixed(2),
        tn: transactionNote,
        cu: 'INR',
    });
    return `upi://pay?${params.toString()}`;
}

/**
 * Build the full payment message text to send on WhatsApp.
 *
 * @param {object} opts
 * @param {Array} opts.items - Cart items [{name, price, qty}]
 * @param {number} opts.total
 * @param {string} opts.phone
 * @param {string} opts.orderRef
 * @returns {{ text: string, upiLink: string }}
 */
function buildPaymentMessage({ items, total, phone, orderRef }) {
    const upiLink = generateUPILink(total, phone, orderRef);
    const shortRef = orderRef?.split('-').slice(-1)[0] || phone.slice(-4);

    const itemLines = items
        .map((i) => `  • ${i.name} x${i.qty || 1} — ₹${i.price * (i.qty || 1)}`)
        .join('\n');

    const text =
        `🧾 *Order Summary*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `${itemLines}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💰 *Total: ₹${total}*\n\n` +
        `📲 *UPI Payment Steps:*\n` +
        `1️⃣ Open *Google Pay / PhonePe / Paytm*\n` +
        `2️⃣ Tap "Pay" or "Send Money"\n` +
        `3️⃣ Enter UPI ID: *${config.upiId}*\n` +
        `4️⃣ Amount: *₹${total}*\n` +
        `5️⃣ Note/Remarks: \`${shortRef}\`\n` +
        `6️⃣ Pay cheythu kazhinju screenshot ayakkoo! 📸✅\n\n` +
        `🔑 Order Ref: \`${orderRef}\``;

    return { text, upiLink };
}

/**
 * Build a COD (Cash on Delivery) confirmation message
 */
function buildCODMessage({ items, total, phone, orderRef, address }) {
    const itemLines = items
        .map((i) => `  • ${i.name} x${i.qty || 1} — ₹${i.price * (i.qty || 1)}`)
        .join('\n');

    return (
        `✅ *Order Confirmed (COD)!*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `${itemLines}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💰 *Total: ₹${total}* (Pay on Delivery)\n` +
        `📍 Address: ${address}\n` +
        `🔑 Order Ref: \`${orderRef}\`\n\n` +
        `Delivery 3-5 working days! 🚚\n` +
        `Questions? Just message ethe! 😊`
    );
}

module.exports = { generateUPILink, buildPaymentMessage, buildCODMessage };
