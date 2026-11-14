import { generate, toWav, limited } from './_gemini.js';
import { LESSON, lessonSpeech } from '../src/data/speech.js';

// GET /api/tts?lesson=A-opdef[&simple=1]
// Only lesson texts can be spoken, and each answer is cached by the CDN for a year,
// so every lesson spends the free Gemini voice quota only once.
const MODELS = ['gemini-3.8-flash-tts', 'gemini-2.5-flash-preview-tts'];

export default async function handler(req, res) {
  const l = LESSON[req.query.lesson];
  if (!l) return res.status(404).json({ error: 'Unknown lesson' });
  if (limited(req, 40)) return res.status(429).json({ error: 'Too many requests' });
  try {
    const text = lessonSpeech(l, req.query.simple === '1');
    const data = await generate(MODELS, {
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part) throw Object.assign(new Error('No audio returned'), { status: 502 });
    const wav = toWav(part.inlineData.data, part.inlineData.mimeType || '');
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    return res.status(200).send(wav);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(e.status === 429 ? 429 : 503).json({ error: String(e.message || e).slice(0, 300) });
  }
}
