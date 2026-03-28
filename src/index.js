require('dotenv').config();
const express = require('express');
const cors = require('cors');
const adminRouter = require('./admin');
const webhookRouter = require('./webhook');
const payRouter = require('./pay/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for the dashboard
app.use(cors());

// Parse raw body for signature verification BEFORE json parsing
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Routes
app.use('/admin', adminRouter);
app.use('/webhook', webhookRouter);
app.use('/pay', payRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Sales Bot Backend is running 🚀' });
});

app.listen(PORT, () => {
  console.log(`✅ Sales Bot server running on port ${PORT}`);
});
