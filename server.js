const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/', (req, res) => res.send('Sizly Proxy OK'));

app.post('/session', async (req, res) => {
  res.json({ error: 'Using photo analysis instead' });
});

app.post('/analyze', async (req, res) => {
  try {
    const { frontImage, sideImage, frontType, sideType, height, lang } = req.body;

    const prompt = lang === 'en'
      ? `You are an expert in female body measurement. Analyse these two photos (front and side view). Height: ${height} cm. Estimate bust (chest circumference), waist (narrowest), and hips (widest) in cm. Reply ONLY with valid JSON: {"bust":92,"waist":74,"hips":101}`
      : `Eres experta en medidas corporales femeninas. Analiza estas dos fotos (frente y perfil). Altura: ${height} cm. Estima busto, cintura y cadera en cm. Responde SOLO con JSON: {"bust":92,"waist":74,"hips":101}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: frontType || 'image/jpeg', data: frontImage } },
            { type: 'image', source: { type: 'base64', media_type: sideType  || 'image/jpeg', data: sideImage  } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const match = text.match(/\{[^}]+\}/);
    if (!match) throw new Error('No JSON: ' + text);

    const result = JSON.parse(match[0]);
    res.json({
      bust:  Math.round(result.bust  || 92),
      waist: Math.round(result.waist || 74),
      hips:  Math.round(result.hips  || 101)
    });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.options('*', cors());

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Sizly proxy running on port ' + PORT);
});
