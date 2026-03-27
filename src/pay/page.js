/**
 * Generates the HTML for the UPI payment redirect page.
 * Minimalist dark design that auto-opens the UPI app.
 */

function buildPaymentHTML({ storeName, amount, productName, upiId, upiLink, orderRef }) {
    const shortRef = orderRef?.split('-').slice(-1)[0] || orderRef;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pay ₹${amount} — ${storeName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0a0a0a;
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .card {
      background: #141414;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 40px 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
    }

    .store-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 100px;
      padding: 6px 16px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 32px;
    }

    .amount {
      font-size: 56px;
      font-weight: 700;
      letter-spacing: -2px;
      line-height: 1;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.75) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .product-name {
      font-size: 15px;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 36px;
      font-weight: 400;
    }

    .divider {
      height: 1px;
      background: rgba(255,255,255,0.07);
      margin-bottom: 36px;
    }

    .upi-btn {
      display: block;
      width: 100%;
      padding: 18px;
      background: #2563eb;
      color: #fff;
      text-decoration: none;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.3px;
      margin-bottom: 12px;
      cursor: pointer;
      border: none;
      transition: background 0.2s, transform 0.1s;
    }

    .upi-btn:hover { background: #1d4ed8; }
    .upi-btn:active { transform: scale(0.98); }

    .upi-btn.secondary {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.8);
    }
    .upi-btn.secondary:hover { background: rgba(255,255,255,0.1); }

    .upi-info {
      margin-top: 28px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.07);
    }

    .upi-info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .upi-info-row:last-child { margin-bottom: 0; }

    .upi-label {
      font-size: 12px;
      color: rgba(255,255,255,0.4);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .upi-value {
      font-size: 13px;
      font-weight: 500;
      color: rgba(255,255,255,0.85);
      font-family: 'SF Mono', 'Fira Code', monospace;
    }

    .status-bar {
      margin-top: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      color: rgba(255,255,255,0.35);
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .footer {
      margin-top: 28px;
      font-size: 12px;
      color: rgba(255,255,255,0.2);
    }

    .redirect-notice {
      font-size: 12px;
      color: rgba(255,255,255,0.3);
      margin-top: 12px;
    }

    /* App icon grid */
    .apps {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 24px;
    }
    .app-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: rgba(255,255,255,0.4);
    }
    .app-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(255,255,255,0.07);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="store-badge">🛍️ ${storeName}</div>

    <div class="amount">₹${amount}</div>
    <div class="product-name">${productName}</div>

    <div class="apps">
      <div class="app-chip"><div class="app-icon">G</div>GPay</div>
      <div class="app-chip"><div class="app-icon">📱</div>PhonePe</div>
      <div class="app-chip"><div class="app-icon">P</div>Paytm</div>
    </div>

    <a class="upi-btn" id="payBtn" href="${upiLink}">
      💳 Pay Now with UPI
    </a>
    <a class="upi-btn secondary" href="${upiLink}">
      Open Payment App Manually
    </a>

    <div class="divider"></div>

    <div class="upi-info">
      <div class="upi-info-row">
        <span class="upi-label">UPI ID</span>
        <span class="upi-value">${upiId}</span>
      </div>
      <div class="upi-info-row">
        <span class="upi-label">Amount</span>
        <span class="upi-value">₹${amount}</span>
      </div>
      <div class="upi-info-row">
        <span class="upi-label">Order Ref</span>
        <span class="upi-value">${shortRef}</span>
      </div>
    </div>

    <div class="status-bar">
      <div class="dot"></div>
      Secure Payment
    </div>

    <div class="footer">
      Pay cheythu kazhinju screenshot ayakkoo ✅<br/>
      After paying, send the screenshot on WhatsApp
    </div>
  </div>

  <script>
    // Auto-open UPI app after 800ms so page loads first
    let opened = false;
    function openUPI() {
      if (opened) return;
      opened = true;
      window.location.href = '${upiLink}';
    }
    setTimeout(openUPI, 800);

    // Also trigger on button click (redundant but ensures click works)
    document.getElementById('payBtn').addEventListener('click', function(e) {
      e.preventDefault();
      openUPI();
    });
  </script>
</body>
</html>`;
}

module.exports = { buildPaymentHTML };
