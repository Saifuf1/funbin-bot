const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { getSystemPrompt } = require('./prompts');
const { getOrCreateSession, addToHistory } = require('./context');
const { formatProductsForAI } = require('../db/products');
const { getBusinessInfoForAI } = require('../db/sheets');
const { getOrdersByPhone } = require('../db/orders');

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
console.log(`🤖 Gemini model: ${MODEL_NAME}`);

/**
 * Send a text message through Gemini with full conversation history.
 */
async function chat(userId, userText) {
    const session = getOrCreateSession(userId);

    // Get fresh product context, business info, and customer orders
    let productContext = 'Product catalog temporarily unavailable.';
    let businessInfo = 'Business info temporarily unavailable.';
    let ordersContext = 'No previous orders found.';

    try {
        const [pCtx, bInfo, userOrders] = await Promise.all([
            formatProductsForAI(),
            getBusinessInfoForAI(),
            getOrdersByPhone(userId)
        ]);
        productContext = pCtx;
        businessInfo = bInfo;

        if (userOrders && userOrders.length > 0) {
            ordersContext = userOrders.map(o => `Ref: ${o.ref} | Items: ${o.items} | Status: ${o.status}`).join('\n');
        }
    } catch (sheetErr) {
        console.error('⚠️  Google Sheets error (using fallback):', sheetErr.message);
    }

    const systemPrompt = getSystemPrompt(productContext, businessInfo, ordersContext);

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Build history — inject system prompt as the very first turn
    const history = [
        {
            role: 'user',
            parts: [{ text: '(System) ' + systemPrompt }],
        },
        {
            role: 'model',
            parts: [{ text: 'Understood! I am the Fun bin assistant, ready to help customers in Manglish/Malayalam. 😊' }],
        },
        ...session.history,
    ];

    const chatSession = model.startChat({
        history,
        generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.8,
        },
    });

    console.log(`🤖 Gemini call — user: ${userId}, msg: "${userText.slice(0, 50)}"`);

    // Retry once on 429 (quota) with 3s delay
    let result;
    try {
        result = await chatSession.sendMessage(userText);
    } catch (err) {
        if (err.message?.includes('429')) {
            console.warn('⚠️  Gemini quota hit, retrying in 3s...');
            await new Promise((r) => setTimeout(r, 3000));
            result = await chatSession.sendMessage(userText);
        } else {
            throw err;
        }
    }

    const reply = result.response.text().trim();
    console.log(`🤖 Gemini reply: "${reply.slice(0, 80)}..."`);

    addToHistory(userId, 'user', userText);
    addToHistory(userId, 'model', reply);
    return reply;
}

/**
 * Analyze an image using Gemini Vision to identify the product.
 */
async function analyzeImage(imageBase64, mimeType, userId) {
    let productContext = 'No catalog available.';
    let businessInfo = '';
    try {
        [productContext, businessInfo] = await Promise.all([
            formatProductsForAI(),
            getBusinessInfoForAI(),
        ]);
    } catch (e) {
        console.error('⚠️  Sheets error in analyzeImage:', e.message);
    }

    const systemPrompt = getSystemPrompt(productContext, businessInfo);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `${systemPrompt}

A customer has sent this image. Look at it carefully and:
1. Describe what you see (product type, color, style)
2. Match it to the closest item in the Fun bin product catalog above
3. Tell the customer the product name, price, and availability
4. Respond in Manglish as per your personality

Reply naturally as if you're in a WhatsApp conversation. Keep it short and friendly.`;

    const result = await model.generateContent([
        { text: prompt },
        { inlineData: { data: imageBase64, mimeType } },
    ]);

    const reply = result.response.text().trim();
    addToHistory(userId, 'user', '[Customer sent an image]');
    addToHistory(userId, 'model', reply);
    return reply;
}

/**
 * Analyze an audio message (Voice Note) using Gemini 1.5/2.5 Flash's native multimodal capabilities.
 */
async function analyzeAudio(audioBase64, mimeType, userId) {
    let productContext = 'No catalog available.';
    let businessInfo = '';
    let ordersContext = '';
    try {
        const [pCtx, bInfo, userOrders] = await Promise.all([
            formatProductsForAI(),
            getBusinessInfoForAI(),
            getOrdersByPhone(userId)
        ]);
        productContext = pCtx;
        businessInfo = bInfo;
        if (userOrders && userOrders.length > 0) {
            ordersContext = userOrders.map(o => `Ref: ${o.ref} | Items: ${o.items} | Status: ${o.status}`).join('\n');
        }
    } catch (e) {
        console.error('⚠️  Sheets error in analyzeAudio:', e.message);
    }

    const systemPrompt = getSystemPrompt(productContext, businessInfo, ordersContext);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `${systemPrompt}

A customer has sent a **voice note/audio message**. Listen to it carefully and:
1. Understand their intent (asking about a product, delivery, etc.).
2. Respond naturally in TEXT format. Match their spoken language (if they speak Malayalam, reply in Manglish text. If English, reply in English text).
3. Be super helpful and assist them with their purchase. Keep it short and friendly.`;

    try {
        const result = await model.generateContent([
            { text: prompt },
            { inlineData: { data: audioBase64, mimeType } },
        ]);

        const reply = result.response.text().trim();
        addToHistory(userId, 'user', '[Customer sent an audio message]');
        addToHistory(userId, 'model', reply);
        return reply;
    } catch (err) {
        console.error('❌ Audio processing error:', err.message);
        throw err;
    }
}

/**
 * Quick one-shot AI reply (for IG/FB comments).
 */
async function quickReply(prompt) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

module.exports = { chat, analyzeImage, analyzeAudio, quickReply };
