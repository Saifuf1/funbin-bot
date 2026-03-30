const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const config = require('../config');

// Multi-Tenant Cache: Map SheetsId -> { doc, sheets: { title -> sheet } }
const docsCache = {};

/**
 * Get authenticated Google Spreadsheet instance for a specific sheet ID
 */
async function getDoc(sheetsId) {
    const id = sheetsId || config.googleSheetsId;
    if (docsCache[id] && docsCache[id].doc) return docsCache[id].doc;

    const auth = new JWT({
        email: config.googleServiceAccountEmail,
        key: config.googlePrivateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(id, auth);
    await doc.loadInfo();

    if (!docsCache[id]) docsCache[id] = { sheets: {} };
    docsCache[id].doc = doc;

    console.log(`✅ [SaaS] Connected to Google Sheet: "${doc.title}" (ID: ${id.slice(0, 8)}...)`);
    return doc;
}

/**
 * Get a sheet by title (cached per-spreadsheet)
 */
async function getSheet(sheetsId, title) {
    const id = sheetsId || config.googleSheetsId;
    if (docsCache[id]?.sheets?.[title]) return docsCache[id].sheets[title];

    const spreadsheet = await getDoc(id);
    const sheet = spreadsheet.sheetsByTitle[title];
    if (!sheet) {
        throw new Error(`Sheet tab "${title}" not found in spreadsheet ${id}`);
    }

    docsCache[id].sheets[title] = sheet;
    return sheet;
}

/**
 * Get all rows from the Products tab
 */
async function getProductsSheet(sheetsId) {
    return getSheet(sheetsId, 'Products');
}

/**
 * Get all rows from the Orders tab
 */
async function getOrdersSheet(sheetsId) {
    return getSheet(sheetsId, 'Orders');
}

/**
 * Get business info for a specific client
 */
async function getBusinessInfoForAI(sheetsId) {
    try {
        const sheet = await getSheet(sheetsId, 'BusinessInfo');
        const rows = await sheet.getRows();
        if (!rows.length) return 'No specific business info available.';

        return rows
            .map((row) => `${row.get('Key') || ''}: ${row.get('Value') || ''}`)
            .filter(Boolean)
            .join('\n');
    } catch (err) {
        console.error('⚠️  BusinessInfo error:', err.message);
        return 'Business info temporarily unavailable.';
    }
}

module.exports = {
    getDoc,
    getSheet,
    getProductsSheet,
    getOrdersSheet,
    getBusinessInfoForAI,
};
