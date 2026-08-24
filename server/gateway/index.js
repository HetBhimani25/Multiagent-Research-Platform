const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { initDB } = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());

// Initialize Database
initDB();

// Mount Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Node Gateway Server is up and running!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Node Gateway' });
});

app.listen(PORT, () => {
  console.log(`Gateway server running on http://localhost:${PORT}`);
});