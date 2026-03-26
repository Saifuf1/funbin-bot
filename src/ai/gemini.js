const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { getSystemPrompt } = require('./prompts');
const { getOrCreateSession, addToHistory } = require('./context');
const { formatProductsForAI } = require('../db/products');
const { getBusinessInfoForAI } = require('../db/sheets');

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Send a text message through Gemini with full conversation history.
 * @param {string} userId - Unique sender ID
 * @param {string} userText - The user's message
 * @returns {Promise<string>} - AI reply text
 */
async function chat(userId, userText) {
    const session = getOrCreateSession(userId);

    // Get fresh product context and business info
    const [productContext, businessInfo] = await Promise.all([
        formatProductsForAI(),
        getBusinessInfoForAI(),
    ]);

    const systemPrompt = getSystemPrompt(productContext, businessInfo);

    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
    });

    // Build chat with existing history
    const chatSession = model.startChat({
        history: session.history,
        generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.8,
        },
    });

    const result = await chatSession.sendMessage(userText);
    const reply = result.response.text();

    // Save to history
    addToHistory(userId, 'user', userText);
    addToHistory(userId, 'model', reply);

    return reply;
}

/**
 * Analyze an image using Gemini Vision to identify the product.
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} mimeType - e.g. 'image/jpeg'
 * @param {string} userId - Sender ID for context
 * @returns {Promise<string>} - AI reply
 */
async function analyzeImage(imageBase64, mimeType, userId) {
    const productContext = await formatProductsForAI();
    const businessInfo = await getBusinessInfoForAI();
    const systemPrompt = getSystemPrompt(productContext, businessInfo);

    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
    });

    const prompt = `A customer has sent this image. Look at it carefully and:
1. Describe what you see (product type, color, style)
2. If it matches any item in our product catalog, tell the customer about it (name, price, availability)
3. If it doesn't match exactly, suggest the closest match from our catalog
4. Respond in Manglish/Malayalam as per your personality

Reply naturally as if you're in a WhatsApp conversation.`;

    const result = await model.generateContent([
        { text: prompt },
        {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType,
            },
        },
    ]);

    const reply = result.response.text();
    addToHistory(userId, 'user', '[Customer sent an image]');
    addToHistory(userId, 'model', reply);

    return reply;
}

/**
 * Quick one-shot AI reply without maintaining conversation history (for IG/FB comments).
 * @param {string} prompt - Full prompt text
 * @returns {Promise<string>}
 */
async function quickReply(prompt) {
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

module.exports = { chat, analyzeImage, quickReply };
