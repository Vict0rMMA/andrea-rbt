// Shared Gemini helpers for the Vercel functions. The API key never reaches the browser.
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export function keys() {
  return (process.env.GEMINI_API_KEY || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

// Tries each model with each key. Moves on when a model is unavailable, busy or out of quota.
export async function generate(models, body, timeoutMs = 45000) {
  const ks = keys();
  if (!ks.length) throw Object.assign(new Error('GEMINI_API_KEY is not set'), { status: 503 });
  let last;
  for (const model of models) {
    for (const key of ks) {
      let res;
      try {
        res = await fetch(`${BASE}/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (e) {
        // Too slow or network hiccup: try the next model.
        last = Object.assign(new Error(`${model} timeout/network: ${e.message}`), { status: 503 });
        continue;
      }
      if (res.ok) return res.json();
      last = Object.assign(new Error(`${model} ${res.status}: ${(await res.text()).slice(0, 300)}`), { status: res.status });
      if (![404, 429, 500, 503].includes(res.status)) throw last;
    }
  }
  throw last;
}

// ── Audio: Gemini returns raw 24 kHz PCM (or a WAV). We send a 16 kHz WAV to keep files small.
function parseWav(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return null;
  let off = 12;
  let rate = 24000;
  while (off < buf.length - 8) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'fmt ') rate = buf.readUInt32LE(off + 12);
    if (id === 'data') return { rate, pcm: buf.subarray(off + 8, Math.min(buf.length, off + 8 + size)) };
    off += 8 + size;
  }
  return null;
}

function resample(pcm, from, to) {
  if (from === to) return pcm;
  const n = Math.floor(pcm.length / 2);
  const outN = Math.floor((n * to) / from);
  const out = Buffer.alloc(outN * 2);
  for (let i = 0; i < outN; i++) {
    const pos = (i * from) / to;
    const j = Math.floor(pos);
    const f = pos - j;
    const a = pcm.readInt16LE(Math.min(j, n - 1) * 2);
    const b = pcm.readInt16LE(Math.min(j + 1, n - 1) * 2);
    out.writeInt16LE(Math.round(a + (b - a) * f), i * 2);
  }
  return out;
}

export function toWav(base64, mime = '') {
  const raw = Buffer.from(base64, 'base64');
  const wav = parseWav(raw);
  const srcRate = wav ? wav.rate : Number((mime.match(/rate=(\d+)/) || [])[1] || 24000);
  const pcm = resample(wav ? wav.pcm : raw, srcRate, 16000);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(16000, 24);
  h.writeUInt32LE(32000, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

// Small per-instance limit so a public URL can't drain the quota.
const hits = new Map();
export function limited(req, max = 30) {
  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0];
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 3600000);
  list.push(now);
  hits.set(ip, list);
  return list.length > max;
}
