import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { model, systemPrompt, messages } = req.body;

  try {
    if (model === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.VITE_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          temperature: 0.4,
          system: systemPrompt,
          messages,
        }),
      });
      const data = await response.json();
      return res.json({ text: data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '' });

    } else if (model === 'chatgpt') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY || ''}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          temperature: 0.4,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
        }),
      });
      const data = await response.json();
      return res.json({ text: data.choices?.[0]?.message?.content || '' });
    }

    return res.status(400).json({ error: 'Unknown model' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
