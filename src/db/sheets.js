const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const config = require('../config');

let doc = null;
let sheetsCache = {};

/**
 * Get authenticated Google Spreadsheet instance (lazy init + singleton)
 */
async function getDoc() {
    if (doc) return doc;

    const auth = new JWT({
        email: config.googleServiceAccountEmail,
        key: config.googlePrivateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    doc = new GoogleSpreadsheet(config.googleSheetsId, auth);
    await doc.loadInfo();
    console.log(`✅ Connected to Google Sheet: "${doc.title}"`);
    return doc;
}

/**
 * Get a sheet by title (cached)
 */
async function getSheet(title) {
    if (sheetsCache[title]) return sheetsCache[title];

    const spreadsheet = await getDoc();
    const sheet = spreadsheet.sheetsByTitle[title];
    if (!sheet) {
        throw new Error(`Sheet tab "${title}" not found in spreadsheet`);
    }
    sheetsCache[title] = sheet;
    return sheet;
}

/**
 * Get all rows from the Products tab
 */
async function getProductsSheet() {
    return getSheet('Products');
}

/**
 * Get all rows from the Orders tab
 */
async function getOrdersSheet() {
    return getSheet('Orders');
}

/**
 * Get business info as a formatted string for AI context
 */
async function getBusinessInfoForAI() {
    try {
        const sheet = await getSheet('BusinessInfo');
        const rows = await sheet.getRows();
        if (!rows.length) return 'No specific business info available.';

        return rows
            .map((row) => `${row.get('Key') || ''}: ${row.get('Value') || ''}`)
            .filter(Boolean)
            .join('\n');
    } catch (err) {
        console.error('⚠️  Could not load BusinessInfo sheet:', err.message);
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
