const { getProductsSheet } = require('./sheets');

// Multi-Tenant Cache: Map SheetsId -> { data, expiry }
const productsCache = {};
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Get all products from Google Sheets (with per-client cache)
 */
async function getAllProducts(sheetsId) {
    const id = sheetsId || 'default';
    if (productsCache[id] && Date.now() < productsCache[id].expiry) {
        return productsCache[id].data;
    }

    try {
        const sheet = await getProductsSheet(sheetsId);
        const rows = await sheet.getRows();

        const data = rows.map((row) => ({
            name: row.get('Name') || '',
            price: parseFloat(row.get('Price')) || 0,
            sku: row.get('SKU') || '',
            material: row.get('Material') || '',
            imageUrl: row.get('Image') || row.get('ImageURL') || '',
            stockStatus: row.get('StockStatus') || 'Unknown',
            description: row.get('Description') || '',
        })).filter((p) => p.name);

        productsCache[id] = {
            data,
            expiry: Date.now() + CACHE_TTL_MS
        };
        return data;
    } catch (err) {
        console.error(`❌ Error fetching products for client [${id}]:`, err.message);
        return productsCache[id]?.data || [];
    }
}

/**
 * Find a product by exact SKU (scoped to client)
 */
async function findProductBySKU(sku, sheetsId) {
    const products = await getAllProducts(sheetsId);
    return products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
}

/**
 * Get unique material/category list (scoped to client)
 */
async function getCategories(sheetsId) {
    const products = await getAllProducts(sheetsId);
    return [...new Set(products.map((p) => p.material).filter(Boolean))];
}

/**
 * Get products by category/material (scoped to client)
 */
async function getProductsByCategory(category, sheetsId) {
    const products = await getAllProducts(sheetsId);
    return products.filter((p) =>
        p.material.toLowerCase().includes(category.toLowerCase())
    );
}

/**
 * Format product list for AI context (scoped to client)
 */
async function formatProductsForAI(sheetsId) {
    const products = await getAllProducts(sheetsId);
    if (!products.length) return 'No products available.';

    return products
        .map(p => `• ${p.name} (SKU: ${p.sku}) — ₹${p.price} | ${p.stockStatus}`)
        .join('\n');
}

/**
 * Format a single product as a customer-friendly message
 */
function formatProductForCustomer(p) {
    const stock = p.stockStatus.toLowerCase() === 'in stock' ? '✅ In Stock' : '❌ Out of Stock';
    return `*${p.name}*\n💰 Price: ₹${p.price}\n🧵 Material: ${p.material}\n${stock}\n🔑 SKU: ${p.sku}`;
}

/**
 * Invalidate cache for a specific client
 */
function invalidateCache(sheetsId) {
    const id = sheetsId || 'default';
    delete productsCache[id];
}

module.exports = {
    getAllProducts,
    findProductBySKU,
    getCategories,
    getProductsByCategory,
    formatProductsForAI,
    formatProductForCustomer,
    invalidateCache,
};
