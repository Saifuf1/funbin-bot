const { getProductsSheet } = require('./sheets');

// Cache products for 5 minutes to reduce API calls
let productsCache = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Get all products from Google Sheets (with cache)
 * @returns {Promise<Array<{Name, Price, SKU, Material, ImageURL, StockStatus}>>}
 */
async function getAllProducts() {
    if (productsCache && Date.now() < cacheExpiry) {
        return productsCache;
    }

    try {
        const sheet = await getProductsSheet();
        const rows = await sheet.getRows();

        productsCache = rows.map((row) => ({
            name: row.get('Name') || '',
            price: parseFloat(row.get('Price')) || 0,
            sku: row.get('SKU') || '',
            material: row.get('Material') || '',
            imageUrl: row.get('ImageURL') || '',
            stockStatus: row.get('StockStatus') || 'Unknown',
        })).filter((p) => p.name);

        cacheExpiry = Date.now() + CACHE_TTL_MS;
        return productsCache;
    } catch (err) {
        console.error('❌ Error fetching products:', err.message);
        return productsCache || [];
    }
}

/**
 * Find a product by name or SKU (case-insensitive fuzzy match)
 */
async function findProduct(query) {
    const products = await getAllProducts();
    const q = query.toLowerCase();
    return products.find(
        (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase() === q ||
            p.material.toLowerCase().includes(q)
    );
}

/**
 * Find a product by exact SKU
 */
async function findProductBySKU(sku) {
    const products = await getAllProducts();
    return products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
}

/**
 * Get in-stock products only
 */
async function getInStockProducts() {
    const products = await getAllProducts();
    return products.filter(
        (p) => p.stockStatus.toLowerCase() === 'in stock' || p.stockStatus.toLowerCase() === 'available'
    );
}

/**
 * Get unique material/category list
 */
async function getCategories() {
    const products = await getAllProducts();
    const cats = [...new Set(products.map((p) => p.material).filter(Boolean))];
    return cats;
}

/**
 * Get products by category/material
 */
async function getProductsByCategory(category) {
    const products = await getAllProducts();
    return products.filter((p) =>
        p.material.toLowerCase().includes(category.toLowerCase())
    );
}

/**
 * Format product list as a readable text block for AI context injection
 */
async function formatProductsForAI() {
    const products = await getAllProducts();
    if (!products.length) return 'No products available in the catalog.';

    return products
        .map(
            (p) =>
                `• ${p.name} (SKU: ${p.sku}) — ₹${p.price} | Material: ${p.material} | ${p.stockStatus}`
        )
        .join('\n');
}

/**
 * Format a single product as a customer-friendly message
 */
function formatProductForCustomer(p) {
    const stock =
        p.stockStatus.toLowerCase() === 'in stock' ? '✅ In Stock' : '❌ Out of Stock';
    return (
        `*${p.name}*\n` +
        `💰 Price: ₹${p.price}\n` +
        `🧵 Material: ${p.material}\n` +
        `${stock}\n` +
        `🔑 SKU: ${p.sku}`
    );
}

/**
 * Invalidate cache (e.g., after an order changes stock status)
 */
function invalidateCache() {
    productsCache = null;
    cacheExpiry = 0;
}

module.exports = {
    getAllProducts,
    findProduct,
    findProductBySKU,
    getInStockProducts,
    getCategories,
    getProductsByCategory,
    formatProductsForAI,
    formatProductForCustomer,
    invalidateCache,
};
