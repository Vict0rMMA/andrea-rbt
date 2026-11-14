import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Lock, Unlock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useStore, addXP, logInc, markStudy } from '../store.jsx';
import { FRENZY, FUNCTIONS, RP, PROMPTS_LEAST_TO_MOST, TASKS, NOTES, ETHICS_SWIPE, MEASURE, MEASURES } from '../data/games.js';
import { FLASHCARDS, questionsByDomain } from '../data/content.js';
import { go, shuffle, celebrate } from '../lib.js';
import { XP, feedback, sfx, say } from '../fun.js';
import { Card, Button, PageTitle, BackButton, Mia, MiaSays, Bar, cx } from '../components/ui.jsx';
import { OptionList, withOrder } from './Quiz.jsx';

export const GAMES = [
  { id: 'frenzy', name: 'Function Frenzy', desc: '60 seconds. Pick the function of each behavior.', d: 'B' },
  { id: 'rp', name: 'Reinforce or Punish?', desc: 'Fast cards. Build a combo!', d: 'C' },
  { id: 'ladder', name: 'Prompt Ladder', desc: 'Put prompts and task steps in order.', d: 'C' },
  { id: 'measure', name: 'Measure It!', desc: 'Watch the clip, pick the measurement.', d: 'A' },
  { id: 'graph', name: 'Graph Reader', desc: 'Trend, level or variability?', d: 'A' },
  { id: 'notes', name: 'Spot the Bad Note', desc: 'Which session note is objective?', d: 'E' },
  { id: 'swipe', name: 'Ethics: Do or Don\'t?', desc: 'Should the RBT do it?', d: 'F' },
  { id: 'escape', name: 'Ethics Escape Room', desc: 'Open 5 locked doors with ethics answers.', d: 'F' },
  { id: 'match', name: 'Match Pairs', desc: 'Memory game: term and meaning.', d: 'C' },
];

export function GamesHub() {
  const { s } = useStore();
  return (
    <div>
      <BackButton onClick={() => go('practice')} label="Practice" />
      <PageTitle title="Games" sub="Learn while you play. Every game gives XP." />
      <div className="grid gap-3 sm:grid-cols-2">
        {GAMES.map((g) => (
          <Card key={g.id} as="button" onClick={() => go(`game/${g.id}`)} className="tap flex items-center gap-3 !p-4 text-left">
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[17px] font-semibold text-slate-900 dark:text-white">{g.name}</span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">{g.desc}</span>
              {s.games[g.id] != null && <span className="mt-1 block text-xs font-semibold text-brand-600 dark:text-violet-300">Best: {s.games[g.id]}</span>}
            </span>
            <ChevronRight className="shrink-0 text-slate-400" />
          </Card>
        ))}
      </div>
    </div>
  );
}

// Shared end screen + XP.
function useFinish(id) {
  const { update } = useStore();
  return (score, max) => {
    update((n) => {
      n.games = { ...n.games, [id]: Math.max(n.games[id] || 0, score) };
      addXP(n, XP.game + Math.round((score / Math.max(1, max)) * 15));
      logInc(n, 'games');
      markStudy(n);
    });
    sfx('win');
    if (score / Math.max(1, max) >= 0.7) celebrate(true);
  };
}

function GameOver({ id, score, max, label = 'points', onAgain }) {
  const { s } = useStore();
  const good = score / Math.max(1, max) >= 0.7;
  return (
    <Card className="flex animate-pop flex-col items-center text-center">
      <Mia size={100} mood={good ? 'proud' : 'cheer'} />
      <p className="mt-3 font-display text-4xl font-bold text-slate-900 dark:text-white">
        {score} <span className="text-lg text-slate-400">{label}</span>
      </p>
      <p className="mt-1 text-slate-500 dark:text-slate-400">{good ? say('proud') : say('cheer')}</p>
      <p className="mt-1 text-sm font-semibold text-brand-600 dark:text-violet-300">Best: {Math.max(score, s.games[id] || 0)}</p>
      <div className="mt-5 flex w-full gap-2">
        <Button className="flex-1" onClick={onAgain}>
          Play again
        </Button>
        <Button variant="soft" className="flex-1" onClick={() => go('games')}>
          All games
        </Button>
      </div>
    </Card>
  );
}

