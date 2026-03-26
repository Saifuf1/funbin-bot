require('dotenv').config();

// Hard required — server cannot work without these
const required = [
    'META_VERIFY_TOKEN',
    'WHATSAPP_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'GEMINI_API_KEY',
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_SHEETS_ID',
    'UPI_ID',
    'STORE_NAME',
];

// Optional — only needed for Instagram/Facebook DM features
const optional = ['META_APP_SECRET', 'PAGE_ACCESS_TOKEN', 'INSTAGRAM_PAGE_ID'];
optional.forEach((key) => {
    if (!process.env[key] || process.env[key].startsWith('placeholder')) {
        console.warn(`⚠️  Optional env var not set: ${key} (Instagram/FB DMs disabled)`);
    }
});

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
    console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
}

module.exports = {
    port: process.env.PORT || 3000,

    // Meta
    metaVerifyToken: process.env.META_VERIFY_TOKEN,
    metaAppSecret: process.env.META_APP_SECRET,
    pageAccessToken: process.env.PAGE_ACCESS_TOKEN,
    instagramPageId: process.env.INSTAGRAM_PAGE_ID || '',

    // WhatsApp
    whatsappToken: process.env.WHATSAPP_TOKEN,
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    whatsappBusinessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || '',

    // Gemini
    geminiApiKey: process.env.GEMINI_API_KEY,

    // Google Sheets
    googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    googleSheetsId: process.env.GOOGLE_SHEETS_ID,

    // Store / UPI
    upiId: process.env.UPI_ID,
    storeName: process.env.STORE_NAME,

    // Graph API base
    graphApiVersion: 'v20.0',
    graphApiBase: 'https://graph.facebook.com/v20.0',
};
