import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DOMAINS } from './data/domains.js';
import { QUESTIONS, questionsByDomain } from './data/content.js';
import { LESSONS } from './data/lessons.js';
import { levelInfo, setMuted } from './fun.js';
import { cloudEnabled, testMode, getLink, setLink, cloudLoad, cloudSave, normalizeProfile } from './cloud.js';

// Test mode (?test=1) uses its own memory, so tests never touch Andrea's progress.
const KEY = testMode ? 'andrea-rbt-test' : 'andrea-rbt-v1';

export const todayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const dayOffset = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return todayKey(d);
};

const DEFAULT = {
  name: 'Andrea',
  theme: null, // light | dark | null (system)
  skin: 'lavender',
  outfit: 'bow',
  sound: true,
  rate: 1,
  goal: 15,
  answers: {}, // qid -> { c, w, last, conf }
  mistakes: [],
  fixed: 0,
  lessons: {},
  srs: {},
  reviews: 0,
  quizzes: [],
  exams: [],
  lastExam: null,
  exam: null,
  days: [],
  time: {},
  notes: [],
  badges: {},
  // v2: fun + study plan
  xp: 0,
  hearts: 5,
  heartsDay: null,
  freezes: 0,
  frozenDays: [],
  chestDay: null,
  log: {}, // day -> { q, c, cards, games, lessons, xp }
  examDate: null,
  videos: [], // { id, yt, title, d, watched }
  watched: {}, // lessonId -> true (Mia video lessons)
  explainers: {},
  pomos: [], // { date, min }
  bosses: {}, // domain -> date beaten
  games: {}, // gameId -> best score
  chat: [], // chat with Mia
  updatedAt: 0,
  // transient (not saved)
  newBadges: [],
  levelUp: null,
};

const TRANSIENT = ['newBadges', 'levelUp'];

function fresh(raw) {
  const s = { ...DEFAULT, ...raw, newBadges: [], levelUp: null };
  if (s.heartsDay !== todayKey()) {
    s.hearts = 5;
    s.heartsDay = todayKey();
  }
  return s;
}

// Bump this number to give every device a clean start (used once before handing the app to Andrea).
const FRESH_START = '2026-11-14';

function load() {
  try {
    if (!testMode && localStorage.getItem('andrea-rbt-fresh') !== FRESH_START) {
      localStorage.removeItem(KEY);
      localStorage.removeItem('andrea-rbt-cloud');
      localStorage.setItem('andrea-rbt-fresh', FRESH_START);
    }
    const raw = localStorage.getItem(KEY);
    return fresh(raw ? JSON.parse(raw) : {});
  } catch {
    return fresh({});
  }
}

function strip(s) {
  const out = { ...s };
  TRANSIENT.forEach((k) => delete out[k]);
  return out;
}

