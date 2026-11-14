import { generate, limited } from './_gemini.js';
import { CHEATSHEET } from '../src/data/content.js';
import { LESSONS } from '../src/data/lessons.js';
import { DOMAIN } from '../src/data/domains.js';

// POST /api/ask  { question, topic?, history? }  ->  { answer }
// Fast models first (about 1-2 s). Checked against the real API on 14-nov-2026.
const MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];

// Everything Andrea studies in the app, so Mia's answers match her lessons.
const KNOWLEDGE = [
  'EXAM FACTS: 85 questions (75 scored + 10 unscored pilot), 90 minutes, 6 domains, 43 tasks. Weights: A Data Collection & Graphing 17%, B Behavior Assessment 11%, C Behavior Acquisition 25%, D Behavior Reduction 19%, E Documentation & Reporting 13%, F Ethics & Professional Conduct 15%.',
  'CHEAT SHEET:',
  ...CHEATSHEET.map((c) => `${DOMAIN[c.d].name}: ${c.items.join(' ')}`),
  'LESSONS IN THE APP (title: simple definition | exam trap | memory trick):',
  ...LESSONS.map((l) => `[${l.d}] ${l.title}: ${l.simple} | ${l.trap} | ${l.trick}`),
].join('\n');

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
  '- Base your answers on the study material below. If she asks for a practice question, write one original scenario question with 4 options (A-D), and give the answer only after she replies.',
  '- If she writes in Spanish, answer in simple English and add a short Spanish translation of the key term in parentheses.',
  '',
  KNOWLEDGE,
].join('\n');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (limited(req, 200)) return res.status(429).json({ error: 'Too many questions. Try again later.' });
  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const question = String(body.question || '').trim().slice(0, 1200);
  const topic = String(body.topic || '').trim().slice(0, 600);
  if (!question) return res.status(400).json({ error: 'Empty question' });
  // Recent conversation, so Mia remembers what we were talking about.
  const history = (Array.isArray(body.history) ? body.history : [])
    .slice(-8)
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .map((m) => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text.slice(0, 1500) }] }));
  while (history.length && history[0].role === 'model') history.shift(); // must start with the user
  try {
    const data = await generate(MODELS, {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [...history, { role: 'user', parts: [{ text: topic ? `We are studying: ${topic}.\n\nMy question: ${question}` : question }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 4096 },
    }, 15000);
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