function Shell({ title, children, right }) {
  return (
    <div>
      <BackButton onClick={() => go('games')} label="Games" />
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {right}
      </div>
      {children}
    </div>
  );
}

function useTimer(seconds, running, onEnd) {
  const [left, setLeft] = useState(seconds);
  const end = useRef(onEnd);
  end.current = onEnd;
  useEffect(() => {
    if (!running) return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const l = Math.max(0, seconds - Math.floor((Date.now() - t0) / 1000));
      setLeft(l);
      if (l === 0) {
        clearInterval(id);
        end.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, seconds]);
  return left;
}

function Timer({ left, total }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <Bar value={(left / total) * 100} className="!h-3" color={left <= 10 ? '#E11D48' : undefined} />
      <span className={cx('w-10 text-right font-display font-bold tabular-nums', left <= 10 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200')}>{left}s</span>
    </div>
  );
}

// ───────── Function Frenzy ─────────
function Frenzy() {
  const [round, setRound] = useState(0);
  const [deck, setDeck] = useState(() => shuffle(FRENZY));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState(null);
  const [over, setOver] = useState(false);
  const finish = useFinish('frenzy');
  const left = useTimer(60, !over, () => {
    setOver(true);
    finish(scoreRef.current, 15);
  });
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const restart = () => {
    setDeck(shuffle(FRENZY));
    setI(0);
    setScore(0);
    setOver(false);
    setRound((r) => r + 1);
  };

  if (over) return <Shell title="Function Frenzy"><GameOver id="frenzy" score={score} max={15} label="correct" onAgain={restart} /></Shell>;

  const [text, answer] = deck[i % deck.length];
  const pickF = (f) => {
    const ok = f === answer;
    feedback(ok);
    setFlash(ok ? 'ok' : answer);
    if (ok) setScore((x) => x + 1);
    setTimeout(() => {
      setFlash(null);
      setI((x) => x + 1);
    }, ok ? 250 : 900);
  };

  return (
    <Shell title="Function Frenzy" right={<span className="font-display text-xl font-bold text-brand-600">{score}</span>}>
      <Timer left={left} total={60} key={round} />
      <Card key={i} className={cx('mb-4 flex min-h-[150px] animate-pop items-center justify-center text-center', flash === 'ok' && 'ring-4 ring-emerald-400', flash && flash !== 'ok' && 'animate-shake ring-4 ring-rose-400')}>
        <p className="font-display text-xl font-semibold leading-snug text-slate-900 dark:text-white">{text}</p>
      </Card>
      {flash && flash !== 'ok' && <p className="mb-3 text-center font-semibold text-rose-500">It was {flash}!</p>}
      <div className="grid grid-cols-2 gap-3">
        {FUNCTIONS.map((f, k) => (
          <button key={f} onClick={() => !flash && pickF(f)} className={cx('h-20 rounded-2xl text-lg font-bold text-white shadow-lg transition active:scale-95', ['bg-violet-600', 'bg-orange-500', 'bg-pink-600', 'bg-sky-500'][k])}>
            {f}
          </button>
        ))}
      </div>
    </Shell>
  );
}

// ───────── Reinforce or Punish ─────────
function RPGame() {
  const [deck, setDeck] = useState(() => shuffle(RP).slice(0, 12));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [flash, setFlash] = useState(null);
  const finish = useFinish('rp');
  const over = i >= deck.length;
  useEffect(() => {
    if (over) finish(score, 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  if (over)
    return (
      <Shell title="Reinforce or Punish?">
        <GameOver
          id="rp"
          score={score}
          max={40}
          onAgain={() => {
            setDeck(shuffle(RP).slice(0, 12));
            setI(0);
            setScore(0);
            setCombo(1);
          }}
        />
      </Shell>
    );

  const [text, answer] = deck[i];
  const pickA = (a) => {
    const ok = a === answer;
    feedback(ok);
    if (ok) {
      setScore((x) => x + combo);
      if (combo >= 2) sfx('combo');
      setCombo((c) => Math.min(5, c + 1));
    } else setCombo(1);
    setFlash(ok ? 'ok' : 'no');
    setTimeout(() => {
      setFlash(null);
      setI((x) => x + 1);
    }, ok ? 300 : 900);
  };

  return (
    <Shell title="Reinforce or Punish?" right={<span className="font-display text-xl font-bold text-brand-600">{score}</span>}>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-slate-400">
          {i + 1}/{deck.length}
        </span>
        <span className={cx('rounded-full px-3 py-1 font-bold', combo > 1 ? 'bg-orange-500 text-white' : 'bg-black/5 text-slate-400 dark:bg-white/10')}>Combo x{combo}</span>
      </div>
      <Card key={i} className={cx('mb-4 flex min-h-[170px] animate-pop items-center justify-center text-center', flash === 'ok' && 'ring-4 ring-emerald-400', flash === 'no' && 'animate-shake ring-4 ring-rose-400')}>
        <div>
          <p className="font-display text-xl font-semibold leading-snug text-slate-900 dark:text-white">{text}</p>
          {flash === 'no' && <p className="mt-2 font-semibold text-rose-500">It was {answer}!</p>}
        </div>
      </Card>
      <p className="mb-3 text-center text-sm text-slate-500">Behavior goes UP = reinforcement. DOWN = punishment.</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => !flash && pickA('Reinforcement')} className="h-20 rounded-2xl bg-emerald-500 text-lg font-bold text-white shadow-lg active:scale-95">
          Reinforcement
        </button>
        <button onClick={() => !flash && pickA('Punishment')} className="h-20 rounded-2xl bg-rose-500 text-lg font-bold text-white shadow-lg active:scale-95">
          Punishment
        </button>
      </div>
    </Shell>
  );
}

// ───────── Prompt Ladder (ordering) ─────────
function Ladder() {
  const levels = useMemo(
    () => [
      { title: 'Order the prompts: LEAST help → MOST help', items: PROMPTS_LEAST_TO_MOST },
      { title: 'Order the prompts: MOST help → LEAST help', items: [...PROMPTS_LEAST_TO_MOST].reverse() },
      ...shuffle(TASKS).map((t) => ({ title: `Task analysis: ${t.name}`, items: t.steps })),
    ],
    []
  );
  const [lv, setLv] = useState(0);
  const [picked, setPicked] = useState([]);
  const [pool, setPool] = useState(() => shuffle(levels[0].items));
  const [wrong, setWrong] = useState(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const finish = useFinish('ladder');
  const left = useTimer(90, !over, () => {
    setOver(true);
    finish(scoreRef.current, levels.length);
  });
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const restart = () => (window.location.hash = `/game/ladder?${Date.now()}`);

  if (over) return <Shell title="Prompt Ladder"><GameOver id="ladder" score={score} max={levels.length} label="ladders" onAgain={restart} /></Shell>;

  const level = levels[lv];
  const tap = (item) => {
    const expected = level.items[picked.length];
    if (item !== expected) {
      feedback(false);
      setWrong(item);
      setTimeout(() => setWrong(null), 500);
      return;
    }
    sfx('tap');
    const np = [...picked, item];
    setPicked(np);
    setPool((p) => p.filter((x) => x !== item));
    if (np.length === level.items.length) {
      feedback(true);
      const ns = score + 1;
      setScore(ns);
      setTimeout(() => {
        if (lv + 1 >= levels.length) {
          setOver(true);
          finish(ns, levels.length);
        } else {
          setLv(lv + 1);
          setPicked([]);
          setPool(shuffle(levels[lv + 1].items));
        }
      }, 700);
    }
  };

  return (
    <Shell title="Prompt Ladder" right={<span className="font-display text-xl font-bold text-brand-600">{score}</span>}>
      <Timer left={left} total={90} />
      <p className="mb-3 font-semibold text-slate-700 dark:text-slate-200">{level.title}</p>
      <Card className="mb-4 min-h-[120px] space-y-2 !p-3">
        {picked.map((x, k) => (
          <div key={x} className="animate-pop rounded-xl bg-emerald-500/15 px-4 py-2.5 font-semibold text-emerald-700 dark:text-emerald-300">
            {k + 1}. {x}
          </div>
        ))}
        {!picked.length && <p className="p-3 text-center text-sm text-slate-400">Tap the steps in the right order</p>}
      </Card>
      <div className="flex flex-wrap gap-2">
        {pool.map((x) => (
          <button key={x} onClick={() => tap(x)} className={cx('min-h-[48px] rounded-xl bg-brand-600 px-4 font-semibold text-white shadow active:scale-95', wrong === x && 'animate-shake bg-rose-500')}>
            {x}
          </button>
        ))}
      </div>
    </Shell>
  );
}

// ───────── Measure It! (animated clip) ─────────
function Clip({ kind }) {
  // A tiny animated timeline showing what happens.
  return (
    <svg viewBox="0 0 320 110" className="h-32 w-full">
      <line x1="10" y1="80" x2="310" y2="80" stroke="#CBD5E1" strokeWidth="3" />
      {kind === 'blips' &&
        [40, 95, 130, 200, 260].map((x, i) => (
          <circle key={x} cx={x} cy="60" r="9" fill="rgb(var(--acc))" style={{ animation: `pop .4s ${i * 0.45}s both` }} />
        ))}
      {kind === 'bars' &&
        [
          [30, 90],
          [150, 280],
        ].map(([a, b], i) => (
          <rect key={a} x={a} y="50" width={b - a} height="20" rx="8" fill="rgb(var(--acc))" style={{ transformOrigin: `${a}px 60px`, animation: `grow-x 1s ${i * 1}s both` }} />
        ))}
      {kind === 'delay' && (
        <g>
          <rect x="20" y="30" width="80" height="26" rx="8" fill="rgb(var(--b600))" />
          <text x="60" y="48" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700">
            "Clean up!"
          </text>
          <path d="M100 66 H220" stroke="#64748B" strokeDasharray="5 4" strokeWidth="2" className="draw" style={{ '--len': 120 }} />
          <text x="160" y="100" textAnchor="middle" fontSize="12" fill="#64748B">
            waiting...
          </text>
          <circle cx="235" cy="66" r="10" fill="rgb(var(--acc))" style={{ animation: 'pop .4s 1.2s both' }} />
          <text x="265" y="48" fontSize="11" fill="#64748B">
            starts
          </text>
        </g>
      )}
      {kind === 'gaps' && (
        <g>
          {[40, 130, 220, 290].map((x, i) => (
            <circle key={x} cx={x} cy="60" r="9" fill="rgb(var(--acc))" style={{ animation: `pop .4s ${i * 0.4}s both` }} />
          ))}
          {[
            [50, 120],
            [140, 210],
          ].map(([a, b], i) => (
            <g key={a} style={{ animation: `pop .4s ${1.6 + i * 0.3}s both` }}>
              <path d={`M${a} 36 H${b}`} stroke="#64748B" strokeWidth="2" />
              <text x={(a + b) / 2} y="30" textAnchor="middle" fontSize="11" fill="#64748B">
                gap
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

function Measure() {
  const [deck, setDeck] = useState(() => shuffle(MEASURE).slice(0, 6));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [pickedA, setPickedA] = useState(null);
  const finish = useFinish('measure');
  const over = i >= deck.length;
  useEffect(() => {
    if (over) finish(score, deck.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);
  if (over)
    return (
      <Shell title="Measure It!">
        <GameOver
          id="measure"
          score={score}
          max={deck.length}
          label="correct"
          onAgain={() => {
            setDeck(shuffle(MEASURE).slice(0, 6));
            setI(0);
            setScore(0);
          }}
        />
      </Shell>
    );
  const m = deck[i];
  const choose = (a) => {
    if (pickedA) return;
    const ok = a === m.answer;
    feedback(ok);
    setPickedA(a);
    if (ok) setScore((x) => x + 1);
    setTimeout(() => {
      setPickedA(null);
      setI((x) => x + 1);
    }, ok ? 700 : 1400);
  };
  return (
    <Shell title="Measure It!" right={<span className="text-sm text-slate-400">{i + 1}/{deck.length}</span>}>
      <Card key={i} className="mb-4">
        <div className="rounded-2xl bg-white p-2 dark:bg-white/95">
          <Clip kind={m.kind} />
        </div>
        <p className="mt-3 font-display text-lg font-semibold leading-snug text-slate-900 dark:text-white">{m.text}</p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {MEASURES.map((a) => (
          <button key={a} onClick={() => choose(a)} className={cx('h-16 rounded-2xl text-lg font-bold transition active:scale-95', pickedA ? (a === m.answer ? 'bg-emerald-500 text-white' : a === pickedA ? 'bg-rose-500 text-white' : 'bg-black/5 text-slate-400 dark:bg-white/5') : 'bg-brand-600 text-white shadow-lg')}>
            {a}
          </button>
        ))}
      </div>
    </Shell>
  );
}

// ───────── Graph Reader ─────────
function makeGraph() {
  const type = shuffle(['up', 'down', 'flat', 'variable', 'high', 'low'])[0];
  const n = 8;
  const pts = Array.from({ length: n }, (_, i) => {
    if (type === 'up') return 2 + i * 1.1 + Math.random();
    if (type === 'down') return 11 - i * 1.1 + Math.random();
    if (type === 'flat') return 6 + Math.random() * 0.8;
    if (type === 'variable') return i % 2 ? 10 + Math.random() * 2 : 1 + Math.random() * 2;
    if (type === 'high') return 10.5 + Math.random();
    return 1.5 + Math.random();
  });
  const q = {
    up: ['What is the TREND of this data?', ['Increasing', 'Decreasing', 'Flat', 'Highly variable'], 0],
    down: ['What is the TREND of this data?', ['Increasing', 'Decreasing', 'Flat', 'Highly variable'], 1],
    flat: ['How would you describe this data?', ['Stable, no clear trend', 'Increasing trend', 'Decreasing trend', 'Highly variable'], 0],
    variable: ['How would you describe this data?', ['High variability', 'Stable', 'Increasing trend', 'Low level'], 0],
    high: ['What is the LEVEL of this data?', ['High level', 'Low level', 'Highly variable', 'Decreasing'], 0],
    low: ['What is the LEVEL of this data?', ['Low level', 'High level', 'Highly variable', 'Increasing'], 0],
  }[type];
  return { pts, q: q[0], o: q[1], a: q[2] };
}

function GraphReader() {
  const [round, setRound] = useState(0);
  const [g, setG] = useState(makeGraph);
  const [order, setOrder] = useState(() => shuffle([0, 1, 2, 3]));
  const [pickedA, setPickedA] = useState(null);
  const [score, setScore] = useState(0);
  const finish = useFinish('graph');
  const TOTAL = 6;
  if (round >= TOTAL)
    return (
      <Shell title="Graph Reader">
        <GameOver
          id="graph"
          score={score}
          max={TOTAL}
          label="correct"
          onAgain={() => {
            setRound(0);
            setScore(0);
            setG(makeGraph());
          }}
        />
      </Shell>
    );
  const px = (i) => 40 + i * 38;
  const py = (v) => 170 - v * 12;
  const choose = (oi) => {
    if (pickedA !== null) return;
    const ok = oi === g.a;
    feedback(ok);
    setPickedA(oi);
    const ns = score + (ok ? 1 : 0);
    setScore(ns);
    setTimeout(() => {
      setPickedA(null);
      if (round + 1 >= TOTAL) finish(ns, TOTAL);
      setRound((r) => r + 1);
      setG(makeGraph());
      setOrder(shuffle([0, 1, 2, 3]));
    }, ok ? 700 : 1400);
  };
  const path = g.pts.map((v, i) => `${i ? 'L' : 'M'}${px(i)} ${py(v)}`).join(' ');
  return (
    <Shell title="Graph Reader" right={<span className="text-sm text-slate-400">{round + 1}/{TOTAL}</span>}>
      <Card key={round} className="mb-4">
        <div className="rounded-2xl bg-white p-2">
          <svg viewBox="0 0 340 200" className="w-full">
            <path d="M30 10 V172 H330" stroke="#94A3B8" strokeWidth="2" fill="none" />
            <text x="180" y="194" textAnchor="middle" fontSize="11" fill="#64748B">
              Sessions
            </text>
            <path d={path} stroke="rgb(var(--b600))" strokeWidth="3" fill="none" className="draw" style={{ '--len': 700 }} />
            {g.pts.map((v, i) => (
              <circle key={i} cx={px(i)} cy={py(v)} r="5" fill="rgb(var(--b600))" style={{ animation: `pop .3s ${i * 0.1}s both` }} />
            ))}
          </svg>
        </div>
        <p className="mt-3 font-display text-lg font-semibold text-slate-900 dark:text-white">{g.q}</p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {order.map((oi) => (
          <button key={oi} onClick={() => choose(oi)} className={cx('min-h-[56px] rounded-2xl px-3 font-bold transition active:scale-95', pickedA !== null ? (oi === g.a ? 'bg-emerald-500 text-white' : oi === pickedA ? 'bg-rose-500 text-white' : 'bg-black/5 text-slate-400 dark:bg-white/5') : 'bg-brand-600 text-white shadow-lg')}>
            {g.o[oi]}
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">Trend = direction · Level = height · Variability = bounce</p>
    </Shell>
  );
}

// ───────── Spot the Bad Note ─────────
function NotesGame() {
  const [deck, setDeck] = useState(() => shuffle(NOTES).slice(0, 6).map(([good, bad]) => ({ good, bad, flip: Math.random() < 0.5 })));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [pickedA, setPickedA] = useState(null);
  const finish = useFinish('notes');
  if (i >= deck.length)
    return (
      <Shell title="Spot the Bad Note">
        <GameOver
          id="notes"
          score={score}
          max={deck.length}
          label="correct"
          onAgain={() => {
            setDeck(shuffle(NOTES).slice(0, 6).map(([good, bad]) => ({ good, bad, flip: Math.random() < 0.5 })));
            setI(0);
            setScore(0);
          }}
        />
      </Shell>
    );
  const c = deck[i];
  const opts = c.flip ? [c.bad, c.good] : [c.good, c.bad];
  const choose = (t) => {
    if (pickedA) return;
    const ok = t === c.good;
    feedback(ok);
    setPickedA(t);
    const ns = score + (ok ? 1 : 0);
    setScore(ns);
    setTimeout(() => {
      setPickedA(null);
      if (i + 1 >= deck.length) finish(ns, deck.length);
      setI(i + 1);
    }, ok ? 800 : 1600);
  };
  return (
    <Shell title="Spot the Bad Note" right={<span className="text-sm text-slate-400">{i + 1}/{deck.length}</span>}>
      <MiaSays className="mb-4">Tap the OBJECTIVE note: only facts you can see or count.</MiaSays>
      <div className="space-y-3">
        {opts.map((t) => (
          <button key={t} onClick={() => choose(t)} className={cx('w-full rounded-2xl border-2 p-4 text-left text-[16px] leading-snug transition active:scale-[.99]', pickedA ? (t === c.good ? 'border-emerald-500 bg-emerald-500/10' : t === pickedA ? 'animate-shake border-rose-500 bg-rose-500/10' : 'border-transparent opacity-60') : 'glass border-transparent')}>
            <span className="text-slate-800 dark:text-slate-100">"{t}"</span>
            {pickedA && <span className={cx('mt-1 block text-sm font-semibold', t === c.good ? 'text-emerald-600' : 'text-rose-500')}>{t === c.good ? 'Objective: facts only' : 'Subjective: feelings or opinions'}</span>}
          </button>
        ))}
      </div>
    </Shell>
  );
}

// ───────── Ethics swipe ─────────
function Swipe() {
  const [deck, setDeck] = useState(() => shuffle(ETHICS_SWIPE).slice(0, 10));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [res, setRes] = useState(null);
  const [dx, setDx] = useState(0);
  const start = useRef(null);
  const finish = useFinish('swipe');
  if (i >= deck.length)
    return (
      <Shell title="Ethics: Do or Don't?">
        <GameOver
          id="swipe"
          score={score}
          max={deck.length}
          label="correct"
          onAgain={() => {
            setDeck(shuffle(ETHICS_SWIPE).slice(0, 10));
            setI(0);
            setScore(0);
          }}
        />
      </Shell>
    );
  const [text, ok, why] = deck[i];
  const answer = (doIt) => {
    if (res) return;
    const right = doIt === ok;
    feedback(right);
    setRes({ right, why });
    const ns = score + (right ? 1 : 0);
    setScore(ns);
    setDx(doIt ? 400 : -400);
    setTimeout(() => {
      setRes(null);
      setDx(0);
      if (i + 1 >= deck.length) finish(ns, deck.length);
      setI(i + 1);
    }, right ? 900 : 2000);
  };
  return (
    <Shell title="Ethics: Do or Don't?" right={<span className="text-sm text-slate-400">{i + 1}/{deck.length}</span>}>
      <p className="mb-3 text-center text-sm text-slate-500">Swipe right = Do it · Swipe left = Don't</p>
      <div className="relative h-[260px]">
        <Card
          key={i}
          className="absolute inset-0 flex touch-pan-y select-none items-center justify-center text-center"
          style={{ transform: `translateX(${dx}px) rotate(${dx / 25}deg)`, transition: start.current ? 'none' : 'transform .35s ease', opacity: Math.abs(dx) > 300 ? 0 : 1 }}
          onPointerDown={(e) => (start.current = e.clientX)}
          onPointerMove={(e) => start.current !== null && !res && setDx(e.clientX - start.current)}
          onPointerUp={() => {
            const d = dx;
            start.current = null;
            if (d > 90) answer(true);
            else if (d < -90) answer(false);
            else setDx(0);
          }}
          onPointerCancel={() => {
            start.current = null;
            setDx(0);
          }}
        >
          <div>
            <p className="font-display text-xl font-semibold leading-snug text-slate-900 dark:text-white">{text}</p>
            {res && <p className={cx('mt-3 font-semibold', res.right ? 'text-emerald-600' : 'text-rose-500')}>{res.why}</p>}
          </div>
        </Card>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={() => answer(false)} className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-rose-500 text-lg font-bold text-white shadow-lg active:scale-95">
          <ThumbsDown size={20} /> Don't
        </button>
        <button onClick={() => answer(true)} className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-lg font-bold text-white shadow-lg active:scale-95">
          <ThumbsUp size={20} /> Do it
        </button>
      </div>
    </Shell>
  );
}

// ───────── Ethics Escape Room ─────────
function Escape() {
  const pool = useMemo(() => shuffle(questionsByDomain('F')).map(withOrder), []);
  const [door, setDoor] = useState(0);
  const [qi, setQi] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [tries, setTries] = useState(0);
  const finish = useFinish('escape');
  const DOORS = 5;
  if (door >= DOORS)
    return (
      <Shell title="Ethics Escape Room">
        <GameOver id="escape" score={Math.max(0, 10 - tries)} max={10} label="stars" onAgain={() => (window.location.hash = `/game/escape?${Date.now()}`)} />
      </Shell>
    );
  const q = pool[qi % pool.length];
  const choose = (oi) => {
    if (chosen !== null) return;
    setChosen(oi);
    const ok = oi === q.a;
    feedback(ok);
    if (!ok) setTries((t) => t + 1);
  };
  const next = () => {
    const ok = chosen === q.a;
    setChosen(null);
    setQi((x) => x + 1);
    if (ok) {
      sfx('combo');
      if (door + 1 >= DOORS) finish(Math.max(0, 10 - tries), 10);
      setDoor((d) => d + 1);
    }
  };
  return (
    <Shell title="Ethics Escape Room">
      <div className="mb-4 flex justify-center gap-2">
        {Array.from({ length: DOORS }, (_, k) => (
          <span key={k} className={cx('grid h-14 w-11 place-items-center rounded-t-2xl transition', k < door ? 'bg-emerald-500 text-white' : k === door ? 'bg-brand-600 text-white shadow-lg' : 'bg-black/10 text-slate-400 dark:bg-white/10')}>
            {k < door ? <Unlock size={18} /> : <Lock size={18} />}
          </span>
        ))}
      </div>
      <p className="mb-3 text-center text-sm font-semibold text-slate-500">Door {door + 1}: answer right to open it</p>
      <Card className="mb-4">
        <p className="font-display text-lg font-semibold leading-snug text-slate-900 dark:text-white">{q.q}</p>
      </Card>
      <OptionList q={q} chosen={chosen} reveal={chosen !== null} onChoose={choose} />
      {chosen !== null && (
        <Button className="mt-4 w-full" onClick={next}>
          {chosen === q.a ? 'Open the door!' : 'Try another question'}
        </Button>
      )}
    </Shell>
  );
}

// ───────── Match Pairs ─────────
function Match() {
  const make = () => {
    const picks = shuffle(FLASHCARDS.filter((c) => c.back.length < 75)).slice(0, 6);
    return shuffle(picks.flatMap((c) => [{ key: `${c.id}t`, pair: c.id, text: c.front, term: true }, { key: `${c.id}d`, pair: c.id, text: c.back }]));
  };
  const [cards, setCards] = useState(make);
  const [open, setOpen] = useState([]);
  const [found, setFound] = useState([]);
  const [moves, setMoves] = useState(0);
  const finish = useFinish('match');
  const done = found.length === 6;
  useEffect(() => {
    if (done) finish(Math.max(1, 20 - Math.max(0, moves - 6)), 20);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
  if (done)
    return (
      <Shell title="Match Pairs">
        <GameOver
          id="match"
          score={Math.max(1, 20 - Math.max(0, moves - 6))}
          max={20}
          onAgain={() => {
            setCards(make());
            setOpen([]);
            setFound([]);
            setMoves(0);
          }}
        />
      </Shell>
    );
  const tap = (c) => {
    if (open.length === 2 || open.includes(c.key) || found.includes(c.pair)) return;
    sfx('tap');
    const o = [...open, c.key];
    setOpen(o);
    if (o.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = o.map((k) => cards.find((x) => x.key === k));
      if (a.pair === b.pair) {
        feedback(true);
        setTimeout(() => {
          setFound((f) => [...f, a.pair]);
          setOpen([]);
        }, 400);
      } else setTimeout(() => setOpen([]), 1100);
    }
  };
  return (
    <Shell title="Match Pairs" right={<span className="text-sm text-slate-400">{moves} moves</span>}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cards.map((c) => {
          const vis = open.includes(c.key) || found.includes(c.pair);
          return (
            <button key={c.key} onClick={() => tap(c)} className={cx('flex min-h-[96px] items-center justify-center rounded-2xl p-2 text-center text-xs font-semibold leading-tight transition active:scale-95', found.includes(c.pair) ? 'bg-emerald-500/15 text-emerald-700 opacity-60 dark:text-emerald-300' : vis ? (c.term ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 shadow dark:bg-white/15 dark:text-slate-100') : 'bg-gradient-to-br from-brand-600 to-accent text-white/0 shadow')}>
              {vis ? c.text : '?'}
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

export function Game({ id }) {
  const G = { frenzy: Frenzy, rp: RPGame, ladder: Ladder, measure: Measure, graph: GraphReader, notes: NotesGame, swipe: Swipe, escape: Escape, match: Match }[id];
  return G ? <G /> : <p>Game not found.</p>;
}
