/**
 * In-memory session store for conversation history.
 * Keyed by senderId (WhatsApp phone / IG/FB PSID).
 * Each session expires after SESSION_TTL_MS of inactivity.
 */

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const sessions = new Map();

function getSession(userId) {
    const session = sessions.get(userId);
    if (!session) return null;

    // Check expiry
    if (Date.now() - session.lastActivity > SESSION_TTL_MS) {
        sessions.delete(userId);
        return null;
    }

    session.lastActivity = Date.now();
    return session;
}

function getOrCreateSession(userId) {
    let session = getSession(userId);
    if (!session) {
        session = {
            userId,
            history: [],        // Gemini conversation history [{role, parts}]
            cart: [],           // [{sku, name, price, qty}]
            customerName: null,
            phone: userId,
            lastActivity: Date.now(),
            awaitingHuman: false,
        };
        sessions.set(userId, session);
    }
    return session;
}

function updateSession(userId, updates) {
    const session = getOrCreateSession(userId);
    Object.assign(session, updates, { lastActivity: Date.now() });
    sessions.set(userId, session);
}

function clearSession(userId) {
    sessions.delete(userId);
}

function addToHistory(userId, role, text) {
    const session = getOrCreateSession(userId);
    session.history.push({ role, parts: [{ text }] });
    // Cap history at 20 turns to save tokens
    if (session.history.length > 40) {
        session.history = session.history.slice(-40);
    }
    session.lastActivity = Date.now();
}

function addToCart(userId, item) {
    const session = getOrCreateSession(userId);
    const existing = session.cart.find((i) => i.sku === item.sku);
    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
    } else {
        session.cart.push({ ...item, qty: 1 });
    }
}

function getCartTotal(userId) {
    const session = getOrCreateSession(userId);
    return session.cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
}

// Cleanup expired sessions every 15 minutes
setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (now - session.lastActivity > SESSION_TTL_MS) {
            sessions.delete(id);
        }
    }
}, 15 * 60 * 1000);

module.exports = {
    getOrCreateSession,
    getSession,
    updateSession,
    clearSession,
    addToHistory,
    addToCart,
    getCartTotal,
};
