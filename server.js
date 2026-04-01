const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = 'mDszUadIuQvFEjISUHmxhXCUjb9DTSAPgBn0nKKpDla';

app.post('/session', async (req, res) => {
  try {
    const response = await fetch('https://api.bodyscanner.bodygram.com/scanning/v0/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: API_KEY })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Sizly Bodygram Proxy OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Proxy running on port', PORT));
