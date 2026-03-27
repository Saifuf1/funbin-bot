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

A customer has sent an image on WhatsApp. Look at it carefully.

1. Is this a PAYMENT SCREENSHOT (like from Google Pay, PhonePe, Paytm, or a banking app)?
If YES:
- Reply politely acknowledging the payment, and mention that our team will verify it shortly and process the order. Do NOT try to match it to a toy or mention any product SKUs. 

2. Is this a PRODUCT, TOY, or SHOPPING image?
If YES:
- Match it to the closest item in the Fun bin product catalog above.
- If we HAVE it or something very similar, tell them the product name, price, and availability. You MUST include the exact product SKU (e.g. TOY-TAB-01) somewhere in your text.
- If we do NOT have it in stock, politely say so and suggest a similar product we DO have in stock.

3. Does it look like NEITHER of these?
If YES:
- Just politely say you didn't quite understand the image and ask how we can help.

Respond naturally in Manglish or English depending on their language preference. Keep it short and friendly.`;

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
            ordersContext = userOrders.map(o => `Ref: ${o.ref} | Items: ${o.items} | Status: ${o.status} `).join('\n');
        }
    } catch (e) {
        console.error('⚠️  Sheets error in analyzeAudio:', e.message);
    }

    const systemPrompt = getSystemPrompt(productContext, businessInfo, ordersContext);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `${systemPrompt}

A customer has sent a ** voice note / audio message **.Listen to it carefully and:
    1. Understand their intent(asking about a product, delivery, etc.).
2. Respond naturally in TEXT format.Match their spoken language(if they speak Malayalam, reply in Manglish text.If English, reply in English text).
    3. Be super helpful and assist them with their purchase.Keep it short and friendly.`;

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
