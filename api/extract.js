export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { base64, mediaType } = req.body;
  if (!base64 || !mediaType) return res.status(400).json({ error: 'Missing base64 or mediaType' });

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' });
  if (!/^[\x20-\x7E]+$/.test(apiKey) || /\s/.test(apiKey)) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is malformed (contains whitespace or non-ASCII). Re-paste it in Vercel env vars.' });
  }

  const isPDF = mediaType === 'application/pdf';

  const prompt = 'Extract data from this gas/fuel receipt. Return ONLY a raw JSON object with no markdown, no explanation. Use exactly these keys: {"station": "name only", "date": "MM/DD/YYYY", "total": 103.08, "mileage": 27160, "fleet_card_last4": "6902"}. Use null for missing values. total and mileage must be numbers.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: isPDF ? 'document' : 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', result);
      return res.status(500).json({ error: result?.error?.message || 'API error' });
    }

    const rawText = result?.content?.find(b => b.type === 'text')?.text || '';
    const clean = rawText.replace(/```[\w]*/g, '').replace(/```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'No JSON in response', raw: rawText });

    const extracted = JSON.parse(jsonMatch[0]);

    // Normalize date to MM/DD/YYYY
    if (extracted.date) {
      const isoMatch = extracted.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) extracted.date = `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
    }

    return res.status(200).json(extracted);

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error during extraction. Check Vercel function logs.' });
  }
}
