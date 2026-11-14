import confetti from 'canvas-confetti';

// ───────── Voice ─────────
// Two engines:
//  1. Gemini voice (natural, via /api/tts) for whole lessons. Cached for a year.
//  2. The device's own voice, but ONLY an English one (never a Spanish voice reading English).
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
let voices = [];
if (canSpeak) {
  const loadVoices = () => (voices = window.speechSynthesis.getVoices());
  loadVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

function voicesReady() {
  if (!canSpeak || voices.length) return Promise.resolve();
  return new Promise((resolve) => {
    const t = setTimeout(resolve, 1500);
    window.speechSynthesis.addEventListener?.('voiceschanged', () => {
      clearTimeout(t);
      resolve();
    });
  });
}

// Best English voice on this device: natural/neural voices first.
const RANK = [/natural/i, /google us english/i, /samantha/i, /\b(aria|jenny|ava|emma|michelle|allison|susan|zoe|nicky)\b/i, /google/i];
export function englishVoice() {
  const en = voices.filter((v) => /^en[-_]/i.test(v.lang || ''));
  if (!en.length) return null;
  const us = en.filter((v) => /^en[-_]us/i.test(v.lang));
  const pool = us.length ? us : en;
  for (const r of RANK) {
    const v = pool.find((x) => r.test(x.name));
    if (v) return v;
  }
  return pool.find((v) => v.localService) || pool[0];
}

export async function hasEnglishVoice() {
  await voicesReady();
  return !!englishVoice();
}

let speakToken = 0;
let currentAudio = null;

// Speaks with the device voice, sentence by sentence (long utterances get cut off in some browsers).
// Returns false if the device has no English voice.
export async function speak(text, rate = 1, onEnd) {
  stopSpeaking();
  const token = speakToken;
  if (!canSpeak) {
    onEnd?.(false);
    return false;
  }
  await voicesReady();
  if (token !== speakToken) return true;
  const voice = englishVoice();
  if (!voice) {
    onEnd?.(false);
    return false;
  }
  const synth = window.speechSynthesis;
  const parts = (text.replace(/[•→]/g, '. ').match(/[^.!?]+[.!?]*/g) || [text]).map((p) => p.trim()).filter((p) => p.length > 1);
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    if (i === parts.length - 1) u.onend = () => token === speakToken && onEnd?.(true);
    u.onerror = (e) => token === speakToken && e.error !== 'interrupted' && e.error !== 'canceled' && onEnd?.(true);
    synth.speak(u);
  });
  return true;
}

export function stopSpeaking() {
  speakToken += 1;
  if (canSpeak) window.speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
}

export const lessonAudioUrl = (id, simple) => `/api/tts?lesson=${encodeURIComponent(id)}${simple ? '&simple=1' : ''}`;

// Plays a whole lesson with the Gemini voice. If that fails (no key, no quota, offline),
// it falls back to the device's English voice. Must be called from a tap (iPhone rule).
// opts: { rate, onStart(engine), onEnd(ok), onTime(fraction) }
export function playLesson(id, simple, fallbackText, opts = {}) {
  stopSpeaking();
  const token = speakToken;
  const key = `${id}${simple ? '-s' : ''}`;

  // Not generated yet: talk right away with the device's English voice, and prepare
  // Mia's natural voice in the background so it's instant next time.
  if (!voiceReady(key)) {
    warmVoice(id, simple, key);
    speak(fallbackText, opts.rate || 1, (ok) => {
      if (ok !== false) return opts.onEnd?.(ok);
      // No English voice on this device: wait for the natural voice instead.
      playAudio(true);
    });
    opts.onStart?.('device'); // after speak(), so a caller can take over sentence by sentence
    return null;
  }
  return playAudio(false);

  function playAudio(patient) {
  const audio = new Audio(lessonAudioUrl(id, simple));
  currentAudio = audio;
  audio.preload = 'auto';
  audio.playbackRate = opts.rate || 1;
  let fellBack = false;
  const fallback = () => {
    if (fellBack || token !== speakToken) return;
    fellBack = true;
    audio.pause();
    currentAudio = null;
    if (patient) return opts.onEnd?.(false);
    speak(fallbackText, opts.rate || 1, (ok) => opts.onEnd?.(ok));
    opts.onStart?.('device');
  };
  let started = false;
  setTimeout(() => !started && fallback(), patient ? 30000 : 5000);
  audio.addEventListener('playing', () => {
    started = true;
    if (token === speakToken) opts.onStart?.('gemini');
  });
  audio.addEventListener('timeupdate', () => audio.duration && opts.onTime?.(audio.currentTime / audio.duration, audio));
  audio.addEventListener('ended', () => token === speakToken && opts.onEnd?.(true));
  audio.addEventListener('error', fallback);
  audio.play().catch(fallback);
  return audio;
  }
}

// Remembers which lessons already have Mia's natural voice ready (cached by the browser and CDN).
const READY_KEY = 'andrea-rbt-voice';
const warming = new Set();
function readyList() {
  try {
    return JSON.parse(localStorage.getItem(READY_KEY) || '[]');
  } catch {
    return [];
  }
}
export const voiceReady = (key) => readyList().includes(key);
function warmVoice(id, simple, key) {
  if (warming.has(key)) return;
  warming.add(key);
  fetch(lessonAudioUrl(id, simple))
    .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('audio') ? r.arrayBuffer() : null))
    .then((buf) => {
      if (!buf) return;
      try {
        localStorage.setItem(READY_KEY, JSON.stringify([...new Set([...readyList(), key])].slice(-200)));
      } catch {
        /* ignore */
      }
    })
    .catch(() => {})
    .finally(() => warming.delete(key));
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
  if (h < 12) return `Good morning, ${name}`;
  if (h < 18) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const go = (path) => {
  window.location.hash = `/${path}`;
};
