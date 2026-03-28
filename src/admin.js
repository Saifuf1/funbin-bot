const express = require('express');
const router = express.Router();
const { getAllProducts } = require('./db/products');
const { getOrders } = require('./db/orders');
const aiConfig = require('./ai/config');

// Middleware for Admin Auth
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (authHeader === `Bearer ${adminPassword}`) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }
};

// 1. Dashboard Overview Stats
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const products = await getAllProducts();
        const orders = await getOrders();

        // Simple metric calculation
        const totalRevenue = orders.reduce((sum, o) => {
            const amount = parseInt(o.amount?.replace(/[^0-9]/g, '') || 0);
            return sum + amount;
        }, 0);

        res.json({
            revenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
            ordersCount: orders.length,
            productsCount: products.length,
            aiStats: {
                enabled: aiConfig.get().enabled,
                mode: aiConfig.get().mode
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Product Management
router.get('/products', adminAuth, async (req, res) => {
    try {
        const products = await getAllProducts();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Order Feed
router.get('/orders', adminAuth, async (req, res) => {
    try {
        const orders = await getOrders();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. AI Configuration
router.get('/ai-config', adminAuth, (req, res) => {
    res.json(aiConfig.get());
});

router.post('/ai-config', adminAuth, (req, res) => {
    const { enabled, mode, systemPrompt } = req.body;
    const updated = aiConfig.update({ enabled, mode, systemPrompt });
    res.json({ message: 'AI Configuration updated successfully', config: updated });
});

module.exports = router;
