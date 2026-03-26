# 🛍️ Sales Bot Backend

A Node.js/Express backend that automates e-commerce across **Instagram**, **Facebook**, and **WhatsApp** using:
- **Meta Graph API** (Webhooks, Cloud API)
- **Gemini 1.5 Flash** AI (Text + Vision)
- **Google Sheets** as a live product & order database

---

## 📁 Project Structure

```
src/
├── index.js              # Server entrypoint
├── config.js             # Env validation & config
├── webhook.js            # GET verify + POST handler
├── router.js             # Event dispatcher
├── ai/
│   ├── gemini.js         # Gemini AI (chat + vision)
│   ├── prompts.js        # System prompt (Manglish/ML)
│   └── context.js        # Session/cart manager
├── db/
│   ├── sheets.js         # Google Sheets client
│   ├── products.js       # Products CRUD + AI context
│   └── orders.js         # Order creation + tracking
├── handlers/
│   ├── instagram.js      # IG comments + DM handler
│   ├── facebook.js       # FB Messenger handler
│   └── whatsapp.js       # Full WA shopping assistant
├── senders/
│   ├── instagram.js      # IG API calls
│   ├── facebook.js       # FB Messenger API calls
│   └── whatsapp.js       # WA Cloud API calls
└── whatsapp/
    ├── messages.js       # Interactive list/button builders
    └── upi.js            # UPI deep link generator
tests/
├── mock_whatsapp_text.json
├── mock_whatsapp_button.json
└── mock_ig_comment.json
```

---

## 🚀 Quick Start (Local)

### 1. Install Dependencies
```bash
cd "X:\Sales bot"
npm install
```

### 2. Configure Environment
```bash
copy .env.example .env
```
Open `.env` and fill in all values (see **Environment Variables** section below).

### 3. Set Up Google Sheets
Create a Google Sheet with **3 tabs**:

**Tab: `Products`** (exact column names required)
| Name | Price | SKU | Material | ImageURL | StockStatus |
|------|-------|-----|----------|----------|-------------|
| Silk Kurti | 1299 | SKU001 | Silk | https://... | In Stock |

**Tab: `Orders`** (auto-populated by bot)
| CustomerName | Phone | Items | TotalAmount | Status | PaymentLink | OrderRef | CreatedAt |

**Tab: `BusinessInfo`** (key-value format)
| Key | Value |
|-----|-------|
| DeliveryTime | 3-5 working days |
| ReturnPolicy | 7-day return policy |
| StoreAddress | MG Road, Kochi, Kerala |

Share the sheet with your **Service Account email** (Editor access).

### 4. Run the Server
```bash
npm run dev
```

### 5. Expose Locally (for Meta webhook testing)
Use [ngrok](https://ngrok.com/):
```bash
ngrok http 3000
```
Copy the `https://xxxx.ngrok.io` URL.

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `META_VERIFY_TOKEN` | Any secret string — must match Meta App Dashboard |
| `META_APP_SECRET` | Meta App Dashboard → App Settings → Basic |
| `PAGE_ACCESS_TOKEN` | Facebook Page token (long-lived) |
| `INSTAGRAM_PAGE_ID` | Numeric Facebook Page ID linked to Instagram |
| `WHATSAPP_TOKEN` | WhatsApp Cloud API bearer token |
| `WHATSAPP_PHONE_NUMBER_ID` | From Meta Business Suite |
| `WHATSAPP_BUSINESS_NUMBER` | Your WA number in international format (91XXXXXXXXXX) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email from GCP |
| `GOOGLE_PRIVATE_KEY` | Private key from service account JSON |
| `GOOGLE_SHEETS_ID` | From your Google Sheet URL |
| `UPI_ID` | Your UPI address (e.g., `store@okaxis`) |
| `STORE_NAME` | Display name for your store |

---

## ⚙️ Meta App Setup

### Step 1 — Create Meta App
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new App → **Business** type
3. Add products: **Messenger**, **Instagram Graph API**, **WhatsApp**

### Step 2 — Set Webhook URL
1. Go to your App → **Webhooks**
2. Callback URL: `https://your-render-url.onrender.com/webhook`
3. Verify Token: same value as `META_VERIFY_TOKEN` in `.env`
4. Subscribe to:
   - **Instagram**: `comments`, `messages`
   - **Page**: `messages`
   - **WhatsApp**: `messages`

### Step 3 — Instagram Comment Replies
Ensure your Facebook Page is linked to your Instagram Business account in **Meta Business Suite** → **Accounts**.

---

## 🤖 How the Bot Works

### Instagram Comment Flow
```
User comments on Post/Reel
  → Bot receives webhook
  → Gemini generates personalised reply
  → Private reply sent (appears in user's DM) with WhatsApp CTA link
```

### WhatsApp Shopping Flow
```
Customer: "Hi"
  → Welcome menu (Browse Products / Buy Now / Talk to Human)

Customer clicks "Browse Products"
  → Category list (grouped by material from Google Sheets)

Customer selects a product
  → Product details + image sent
  → "Buy Now" / "See More" buttons

Customer clicks "Buy Now"
  → Order added to cart
  → UPI / COD payment options

Customer selects UPI
  → UPI deep link generated
  → Order logged to Google Sheets (Orders tab)
  → Payment screenshot requested

Customer sends product image
  → Gemini Vision analyses image
  → Closest product from catalog identified & shown
```

### HUMAN Escalation
Customer types **HUMAN** → Bot stops responding, team notified. Customer types **hi** to restart.

---

## ☁️ Deploy to Render (Free Tier)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your repo — Render auto-detects `render.yaml`
4. Add all env vars in Render Dashboard → Environment
5. Deploy! Your webhook URL: `https://your-service.onrender.com/webhook`

> ⚠️ **Free tier spins down after 15 min inactivity.** Meta's webhook will wake it up on first message, but first message may be slightly delayed (~30s). Upgrade to the $7/mo plan to avoid cold starts.

---

## 🧪 Local Testing

```bash
# Test webhook verification
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
# Expected: test123

# Health check
curl http://localhost:3000/health

# Mock WhatsApp text message (Note: signature check skipped locally if no APP_SECRET)
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d @tests/mock_whatsapp_text.json

# Mock Instagram comment
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d @tests/mock_ig_comment.json
```

> Note: POST requests will fail signature verification locally unless you compute and add the `X-Hub-Signature-256` header. For quick local testing, you can temporarily comment out the `verifySignature` check in `webhook.js`.

---

## 📦 UPI Payment Link Format

```
upi://pay?pa=STORE_UPI_ID&pn=STORE_NAME&am=AMOUNT&tn=ORDER_REF&cu=INR
```

Works with Google Pay, PhonePe, Paytm, BHIM, and all UPI apps.

---

## 🛠️ Customisation

- **Change AI personality**: Edit `src/ai/prompts.js`
- **Add new button flows**: Edit `src/whatsapp/messages.js`
- **Change product cache TTL**: Edit `CACHE_TTL_MS` in `src/db/products.js`
- **Add new webhook events**: Edit `src/router.js`
