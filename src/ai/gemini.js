const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { getSystemPrompt } = require('./prompts');
const { getOrCreateSession, addToHistory } = require('./context');
const { formatProductsForAI } = require('../db/products');
const { getBusinessInfoForAI } = require('../db/sheets');

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Send a text message through Gemini with full conversation history.
 */
async function chat(userId, userText) {
    const session = getOrCreateSession(userId);

    // Get fresh product context and business info
    let productContext = 'Product catalog temporarily unavailable.';
    let businessInfo = 'Business info temporarily unavailable.';
    try {
        [productContext, businessInfo] = await Promise.all([
            formatProductsForAI(),
            getBusinessInfoForAI(),
        ]);
    } catch (sheetErr) {
        console.error('⚠️  Google Sheets error (using fallback):', sheetErr.message);
    }

    const systemPrompt = getSystemPrompt(productContext, businessInfo);

    // Use gemini-2.0-flash — more reliable, faster, free tier friendly
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build history — inject system prompt as the very first turn
    // This avoids the systemInstruction + history incompatibility in SDK 0.21.0
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
    const result = await chatSession.sendMessage(userText);
    const reply = result.response.text().trim();
    console.log(`🤖 Gemini reply: "${reply.slice(0, 80)}..."`);

    // Save to history
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
 * Quick one-shot AI reply (for IG/FB comments).
 */
async function quickReply(prompt) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

module.exports = { chat, analyzeImage, quickReply };
