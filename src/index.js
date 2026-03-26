require('dotenv').config();
const express = require('express');
const webhookRouter = require('./webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse raw body for signature verification BEFORE json parsing
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Routes
app.use('/webhook', webhookRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Sales Bot Backend is running 🚀' });
});

app.listen(PORT, () => {
  console.log(`✅ Sales Bot server running on port ${PORT}`);
});
