import confetti from 'canvas-confetti';

// ───────── Speech (Web Speech API) ─────────
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
let voices = [];
if (canSpeak) {
  const loadVoices = () => (voices = window.speechSynthesis.getVoices());
  loadVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

function pickVoice() {
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith('en-us'));
  const pref = ['Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Ava', 'Allison', 'Zira'];
  for (const p of pref) {
    const v = en.find((x) => x.name.includes(p));
    if (v) return v;
  }
  return en[0] || voices.find((v) => v.lang?.startsWith('en')) || null;
}

let speakToken = 0;
// Speaks sentence by sentence (long single utterances get cut off in some browsers).
export function speak(text, rate = 1, onEnd) {
  if (!canSpeak) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const token = ++speakToken;
  const parts = (text.replace(/[•→]/g, '. ').match(/[^.!?]+[.!?]*/g) || [text]).map((p) => p.trim()).filter((p) => p.length > 1);
  const voice = pickVoice();
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p);
    u.lang = 'en-US';
    u.rate = rate;
    u.pitch = 1.05;
    if (voice) u.voice = voice;
    if (i === parts.length - 1) u.onend = () => token === speakToken && onEnd?.();
    u.onerror = () => token === speakToken && onEnd?.();
    synth.speak(u);
  });
}

export function stopSpeaking() {
  if (!canSpeak) return;
  speakToken += 1;
  window.speechSynthesis.cancel();
}

// ───────── Spaced repetition (simplified SM-2) ─────────
const DAY = 86400000;
export function schedule(card = {}, grade) {
  let { interval = 0, ease = 2.5, reps = 0 } = card;
  const now = Date.now();
  if (grade === 0) {
    return { interval: 0, ease: Math.max(1.3, ease - 0.2), reps: 0, due: now + 60000 };
  }
  if (grade === 1) {
    interval = Math.max(1, Math.round((interval || 1) * 1.2));
    ease = Math.max(1.3, ease - 0.15);
  } else if (grade === 2) {
    interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease);
    reps += 1;
  } else {
    interval = reps === 0 ? 4 : Math.round(Math.max(interval, 1) * ease * 1.3);
    ease += 0.15;
    reps += 1;
  }
  return { interval, ease, reps, due: now + interval * DAY };
}

export function nextLabel(card, grade) {
  const r = schedule(card, grade);
  if (grade === 0) return '1 min';
  return r.interval === 1 ? '1 day' : `${r.interval} days`;
}

// ───────── Helpers ─────────
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function celebrate(big = false) {
  if (reduced()) return;
  const colors = ['#7C3AED', '#A78BFA', '#F0ABFC', '#F472B6', '#FDE68A'];
  if (!big) {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors });
    return;
  }
  const end = Date.now() + 1200;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function greeting(name) {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name} ☀️`;
  if (h < 18) return `Good afternoon, ${name} 🌤️`;
  return `Good evening, ${name} 🌙`;
}

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const go = (path) => {
  window.location.hash = `/${path}`;
};
