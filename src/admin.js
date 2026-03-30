const express = require('express');
const router = express.Router();
const { getAllProducts } = require('./db/products');
const { getOrders } = require('./db/orders');
const { getClientById } = require('./db/saas');
const aiConfig = require('./ai/config');

// Middleware for Admin Auth & Client Detection
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (authHeader !== `Bearer ${adminPassword}`) {
        return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }

    // Resolve client from header (SaaS support)
    const clientId = req.headers['x-client-id'] || 'owner';
    const client = getClientById(clientId);

    if (!client) {
        return res.status(404).json({ error: 'Client configuration not found' });
    }

    req.client = client;
    next();
};

// 1. Dashboard Overview Stats
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const sheetsId = req.client.googleSheetsId;
        const products = await getAllProducts(sheetsId);
        const orders = await getOrders(sheetsId);

        const totalRevenue = orders.reduce((sum, o) => {
            const amount = parseInt(String(o.amount || '0').replace(/[^0-9]/g, '') || 0);
            return sum + amount;
        }, 0);

        // Get 10 most recent orders
        const recentOrders = orders.slice(-10).reverse();

        res.json({
            revenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
            ordersCount: orders.length,
            productsCount: products.length,
            recentOrders: recentOrders,
            aiStats: {
                enabled: req.client.aiConfig?.enabled ?? true,
                mode: req.client.aiConfig?.mode ?? 'Auto'
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Product Management
router.get('/products', adminAuth, async (req, res) => {
    try {
        const products = await getAllProducts(req.client.googleSheetsId);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Order Feed
router.get('/orders', adminAuth, async (req, res) => {
    try {
        const orders = await getOrders(req.client.googleSheetsId);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. AI Configuration
router.get('/ai-config', adminAuth, (req, res) => {
    res.json(req.client.aiConfig || { enabled: true, mode: 'Auto', systemPrompt: '' });
});

const updateAiConfig = (req, res) => {
    const { enabled, mode, systemPrompt } = req.body;
    // In a real SaaS, we would update the DB (clients.json) here.
    // For now, we update the local object (reflects in memory until restart)
    req.client.aiConfig = { enabled, mode, systemPrompt };
    res.json({ message: 'AI Configuration updated for ' + req.client.name, config: req.client.aiConfig });
};

router.post('/ai-config', adminAuth, updateAiConfig);
router.put('/ai-config', adminAuth, updateAiConfig);

module.exports = router;
