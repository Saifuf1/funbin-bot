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
 * Send a text message through Gemini with full conversation history and client context.
 */
async function chat(userId, userText, client) {
    const session = getOrCreateSession(userId);

    // Use client-specific Sheets ID if available
    const sheetsId = client?.googleSheetsId || config.googleSheetsId;

    // Get fresh product context, business info, and customer orders
    let productContext = 'Product catalog temporarily unavailable.';
    let businessInfo = 'Business info temporarily unavailable.';
    let ordersContext = 'No previous orders found.';

    try {
        const [pCtx, bInfo, userOrders] = await Promise.all([
            formatProductsForAI(sheetsId),
            getBusinessInfoForAI(sheetsId),
            getOrdersByPhone(userId, sheetsId)
        ]);
        productContext = pCtx;
        businessInfo = bInfo;

        if (userOrders && userOrders.length > 0) {
            ordersContext = userOrders.map(o => `Ref: ${o.ref} | Items: ${o.items} | Status: ${o.status}`).join('\n');
        }
    } catch (sheetErr) {
        console.error('⚠️  Google Sheets error (using fallback):', sheetErr.message);
    }

    const systemPrompt = getSystemPrompt(productContext, businessInfo, ordersContext, client?.aiConfig?.systemPrompt);

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Build history
    const history = [
        {
            role: 'user',
            parts: [{ text: '(System) ' + systemPrompt }],
        },
        {
            role: 'model',
            parts: [{ text: 'Understood! I am the AI assistant for ' + (client?.name || 'this shop') + '. 😊' }],
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

    console.log(`🤖 Gemini call [Client: ${client?.id}] — user: ${userId}`);

    let result = await chatSession.sendMessage(userText);
    const reply = result.response.text().trim();

    addToHistory(userId, 'user', userText);
    addToHistory(userId, 'model', reply);
    return reply;
}

/**
 * Analyze an audio message (Voice Note) with client context.
 */
async function analyzeAudio(audioBase64, mimeType, userId, client) {
    const sheetsId = client?.googleSheetsId || config.googleSheetsId;

    let productContext = 'No catalog available.';
    let businessInfo = '';
    let ordersContext = '';
    try {
        const [pCtx, bInfo, userOrders] = await Promise.all([
            formatProductsForAI(sheetsId),
            getBusinessInfoForAI(sheetsId),
            getOrdersByPhone(userId, sheetsId)
        ]);
        productContext = pCtx;
        businessInfo = bInfo;
        if (userOrders && userOrders.length > 0) {
            ordersContext = userOrders.map(o => `Ref: ${o.ref} | Items: ${o.items} | Status: ${o.status} `).join('\n');
        }
    } catch (e) {
        console.error('⚠️  Sheets error in analyzeAudio:', e.message);
    }

    const systemPrompt = getSystemPrompt(productContext, businessInfo, ordersContext, client?.aiConfig?.systemPrompt);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `${systemPrompt}
 
A customer has sent a **voice note**. Listen to it carefully and:
1. Understand their intent (asking about a product, delivery, etc.).
2. Respond naturally in TEXT format. Match their spoken language.
3. Be super helpful. Keep it short and friendly.`;

    const result = await model.generateContent([
        { text: prompt },
        { inlineData: { data: audioBase64, mimeType } },
    ]);

    const reply = result.response.text().trim();
    addToHistory(userId, 'user', '[Customer sent an audio message]');
    addToHistory(userId, 'model', reply);
    return reply;
}

/**
 * Analyze an image with client context.
 */
async function analyzeImage(imageBase64, mimeType, userId, client) {
    const sheetsId = client?.googleSheetsId || config.googleSheetsId;

    let productContext = 'No catalog available.';
    let businessInfo = '';
    try {
        [productContext, businessInfo] = await Promise.all([
            formatProductsForAI(sheetsId),
            getBusinessInfoForAI(sheetsId),
        ]);
    } catch (e) {
        console.error('⚠️  Sheets error in analyzeImage:', e.message);
    }

    const systemPrompt = getSystemPrompt(productContext, businessInfo, '', client?.aiConfig?.systemPrompt);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `${systemPrompt}
A customer has sent an image. Match it to our catalog and help them buy or recognize their payment.`;

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
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

/**
 * Validate customer delivery address using Gemini.
 */
async function validateDeliveryAddress(text) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `You are a strict address validation assistant for an Indian e-commerce store.
The customer has provided this as their delivery details:
"${text}"

Check if this combined text contains ALL of the following 5 details:
1. A Name
2. A Street Address or House Name
3. A City or Local Area
4. A 6-digit Pincode
5. A Phone Number

If ALL 5 are present, respond EXACTLY with:
VALID_ADDRESS|||<Format the complete address nicely on multiple lines>

If ANY are missing, respond EXACTLY with:
MISSING_INFO|||<Politely ask the customer in Manglish to provide ONLY the specific missing details. Be friendly!>

Do not output any markdown code blocks. Just the raw string format.`;

    try {
        const result = await model.generateContent(prompt);
        const reply = result.response.text().trim();

        if (reply.startsWith('VALID_ADDRESS|||')) {
            return { valid: true, formatted: reply.split('|||')[1].trim() };
        } else if (reply.startsWith('MISSING_INFO|||')) {
            return { valid: false, message: reply.split('|||')[1].trim() };
        } else {
            return { valid: false, message: "Please provide all 5 details: Full Name, Street/House, City/Area, Pincode, and Phone Number in a single message to proceed 🚚" };
        }
    } catch (e) {
        console.error('Validation Error', e);
        return { valid: false, message: "Oru issue und! Please type your full address with City, Pincode and Phone number." };
    }
}

module.exports = { chat, analyzeImage, analyzeAudio, quickReply, validateDeliveryAddress };