function save(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(strip(s)));
  } catch {
    /* storage full or blocked */
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
  const set = new Set([...s.days, ...(s.frozenDays || [])]);
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
export const todayLog = (s) => s.log[todayKey()] || {};

export function weekLog(s) {
  const sum = { q: 0, c: 0, cards: 0, games: 0, lessons: 0, xp: 0, days: 0, quizzes: 0 };
  for (let i = 0; i < 7; i++) {
    const l = s.log[dayOffset(-i)];
    if (!l) continue;
    sum.days += 1;
    for (const k of Object.keys(sum)) if (k !== 'days') sum[k] += l[k] || 0;
  }
  return sum;
}

// Days left until the next level, based on her average XP of the last 7 days.
export function daysToNextLevel(s) {
  const w = weekLog(s);
  const perDay = w.xp / 7;
  if (perDay < 1) return null;
  const { into, need } = levelInfo(s.xp);
  return Math.max(1, Math.ceil((need - into) / perDay));
}

// ───────── Challenges ─────────
const DAILY = [
  { id: 'q20', text: 'Answer 20 questions', key: 'q', goal: 20 },
  { id: 'cards20', text: 'Review 20 flashcards', key: 'cards', goal: 20 },
  { id: 'games2', text: 'Play 2 games', key: 'games', goal: 2 },
  { id: 'lessons3', text: 'Learn 3 lessons', key: 'lessons', goal: 3 },
  { id: 'xp100', text: 'Earn 100 XP', key: 'xp', goal: 100 },
];
const WEEKLY = [
  { id: 'wxp', text: 'Earn 700 XP this week', key: 'xp', goal: 700 },
  { id: 'wdays', text: 'Study 5 days this week', key: 'days', goal: 5 },
  { id: 'wq', text: 'Answer 100 questions this week', key: 'q', goal: 100 },
];

export function challenges(s) {
  const dayNum = Math.floor(Date.now() / 86400000);
  const d = DAILY[dayNum % DAILY.length];
  const w = WEEKLY[Math.floor(dayNum / 7) % WEEKLY.length];
  const t = todayLog(s);
  const wk = weekLog(s);
  return [
    { ...d, kind: 'Daily challenge', value: Math.min(d.goal, t[d.key] || 0) },
    { ...w, kind: 'Weekly challenge', value: Math.min(w.goal, wk[w.key] || 0) },
  ];
}

// ───────── Badges ─────────
export const BADGES = [
  { id: 'first-quiz', name: 'First Quiz', desc: 'Finish your first quiz.', test: (s) => s.quizzes.length >= 1 },
  { id: 'streak-7', name: '7-Day Streak', desc: 'Study 7 days in a row.', test: (s) => streak(s) >= 7 },
  { id: 'data-queen', name: 'Data Queen', desc: 'Score 90%+ on a Data Collection quiz.', test: (s) => s.quizzes.some((q) => q.d === 'A' && q.score / q.total >= 0.9) },
  { id: 'ethics-pro', name: 'Ethics Pro', desc: 'Score 90%+ on an Ethics quiz.', test: (s) => s.quizzes.some((q) => q.d === 'F' && q.score / q.total >= 0.9) },
  { id: 'mock-passed', name: 'Mock Exam Passed', desc: 'Score 80%+ on a full mock exam.', test: (s) => s.exams.some((e) => e.passed) },
  { id: 'goal-getter', name: 'Goal Getter', desc: 'Reach your daily study goal.', test: (s) => Object.values(s.time).some((sec) => sec >= s.goal * 60) },
  { id: 'bookworm', name: 'Bookworm', desc: 'Learn every lesson.', test: (s) => LESSONS.every((l) => s.lessons[l.id]) },
  { id: 'flash-fan', name: 'Elephant Memory', desc: 'Review 50 flashcards.', test: (s) => s.reviews >= 50 },
  { id: 'comeback', name: 'Comeback Kid', desc: 'Fix 10 mistakes from your bank.', test: (s) => s.fixed >= 10 },
  { id: 'note-taker', name: 'Note Taker', desc: 'Write your first note.', test: (s) => s.notes.length >= 1 },
  { id: 'all-domains', name: 'Explorer', desc: 'Take a quiz in all 6 domains.', test: (s) => DOMAINS.every((d) => s.quizzes.some((q) => q.d === d.id)) },
  { id: 'gamer', name: 'Game On', desc: 'Play 10 games.', test: (s) => Object.values(s.log).reduce((a, l) => a + (l.games || 0), 0) >= 10 },
  { id: 'boss', name: 'Boss Beater', desc: 'Beat your first Boss Battle.', test: (s) => Object.keys(s.bosses).length >= 1 },
  { id: 'all-bosses', name: 'Road Complete', desc: 'Beat all 6 bosses.', test: (s) => DOMAINS.every((d) => s.bosses[d.id]) },
  { id: 'level-5', name: 'Level 5', desc: 'Reach level 5.', test: (s) => levelInfo(s.xp).level >= 5 },
  { id: 'watcher', name: 'Movie Night', desc: 'Watch 5 video lessons.', test: (s) => Object.keys(s.watched).length + s.videos.filter((v) => v.watched).length >= 5 },
  { id: 'focus', name: 'Focus Mode', desc: 'Finish 3 Pomodoro sessions.', test: (s) => s.pomos.length >= 3 },
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
export function logInc(n, key, amount = 1) {
  const t = todayKey();
  const cur = n.log[t] || {};
  n.log = { ...n.log, [t]: { ...cur, [key]: (cur[key] || 0) + amount } };
}

export function addXP(n, amount) {
  if (!amount) return;
  const before = levelInfo(n.xp).level;
  n.xp = (n.xp || 0) + amount;
  logInc(n, 'xp', amount);
  const after = levelInfo(n.xp).level;
  if (after > before) n.levelUp = after;
}

export function markStudy(n) {
  const t = todayKey();
  if (!n.days.includes(t)) n.days = [...n.days, t].slice(-400);
}

// conf: 1 = guessed, 2 = kinda sure, 3 = sure. A correct guess stays in the mistakes bank.
export function recordAnswer(n, qid, correct, conf) {
  const prev = n.answers[qid] || { c: 0, w: 0, last: false };
  n.answers = { ...n.answers, [qid]: { c: prev.c + (correct ? 1 : 0), w: prev.w + (correct ? 0 : 1), last: correct, conf: conf ?? prev.conf } };
  const inBank = n.mistakes.includes(qid);
  const needsReview = !correct || conf === 1;
  if (needsReview && !inBank) n.mistakes = [...n.mistakes, qid];
  if (!needsReview && inBank) {
    n.mistakes = n.mistakes.filter((id) => id !== qid);
    n.fixed += 1;
  }
  logInc(n, 'q');
  if (correct) {
    logInc(n, 'c');
    addXP(n, 5);
  }
  markStudy(n);
}

export function setConfidence(n, qid, conf) {
  const a = n.answers[qid];
  if (!a) return;
  n.answers = { ...n.answers, [qid]: { ...a, conf } };
  if (conf === 1 && !n.mistakes.includes(qid)) n.mistakes = [...n.mistakes, qid];
}

// Uses streak freezes for missed days (only right after a gap).
function applyFreezes(n) {
  const set = new Set([...n.days, ...n.frozenDays]);
  if (!set.size || set.has(dayOffset(-1)) || set.has(todayKey())) return;
  const missed = [];
  for (let i = 1; i <= 7; i++) {
    const k = dayOffset(-i);
    if (set.has(k)) break;
    missed.push(k);
  }
  if (missed.length && missed.length <= 7 && missed.length <= n.freezes && set.has(dayOffset(-missed.length - 1))) {
    n.freezes -= missed.length;
    n.frozenDays = [...n.frozenDays, ...missed].slice(-60);
  }
}

// ───────── Provider ─────────
const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [s, setS] = useState(load);
  const sRef = useRef(s);
  sRef.current = s;

  // silent = don't count as a "real" change (used by the study-time ticker).
  const update = useCallback((fn, silent = false) => {
    setS((prev) => {
      const n = structuredClone(prev);
      fn(n);
      if (n.heartsDay !== todayKey()) {
        n.hearts = 5;
        n.heartsDay = todayKey();
      }
      checkBadges(n);
      if (!silent) n.updatedAt = Date.now();
      return n;
    });
  }, []);

  useEffect(() => save(s), [s]);
  useEffect(() => setMuted(!s.sound), [s.sound]);
  useEffect(() => update((n) => applyFreezes(n), true), [update]);

  // Theme + color skin
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = s.skin === 'galaxy' || (s.theme ? s.theme === 'dark' : mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.dataset.skin = s.skin || 'lavender';
      const c = getComputedStyle(document.documentElement).getPropertyValue('--b600').trim().replace(/ /g, ',');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#120A22' : `rgb(${c})`);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [s.theme, s.skin]);

  // Study-time ticker (only while the app is visible).
  useEffect(() => {
    const STEP = 15;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      update((n) => {
        const t = todayKey();
        n.time = { ...n.time, [t]: (n.time[t] || 0) + STEP };
      }, true);
    }, STEP * 1000);
    return () => clearInterval(id);
  }, [update]);

  // ───────── Cloud sync ─────────
  const [cloud, setCloud] = useState(() => ({ status: cloudEnabled && getLink() ? 'syncing' : 'off', profile: getLink()?.profile }));
  const lastSaved = useRef({ updatedAt: -1, at: 0 });
  const saving = useRef(false);

  const push = useCallback(async () => {
    const link = getLink();
    if (!cloudEnabled || !link || saving.current) return;
    saving.current = true;
    const snap = strip(sRef.current);
    try {
      await cloudSave(link, snap);
      lastSaved.current = { updatedAt: snap.updatedAt, at: Date.now() };
      setCloud({ status: 'saved', profile: link.profile, at: Date.now() });
    } catch (e) {
      setCloud({ status: e.message, profile: link.profile });
    } finally {
      saving.current = false;
    }
  }, []);

  // preferRemote: on a new sign-in, the cloud copy always wins (so a new phone never overwrites her progress).
  const pull = useCallback(
    async (link, preferRemote) => {
      setCloud({ status: 'syncing', profile: link.profile });
      try {
        const r = await cloudLoad(link);
        if (r && r.data && (preferRemote || (r.data.updatedAt || 0) > (sRef.current.updatedAt || 0))) {
          const next = fresh(r.data);
          lastSaved.current = { updatedAt: next.updatedAt, at: Date.now() };
          setS(next);
          setCloud({ status: 'saved', profile: link.profile, at: Date.now(), restored: true });
        } else {
          await push();
        }
        return true;
      } catch (e) {
        setCloud({ status: e.message, profile: link.profile });
        return e.message;
      }
    },
    [push]
  );

  useEffect(() => {
    const link = getLink();
    if (cloudEnabled && link) pull(link, false);
  }, [pull]);

  // Auto-save: 4 s after a change, and every 2 min for study time.
  useEffect(() => {
    if (!cloudEnabled || !getLink()) return;
    const changed = s.updatedAt !== lastSaved.current.updatedAt;
    const stale = Date.now() - lastSaved.current.at > 120000;
    if (!changed && !stale) return;
    const t = setTimeout(push, changed ? 4000 : 0);
    return () => clearTimeout(t);
  }, [s, push]);

  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && push();
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [push]);

  const linkCloud = useCallback(
    async (name, pin) => {
      const link = { profile: normalizeProfile(name), pin };
      setLink(link);
      const res = await pull(link, true);
      if (res !== true) setLink(null);
      return res;
    },
    [pull]
  );

  const unlinkCloud = useCallback(() => {
    setLink(null);
    setCloud({ status: 'off' });
  }, []);

  const value = useMemo(() => ({ s, update, cloud, linkCloud, unlinkCloud, syncNow: push }), [s, update, cloud, linkCloud, unlinkCloud, push]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

export function resetAll() {
  try {
    // A fresh, newer save: on reload it also replaces the copy in the cloud.
    localStorage.setItem(KEY, JSON.stringify({ updatedAt: Date.now() }));
  } catch {
    /* ignore */
  }
  window.location.hash = '';
  window.location.reload();
}

export { QUESTIONS, cloudEnabled };
