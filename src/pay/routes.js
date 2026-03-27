const express = require('express');
const { getPayment } = require('./store');
const { buildPaymentHTML } = require('./page');

const payRouter = express.Router();

/**
 * GET /pay/:orderId
 * Serves the payment redirect page for a specific order.
 * Customer clicks this link in WhatsApp → opens browser → auto-redirects to UPI app.
 */
payRouter.get('/:orderId', (req, res) => {
    const { orderId } = req.params;
    const payment = getPayment(orderId);

    if (!payment) {
        return res.status(404).send(`
            <!DOCTYPE html>
            <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>body{font-family:Inter,sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}
            .card{background:#141414;border-radius:24px;padding:40px 32px;max-width:400px;border:1px solid rgba(255,255,255,.08)}
            h2{margin-bottom:12px} p{color:rgba(255,255,255,.5);font-size:14px}</style></head>
            <body><div class="card"><h2>⏰ Payment Link Expired</h2>
            <p>This payment link has expired or is invalid.<br/>Please request a new one on WhatsApp.</p></div></body></html>
        `);
    }

    const html = buildPaymentHTML(payment);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

module.exports = payRouter;
