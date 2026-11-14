import { generate, limited } from './_gemini.js';

// POST /api/ask  { question, topic? }  ->  { answer }
const MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash'];

const SYSTEM = [
  'You are Coach Mia, a kind and patient tutor (a cute pink elephant) helping a student named Andrea pass the BACB RBT exam (Registered Behavior Technician, 2026, 3rd edition task list).',
  'Rules:',
  '- Answer in VERY simple English: short sentences, everyday words, like a friend explaining. English may not be her first language.',
  '- Any technical word gets a plain definition right next to it.',
  '- Use one short real-life example with a child in ABA therapy when it helps.',
  '- If useful, end with one line that starts with "Exam tip:" about a common trap.',
  '- Keep it under 130 words. No headings, no tables, no emojis. Short dashes for lists are fine.',
  '- Stay true to the RBT role: RBTs implement plans, the BCBA designs and changes them. Never give medical or legal advice.',
  '- If the question is not about ABA, the RBT exam or studying, kindly say you can only help with RBT topics.',
].join('\n');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (limited(req, 60)) return res.status(429).json({ error: 'Too many questions. Try again later.' });
  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const question = String(body.question || '').trim().slice(0, 600);
  const topic = String(body.topic || '').trim().slice(0, 300);
  if (!question) return res.status(400).json({ error: 'Empty question' });
  try {
    const data = await generate(MODELS, {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: topic ? `We are studying: ${topic}.\n\nMy question: ${question}` : question }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 4096 },
    });
    const answer = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => (p.thought ? '' : p.text || ''))
      .join('')
      .trim();
    if (!answer) throw new Error('Empty answer');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ answer });
  } catch (e) {
    console.error(e);
    return res.status(503).json({ error: 'Coach Mia is resting right now. Try again in a minute.' });
  }
}
