import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DOMAINS } from './data/domains.js';
import { QUESTIONS, questionsByDomain } from './data/content.js';
import { LESSONS } from './data/lessons.js';

const KEY = 'andrea-rbt-v1';

export const todayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DEFAULT = {
  name: 'Andrea',
  theme: null, // null = follow system
  rate: 1,
  goal: 15, // minutes per day
  answers: {}, // qid -> { c, w, last }
  mistakes: [], // qids
  fixed: 0, // mistakes later answered correctly
  lessons: {}, // lessonId -> date
  srs: {}, // cardId -> { due, interval, ease, reps }
  reviews: 0,
  quizzes: [], // { d, score, total, date }
  exams: [], // { date, pct, correct, total, byDomain, passed }
  lastExam: null,
  exam: null, // in-progress mock exam
  days: [], // study days (YYYY-MM-DD)
  time: {}, // day -> seconds studied
  notes: [],
  badges: {}, // id -> date earned
  newBadges: [],
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw), newBadges: [] };
  } catch {
    return { ...DEFAULT };
  }
}

function save(s) {
  try {
    const { newBadges, ...rest } = s;
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {
    /* storage full or blocked — app still works for this visit */
  }
}

// ───────── Derived stats ─────────
export function domainStats(s, d) {
  const qs = questionsByDomain(d);
  let answered = 0;
  let correct = 0;
  for (const q of qs) {
    const a = s.answers[q.id];
    if (a) {
      answered += 1;
      if (a.last) correct += 1;
    }
  }
  const accuracy = answered ? correct / answered : 0;
  const coverage = Math.min(1, answered / 15);
  return { total: qs.length, answered, correct, accuracy, score: Math.round(accuracy * coverage * 100) };
}

export function readiness(s) {
  return Math.round(DOMAINS.reduce((sum, d) => sum + (domainStats(s, d.id).score * d.weight) / 100, 0));
}

export function weakestDomain(s) {
  return [...DOMAINS].sort((a, b) => {
    const diff = domainStats(s, a.id).score - domainStats(s, b.id).score;
    return diff !== 0 ? diff : b.weight - a.weight;
  })[0];
}

export function streak(s) {
  const set = new Set(s.days);
  const d = new Date();
  if (!set.has(todayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(todayKey(d))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const minutesToday = (s) => Math.floor((s.time[todayKey()] || 0) / 60);

// ───────── Badges ─────────
export const BADGES = [
  { id: 'first-quiz', name: 'First Quiz', emoji: '🎉', desc: 'Finish your first quiz.', test: (s) => s.quizzes.length >= 1 },
  { id: 'streak-7', name: '7-Day Streak', emoji: '🔥', desc: 'Study 7 days in a row.', test: (s) => streak(s) >= 7 },
  { id: 'data-queen', name: 'Data Queen', emoji: '👑', desc: 'Score 90%+ on a Data Collection quiz.', test: (s) => s.quizzes.some((q) => q.d === 'A' && q.score / q.total >= 0.9) },
  { id: 'ethics-pro', name: 'Ethics Pro', emoji: '💜', desc: 'Score 90%+ on an Ethics quiz.', test: (s) => s.quizzes.some((q) => q.d === 'F' && q.score / q.total >= 0.9) },
  { id: 'mock-passed', name: 'Mock Exam Passed', emoji: '🏆', desc: 'Score 80%+ on a full mock exam.', test: (s) => s.exams.some((e) => e.passed) },
  { id: 'goal-getter', name: 'Goal Getter', emoji: '🎯', desc: 'Reach your daily study goal.', test: (s) => Object.values(s.time).some((sec) => sec >= s.goal * 60) },
  { id: 'bookworm', name: 'Bookworm', emoji: '📚', desc: 'Learn every lesson.', test: (s) => LESSONS.every((l) => s.lessons[l.id]) },
  { id: 'flash-fan', name: 'Elephant Memory', emoji: '🐘', desc: 'Review 50 flashcards.', test: (s) => s.reviews >= 50 },
  { id: 'comeback', name: 'Comeback Kid', emoji: '💪', desc: 'Fix 10 mistakes from your bank.', test: (s) => s.fixed >= 10 },
  { id: 'note-taker', name: 'Note Taker', emoji: '✍️', desc: 'Write your first note.', test: (s) => s.notes.length >= 1 },
  { id: 'all-domains', name: 'Explorer', emoji: '🧭', desc: 'Take a quiz in all 6 domains.', test: (s) => DOMAINS.every((d) => s.quizzes.some((q) => q.d === d.id)) },
];

function checkBadges(n) {
  for (const b of BADGES) {
    if (!n.badges[b.id] && b.test(n)) {
      n.badges[b.id] = todayKey();
      n.newBadges = [...(n.newBadges || []), b.id];
    }
  }
}

// ───────── Mutations (used inside update) ─────────
export function markStudy(n) {
  const t = todayKey();
  if (!n.days.includes(t)) n.days = [...n.days, t].slice(-400);
}

export function recordAnswer(n, qid, correct) {
  const prev = n.answers[qid] || { c: 0, w: 0, last: false };
  n.answers = { ...n.answers, [qid]: { c: prev.c + (correct ? 1 : 0), w: prev.w + (correct ? 0 : 1), last: correct } };
  const inBank = n.mistakes.includes(qid);
  if (!correct && !inBank) n.mistakes = [...n.mistakes, qid];
  if (correct && inBank) {
    n.mistakes = n.mistakes.filter((id) => id !== qid);
    n.fixed += 1;
  }
  markStudy(n);
}

// ───────── Provider ─────────
const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [s, setS] = useState(load);

  const update = useCallback((fn) => {
    setS((prev) => {
      const n = structuredClone(prev);
      fn(n);
      checkBadges(n);
      return n;
    });
  }, []);

  useEffect(() => save(s), [s]);

  // Theme
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = s.theme ? s.theme === 'dark' : mq.matches;
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#140A26' : '#7C3AED');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [s.theme]);

  // Study-time tracker: counts while the app is visible.
  useEffect(() => {
    const STEP = 15;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      update((n) => {
        const t = todayKey();
        n.time = { ...n.time, [t]: (n.time[t] || 0) + STEP };
      });
    }, STEP * 1000);
    return () => clearInterval(id);
  }, [update]);

  const value = useMemo(() => ({ s, update }), [s, update]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

export function resetAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.location.hash = '';
  window.location.reload();
}

export { QUESTIONS };
