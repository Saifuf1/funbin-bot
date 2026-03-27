/**
 * In-memory payment store.
 * Maps orderId → payment details for the redirect page.
 * Entries expire after 24 hours to prevent memory leaks.
 */

const store = new Map();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function savePayment(orderId, data) {
    store.set(orderId, { ...data, createdAt: Date.now() });
    // Auto-cleanup after TTL
    setTimeout(() => store.delete(orderId), TTL_MS);
}

function getPayment(orderId) {
    const entry = store.get(orderId);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > TTL_MS) {
        store.delete(orderId);
        return null;
    }
    return entry;
}

module.exports = { savePayment, getPayment };
