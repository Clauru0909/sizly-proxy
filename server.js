const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/', (req, res) => res.send('Sizly Proxy OK'));

// Bodygram session (kept for reference)
app.post('/session', async (req, res) => {
  res.json({ error: 'Using photo analysis instead' });
});

// Claude Vision — analyze body photos
app.post('/analyze', async (req, res) => {
  try {
    const { frontImage, sideImage, frontType, sideType, height, lang } = req.body;

    const prompt = lang === 'en'
      ? `You are an expert in female body measurement. Analyze these two photos (front and side view). Height: ${height} cm. Estimate bust (chest circumference), waist (narrowest), and hips (widest) in cm. Consider the fitted clothing. Reply ONLY with valid JSON, no explanation: {"bust":92,"waist":74,"hips":101}`
      : `Eres experta en medidas corporales femeninas. Analiza estas dos fotos (frente y perfil). Altura: ${height} cm. Estima busto (contorno pecho), cintura (parte más estrecha) y cadera (parte más ancha) en cm. Considera la ropa ajustada. Responde ÚNICAMENTE con JSON válido, sin explicación: {"bust":92,"waist":74,"hips":101}`;

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
    console.log('Claude response:', JSON.stringify(data).substring(0, 200));

    const text = data.content?.[0]?.text || '';
    const match = text.match(/\{[^}]+\}/);
    if (!match) throw new Error('No JSON in response: ' + text);

    const result = JSON.parse(match[0]);
    res.json({
      bust:  Math.round(result.bust  || result.chest || 92),
      waist: Math.round(result.waist || 74),
      hips:  Math.round(result.hips  || result.hip   || 101)
    });

  } catch (err) {
    console.error('Analyze error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.options('*', cors());
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Sizly proxy on port', PORT));
