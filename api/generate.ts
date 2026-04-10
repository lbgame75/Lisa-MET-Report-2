import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { model, systemPrompt, messages } = req.body;

  // Debug: confirm keys are loading (remove after testing)
  const claudeKeyPresent = !!(process.env.VITE_ANTHROPIC_API_KEY);
  const openaiKeyPresent = !!(process.env.VITE_OPENAI_API_KEY);
  console.log(`Keys present — Claude: ${claudeKeyPresent}, OpenAI: ${openaiKeyPresent}`);

  try {
    if (model === 'claude') {
      const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'Anthropic API key not found in environment' });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
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
      if (!response.ok) {
        console.error('Anthropic API error:', JSON.stringify(data));
        return res.status(500).json({ error: data?.error?.message || `Anthropic error ${response.status}` });
      }

      const text = data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') || '';
      return res.json({ text });

    } else if (model === 'chatgpt') {
      const apiKey = process.env.VITE_OPENAI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not found in environment' });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          temperature: 0.4,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('OpenAI API error:', JSON.stringify(data));
        return res.status(500).json({ error: data?.error?.message || `OpenAI error ${response.status}` });
      }

      return res.json({ text: data.choices?.[0]?.message?.content || '' });
    }

    return res.status(400).json({ error: 'Unknown model' });

  } catch (err: any) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
