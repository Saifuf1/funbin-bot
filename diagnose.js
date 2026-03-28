require('dotenv').config();
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function diagnose() {
    console.log('🔍 Starting Fresh Connection Audit...\n');

    // 1. Check Env Vars presence
    const required = [
        'META_VERIFY_TOKEN',
        'WHATSAPP_TOKEN',
        'WHATSAPP_PHONE_NUMBER_ID',
        'GEMINI_API_KEY',
        'GOOGLE_SERVICE_ACCOUNT_EMAIL',
        'GOOGLE_PRIVATE_KEY',
        'GOOGLE_SHEETS_ID'
    ];

    console.log('--- Phase 1: Environment Variables ---');
    let allEnvPresent = true;
    for (const key of required) {
        if (!process.env[key]) {
            console.error(`❌ Missing: ${key}`);
            allEnvPresent = false;
        } else {
            console.log(`✅ Present: ${key}`);
        }
    }
    if (!allEnvPresent) return;
    console.log('');

    // 2. Test Gemini AI
    console.log('--- Phase 2: Google Gemini AI ---');
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'];
    let geminiSuccess = false;

    for (const modelId of modelsToTry) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: modelId });
            const result = await model.generateContent('Say "OK"');
            console.log(`✅ Gemini (${modelId}) Response: ${result.response.text().trim()}`);
            geminiSuccess = true;
            break;
        } catch (err) {
            console.warn(`⚠️  Gemini (${modelId}) failed: ${err.message?.slice(0, 100)}...`);
        }
    }
    if (!geminiSuccess) console.error('❌ All Gemini models failed.');
    console.log('');

    // 3. Test Google Sheets
    console.log('--- Phase 3: Google Sheets ---');
    try {
        const auth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID, auth);
        await doc.loadInfo();
        console.log(`✅ Connected to Sheet: "${doc.title}"`);
    } catch (err) {
        console.error('❌ Google Sheets Failed:', err.message);
    }
    console.log('');

    // 4. Test Meta Graph API (App Details)
    console.log('--- Phase 4: Meta Graph API ---');
    try {
        // Need META_APP_SECRET sometimes, but lets try with WHATSAPP_TOKEN first
        const res = await axios.get(`https://graph.facebook.com/v20.0/debug_token`, {
            params: {
                input_token: process.env.WHATSAPP_TOKEN,
                access_token: process.env.WHATSAPP_TOKEN // Usually needs an App Token, but system user token often works for debug
            }
        });
        console.log('✅ Meta Token identified for:', res.data.data.application);
    } catch (err) {
        console.warn('⚠️  Meta Token Debug failed (might need App Token), trying Phone ID fetch...');
        try {
            const res = await axios.get(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`, {
                headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
            });
            console.log('✅ WhatsApp Phone ID verified:', res.data.verified_name || res.data.id);
        } catch (err2) {
            console.error('❌ Meta/WhatsApp Graph API Failed:', err2.response?.data || err2.message);
        }
    }
    console.log('');

    console.log('🏁 Audit Complete.');
}

diagnose();
