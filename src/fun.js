// XP, levels, rewards, sounds and Coach Mia's reactions.

export const XP = {
  lesson: 10,
  card: 2,
  correct: 5,
  quiz: 10,
  video: 15,
  explainer: 10,
  game: 15,
  exam: 50,
  boss: 100,
  chest: 50,
  pomodoro: 20,
};

export const LEVEL_XP = 200; // XP per level

export const RANKS = [
  { from: 1, name: 'Rookie Tech' },
  { from: 3, name: 'Data Detective' },
  { from: 6, name: 'Prompt Master' },
  { from: 10, name: 'Reinforcement Queen' },
  { from: 15, name: 'RBT Ready' },
];

export function levelInfo(xp = 0) {
  const level = Math.floor(xp / LEVEL_XP) + 1;
  const into = xp % LEVEL_XP;
  const rank = [...RANKS].reverse().find((r) => level >= r.from);
  const nextRank = RANKS.find((r) => r.from > level);
  return { level, into, need: LEVEL_XP, pct: Math.round((into / LEVEL_XP) * 100), rank: rank.name, nextRank };
}

// Themes and Coach Mia outfits unlock with levels.
export const SKINS = [
  { id: 'lavender', name: 'Lavender', level: 1, colors: ['#7C3AED', '#D946EF'] },
  { id: 'sunset', name: 'Sunset', level: 3, colors: ['#E11D48', '#F97316'] },
  { id: 'ocean', name: 'Ocean', level: 6, colors: ['#0284C7', '#14B8A6'] },
  { id: 'galaxy', name: 'Dark Galaxy', level: 10, colors: ['#1E1B4B', '#EC4899'] },
];

export const OUTFITS = [
  { id: 'bow', name: 'Purple bow', level: 1 },
  { id: 'flower', name: 'Flower crown', level: 2 },
  { id: 'glasses', name: 'Smart glasses', level: 4 },
  { id: 'cap', name: 'Graduation cap', level: 8 },
  { id: 'crown', name: 'Queen crown', level: 15 },
];

// ───────── Sounds (made with Web Audio, no files) ─────────
let ctx = null;
let muted = false;
export const setMuted = (m) => (muted = m);

function tone(freq, start, dur, type = 'sine', vol = 0.18) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.05);
}

const SOUNDS = {
  correct: () => [659, 988].forEach((f, i) => tone(f, i * 0.09, 0.22, 'sine')),
  wrong: () => [220, 180].forEach((f, i) => tone(f, i * 0.12, 0.2, 'triangle', 0.14)),
  tap: () => tone(880, 0, 0.06, 'sine', 0.08),
  combo: () => [784, 988, 1175].forEach((f, i) => tone(f, i * 0.06, 0.15, 'sine', 0.12)),
  level: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.35, 'triangle', 0.16)),
  chest: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.3, 'sine', 0.14)),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.4, 'triangle', 0.15)),
};

export function sfx(name) {
  if (muted) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    SOUNDS[name]?.();
  } catch {
    /* audio not available */
  }
}

export function buzz(pattern = 20) {
  if (muted) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not supported (iPhone) */
  }
}

export const feedback = (ok) => {
  sfx(ok ? 'correct' : 'wrong');
  buzz(ok ? 15 : [40, 60, 40]);
};

// ───────── Coach Mia's reactions ─────────
export const MIA = {
  correct: ['Yes! Nailed it.', 'Look at you go!', 'Correct! Your brain is on fire.', 'That\'s my girl!', 'Perfect. Data Queen energy.', 'Boom! Reinforcement delivered.'],
  wrong: ['Oops! That\'s okay, mistakes are data.', 'Almost! Read the explanation, then try again.', 'No worries, even BCBAs were beginners.', 'Tricky one! Now you know the trap.'],
  streak: ['Combo! You\'re unstoppable.', 'Hot streak! Keep going.', 'Wow, three in a row!'],
  cheer: ['You got this, Andrea!', 'Small steps every day. You\'re doing it.', 'I believe in you!', 'One more and then a snack?'],
  proud: ['I\'m so proud of you!', 'Look how far you\'ve come!', 'Future RBT right here.'],
};
export const say = (k) => MIA[k][Math.floor(Math.random() * MIA[k].length)];
