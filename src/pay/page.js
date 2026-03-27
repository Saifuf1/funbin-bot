/**
 * Generates the HTML for the UPI payment redirect page.
 * Minimalist dark design with iOS/Android-specific UPI app handling.
 */

function buildPaymentHTML({ storeName, amount, upiId, upiLink, orderRef, productName }) {
  const shortRef = orderRef?.split('-').slice(-1)[0] || orderRef;

  // Build individual app links for iOS
  const upiParams = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(storeName)}&am=${Number(amount).toFixed(2)}&tn=${encodeURIComponent(orderRef)}&cu=INR`;
  const gpayLink = `tez://upi/pay?${upiParams}`;
  const phonePeLink = `phonepe://pay?${upiParams}`;
  const paytmLink = `paytmmp://pay?${upiParams}`;

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
      padding: 40px 28px;
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
      margin-bottom: 28px;
    }

    .amount {
      font-size: 52px;
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
      font-size: 14px;
      color: rgba(255, 255, 255, 0.45);
      margin-bottom: 32px;
      font-weight: 400;
    }

    .divider {
      height: 1px;
      background: rgba(255,255,255,0.07);
      margin: 24px 0;
    }

    /* ── Android: single Pay Now button ── */
    .android-section { display: none; }
    .android-section.show { display: block; }

    /* ── iOS: individual app buttons ── */
    .ios-section { display: none; }
    .ios-section.show { display: block; }

    .btn {
      display: block;
      width: 100%;
      padding: 16px;
      color: #fff;
      text-decoration: none;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.2px;
      margin-bottom: 10px;
      cursor: pointer;
      border: none;
      transition: transform 0.1s;
      text-align: center;
    }
    .btn:active { transform: scale(0.98); }

    .btn-primary { background: #2563eb; }
    .btn-primary:hover { background: #1d4ed8; }

    .btn-gpay { background: linear-gradient(135deg, #4285F4, #34A853); }
    .btn-phonepe { background: linear-gradient(135deg, #5f259f, #8236cb); }
    .btn-paytm { background: linear-gradient(135deg, #002970, #0E4DA4); }

    .btn-secondary {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.7);
      font-weight: 500;
    }

    .btn-label { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 12px; }

    .upi-info {
      margin-top: 4px;
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

    .copy-btn {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.6);
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 6px;
      cursor: pointer;
      margin-left: 8px;
      transition: background 0.15s;
    }
    .copy-btn:hover { background: rgba(255,255,255,0.15); }
    .copy-btn.copied { background: #22c55e33; color: #22c55e; border-color: #22c55e44; }

    .status-bar {
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      color: rgba(255,255,255,0.35);
    }

    .dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #22c55e;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: rgba(255,255,255,0.2);
      line-height: 1.6;
    }

    .manual-section {
      margin-top: 20px;
      padding: 16px;
      background: rgba(37, 99, 235, 0.06);
      border: 1px solid rgba(37, 99, 235, 0.15);
      border-radius: 12px;
      text-align: left;
    }
    .manual-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; color: rgba(255,255,255,0.7); }
    .manual-step { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 6px; line-height: 1.5; }
    .manual-step strong { color: rgba(255,255,255,0.85); }
  </style>
</head>
<body>
  <div class="card">
    <div class="store-badge">🛍️ ${storeName}</div>

    <div class="amount">₹${amount}</div>
    <div class="product-name">${productName}</div>

    <!-- Android: Auto-redirect + single button -->
    <div class="android-section" id="androidSection">
      <a class="btn btn-primary" id="payBtn" href="${upiLink}">
        💳 Pay ₹${amount} with UPI
      </a>
    </div>

    <!-- iOS: Individual app buttons -->
    <div class="ios-section" id="iosSection">
      <div class="btn-label">Choose your payment app</div>
      <a class="btn btn-gpay" href="${gpayLink}">G Pay — Google Pay</a>
      <a class="btn btn-phonepe" href="${phonePeLink}">📱 PhonePe</a>
      <a class="btn btn-paytm" href="${paytmLink}">P Paytm</a>
    </div>

    <div class="divider"></div>

    <!-- Manual UPI fallback — always visible -->
    <div class="manual-section">
      <div class="manual-title">📋 Or pay manually:</div>
      <div class="manual-step">1. Open any UPI app</div>
      <div class="manual-step">2. UPI ID: <strong>${upiId}</strong>
        <button class="copy-btn" onclick="copyUPI(this)">Copy</button>
      </div>
      <div class="manual-step">3. Amount: <strong>₹${amount}</strong></div>
      <div class="manual-step">4. Note: <strong>${shortRef}</strong></div>
    </div>

    <div class="upi-info">
      <div class="upi-info-row">
        <span class="upi-label">Order Ref</span>
        <span class="upi-value">${shortRef}</span>
      </div>
      <div class="upi-info-row">
        <span class="upi-label">UPI ID</span>
        <span class="upi-value">${upiId}</span>
      </div>
    </div>

    <div class="status-bar">
      <div class="dot"></div>
      Secure UPI Payment
    </div>

    <div class="footer">
      Payment cheythu kazhinju WhatsApp-il screenshot ayakkoo ✅
    </div>
  </div>

  <script>
    // Detect iOS
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      document.getElementById('iosSection').classList.add('show');
    } else {
      // Android or desktop — show single UPI button + auto-redirect
      document.getElementById('androidSection').classList.add('show');
      if (isAndroid) {
        setTimeout(function() {
          window.location.href = '${upiLink}';
        }, 800);
      }
    }

    // Copy UPI ID
    function copyUPI(btn) {
      navigator.clipboard.writeText('${upiId}').then(function() {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function() {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    }
  </script>
</body>
</html>`;
}

module.exports = { buildPaymentHTML };
