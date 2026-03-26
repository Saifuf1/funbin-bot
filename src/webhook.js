const express = require('express');
const crypto = require('crypto');
const config = require('./config');
const router = require('./router');

const webhookRouter = express.Router();

/**
 * GET /webhook — Meta hub challenge verification
 */
webhookRouter.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.metaVerifyToken) {
        console.log('✅ Webhook verified by Meta');
        return res.status(200).send(challenge);
    }
    console.warn('⚠️  Webhook verification failed — token mismatch');
    return res.sendStatus(403);
});

/**
 * POST /webhook — Receive Meta platform events
 */
webhookRouter.post('/', (req, res) => {
    // Verify X-Hub-Signature-256
    const sig = req.headers['x-hub-signature-256'];
    if (!verifySignature(req.body, sig)) {
        console.warn('⚠️  Invalid signature — rejecting request');
        return res.sendStatus(401);
    }

    // Parse raw body back to JSON
    let body;
    try {
        body = JSON.parse(req.body.toString('utf8'));
    } catch (e) {
        console.error('❌ Failed to parse webhook body:', e.message);
        return res.sendStatus(400);
    }

    // Acknowledge immediately (Meta requires 200 within 20s)
    res.sendStatus(200);

    // Route asynchronously
    router.handleEvent(body).catch((err) => {
        console.error('❌ Error handling webhook event:', err.message);
    });
});

/**
 * Verify HMAC-SHA256 signature from Meta
 */
function verifySignature(rawBody, signature) {
    if (!signature) return false;
    const expected = crypto
        .createHmac('sha256', config.metaAppSecret)
        .update(rawBody)
        .digest('hex');
    const received = signature.replace('sha256=', '');
    try {
        return crypto.timingSafeEqual(
            Buffer.from(expected, 'hex'),
            Buffer.from(received, 'hex')
        );
    } catch {
        return false;
    }
}

module.exports = webhookRouter;
