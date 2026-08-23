const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Node Gateway Server is up and running!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Node Gateway' });
});

app.listen(PORT, () => {
  console.log(`Gateway server running on http://localhost:${PORT}`);
});