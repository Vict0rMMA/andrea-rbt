import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { useStore, addXP, markStudy } from '../store.jsx';
import { go, speak, stopSpeaking, celebrate } from '../lib.js';
import { XP, sfx } from '../fun.js';
import { Card, Button, BackButton, Mia, cx } from '../components/ui.jsx';

// Shared SVG helpers -------------------------------------------------------
const show = (on) => ({ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(8px)', transition: 'opacity .6s ease, transform .6s ease' });
const BRAND = 'rgb(var(--b600))';
const ACC = 'rgb(var(--acc))';

function Box({ x, y, w, h, fill, title, text, on, titleColor = '#fff', textColor = '#fff' }) {
  return (
    <g style={show(on)}>
      <rect x={x} y={y} width={w} height={h} rx="14" fill={fill} />
      <text x={x + w / 2} y={y + 26} textAnchor="middle" fontSize="15" fontWeight="700" fill={titleColor}>
        {title}
      </text>
      {text &&
        text.split('\n').map((t, i) => (
          <text key={i} x={x + w / 2} y={y + 48 + i * 16} textAnchor="middle" fontSize="12" fill={textColor}>
            {t}
          </text>
        ))}
    </g>
  );
}

// 1. ABC model -------------------------------------------------------------
function ABC({ step }) {
  return (
    <svg viewBox="0 0 360 240" className="h-full w-full">
      <Box x={8} y={40} w={104} h={100} fill="#6366F1" title="A" text={'Antecedent\n"Math time!"'} on={step >= 1} />
      <Box x={128} y={40} w={104} h={100} fill={BRAND} title="B" text={'Behavior\nJake throws\nhis pencil'} on={step >= 2} />
      <Box x={248} y={40} w={104} h={100} fill="#DB2777" title="C" text={'Consequence\nMath is\nremoved'} on={step >= 3} />
      <g style={show(step >= 2)}>
        <path d="M114 90h12" stroke="#94A3B8" strokeWidth="3" markerEnd="url(#ah)" />
      </g>
      <g style={show(step >= 3)}>
        <path d="M234 90h12" stroke="#94A3B8" strokeWidth="3" markerEnd="url(#ah)" />
      </g>
      <g style={show(step >= 4)}>
        <path d="M300 146 C300 215 180 215 180 150" fill="none" stroke={ACC} strokeWidth="3" strokeDasharray="6 5" markerEnd="url(#ah2)" />
        <text x="240" y="225" textAnchor="middle" fontSize="13" fontWeight="700" fill={ACC}>
          Next time: MORE throwing (escape!)
        </text>
      </g>
      <defs>
        <marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0L8 4L0 8z" fill="#94A3B8" />
        </marker>
        <marker id="ah2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0L8 4L0 8z" fill={ACC} />
        </marker>
      </defs>
    </svg>
  );
}

// 2. Four functions --------------------------------------------------------
function Functions({ step }) {
  const items = [
    ['S', 'Sensory', 'Feels good by itself\n(hand flapping alone)', '#0EA5E9'],
    ['E', 'Escape', 'Gets AWAY from something\n(work is removed)', '#F97316'],
    ['A', 'Attention', 'Gets people to react\n(mom turns and talks)', BRAND],
    ['T', 'Tangible', 'Gets an item\n(candy, iPad)', '#DB2777'],
  ];
  return (
    <svg viewBox="0 0 360 240" className="h-full w-full">
      {items.map(([l, t, txt, c], i) => (
        <g key={l} style={show(step >= i + 1)}>
          <rect x={8 + (i % 2) * 176} y={8 + Math.floor(i / 2) * 116} width="168" height="108" rx="16" fill={c} />
          <text x={92 + (i % 2) * 176} y={46 + Math.floor(i / 2) * 116} textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff">
            {l}
          </text>
          <text x={92 + (i % 2) * 176} y={68 + Math.floor(i / 2) * 116} textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">
            {t}
          </text>
          {txt.split('\n').map((x, k) => (
            <text key={k} x={92 + (i % 2) * 176} y={86 + k * 14 + Math.floor(i / 2) * 116} textAnchor="middle" fontSize="11" fill="#fff">
              {x}
            </text>
          ))}
        </g>
      ))}
      <g style={show(step === 0)}>
        <text x="180" y="125" textAnchor="middle" fontSize="40" fontWeight="800" fill={BRAND}>
          S · E · A · T
        </text>
      </g>
    </svg>
  );
}

// 3. Reinforcement vs punishment 2x2 ---------------------------------------
function Grid({ step }) {
  const cells = [
    [0, 0, 'Positive\nReinforcement', 'Add a sticker\nbehavior goes UP', '#16A34A'],
    [1, 0, 'Negative\nReinforcement', 'Remove hard work\nbehavior goes UP', '#0EA5E9'],
    [0, 1, 'Positive\nPunishment', 'Add extra chores\nbehavior goes DOWN', '#F97316'],
    [1, 1, 'Negative\nPunishment', 'Remove a token\nbehavior goes DOWN', '#E11D48'],
  ];
  return (
    <svg viewBox="0 0 360 240" className="h-full w-full">
      <g style={show(step >= 0)}>
        <text x="148" y="18" textAnchor="middle" fontSize="14" fontWeight="800" fill={BRAND}>
          ADD (+)
        </text>
        <text x="288" y="18" textAnchor="middle" fontSize="14" fontWeight="800" fill={BRAND}>
          REMOVE (−)
        </text>
        <text x="34" y="80" textAnchor="middle" fontSize="12" fontWeight="800" fill="#16A34A">
          UP ↑
        </text>
        <text x="34" y="96" textAnchor="middle" fontSize="10" fill="#64748B">
          reinforce
        </text>
        <text x="34" y="188" textAnchor="middle" fontSize="12" fontWeight="800" fill="#E11D48">
          DOWN ↓
        </text>
        <text x="34" y="204" textAnchor="middle" fontSize="10" fill="#64748B">
          punish
        </text>
      </g>
      {cells.map(([c, r, t, ex, col], i) => (
        <g key={i} style={show(step >= i + 1)}>
          <rect x={78 + c * 140} y={28 + r * 106} width="134" height="100" rx="14" fill={col} />
          {t.split('\n').map((x, k) => (
            <text key={k} x={145 + c * 140} y={54 + k * 16 + r * 106} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">
              {x}
            </text>
          ))}
          {ex.split('\n').map((x, k) => (
            <text key={k} x={145 + c * 140} y={96 + k * 14 + r * 106} textAnchor="middle" fontSize="11" fill="#fff">
              {x}
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
}

// 4. Prompt hierarchy --------------------------------------------------------
function Prompts({ step }) {
  const rungs = ['Full physical', 'Partial physical', 'Model', 'Verbal', 'Gestural'];
  const up = step === 2;
  const down = step === 3;
  return (
    <svg viewBox="0 0 360 240" className="h-full w-full">
      {rungs.map((r, i) => {
        const y = 14 + i * 44;
        const hl = (up && step === 2) || (down && step === 3);
        return (
          <g key={r} style={show(step >= 1)}>
            <rect x="90" y={y} width="180" height="36" rx="10" fill={BRAND} opacity={0.35 + (4 - i) * 0.16} />
            <text x="180" y={y + 23} textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">
              {r}
            </text>
            {hl && null}
          </g>
        );
      })}
      <text x="300" y="30" fontSize="11" fontWeight="700" fill="#64748B" style={show(step >= 1)}>
        MOST help
      </text>
      <text x="300" y="214" fontSize="11" fontWeight="700" fill="#64748B" style={show(step >= 1)}>
        LEAST help
      </text>
      <g style={show(up)}>
        <path d="M60 220 V26" stroke="#16A34A" strokeWidth="5" markerEnd="url(#pu)" />
        <text x="44" y="130" fontSize="11" fontWeight="800" fill="#16A34A" transform="rotate(-90 44 130)" textAnchor="middle">
          Least-to-most
        </text>
      </g>
      <g style={show(down)}>
        <path d="M60 22 V214" stroke="#E11D48" strokeWidth="5" markerEnd="url(#pd)" />
        <text x="44" y="120" fontSize="11" fontWeight="800" fill="#E11D48" transform="rotate(-90 44 120)" textAnchor="middle">
          Most-to-least
        </text>
      </g>
      <g style={show(step >= 4)}>
        <rect x="80" y="96" width="200" height="48" rx="14" fill="#fff" stroke={ACC} strokeWidth="3" />
        <text x="180" y="126" textAnchor="middle" fontSize="15" fontWeight="800" fill={ACC}>
          Goal: NO prompt at all!
        </text>
      </g>
      <defs>
        <marker id="pu" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0 0L8 4L0 8z" fill="#16A34A" />
        </marker>
        <marker id="pd" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0 0L8 4L0 8z" fill="#E11D48" />
        </marker>
      </defs>
    </svg>
  );
}

// 5. Chaining ---------------------------------------------------------------
function Chaining({ step }) {
  const steps = ['Wet', 'Soap', 'Rub', 'Rinse', 'Dry'];
  const kid = (i) => (step === 1 ? i === 0 : step === 2 ? i === 4 : step === 3 ? true : false);
  const label = ['Washing hands: 5 steps', 'Forward: the child does the FIRST step', 'Backward: the child does the LAST step', 'Total task: the child does ALL steps (with help)'][Math.min(step, 3)];
  return (
    <svg viewBox="0 0 360 240" className="h-full w-full">
      <text x="180" y="40" textAnchor="middle" fontSize="15" fontWeight="800" fill={BRAND}>
        {label}
      </text>
      {steps.map((s, i) => (
        <g key={s}>
          <rect x={10 + i * 70} y="80" width="62" height="80" rx="12" fill={kid(i) ? ACC : '#CBD5E1'} style={{ transition: 'fill .5s' }} />
          <text x={41 + i * 70} y="114" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">
            {i + 1}
          </text>
          <text x={41 + i * 70} y="134" textAnchor="middle" fontSize="12" fill="#fff">
            {s}
          </text>
        </g>
      ))}
      <g style={show(step >= 1)}>
        <rect x="70" y="190" width="14" height="14" rx="3" fill={ACC} />
        <text x="90" y="202" fontSize="12" fill="#64748B">
          Child does it
        </text>
        <rect x="190" y="190" width="14" height="14" rx="3" fill="#CBD5E1" />
        <text x="210" y="202" fontSize="12" fill="#64748B">
          Adult helps
        </text>
      </g>
    </svg>
  );
}

// 6. Interval recording ----------------------------------------------------
const SEG = [
  [3, 6],
  [10, 20],
  [24, 27],
  [36, 48],
  [55, 60],
];
function Intervals({ step }) {
  const x = (t) => 20 + t * 5.4;
  const overlap = (a, b) => SEG.some(([s, e]) => s < b && e > a);
  const full = (a, b) => SEG.some(([s, e]) => s <= a && e >= b);
  const at = (t) => SEG.some(([s, e]) => s <= t && e >= t);
  const ints = [0, 1, 2, 3, 4, 5].map((i) => [i * 10, i * 10 + 10]);
  const marks = step === 2 ? ints.map(([a, b]) => overlap(a, b)) : step === 3 ? ints.map(([a, b]) => full(a, b)) : step === 4 ? ints.map(([, b]) => at(b)) : null;
  const pct = marks ? Math.round((marks.filter(Boolean).length / 6) * 100) : 55;
  const name = ['Real behavior', 'Real behavior: 55% of the time', 'Partial interval', 'Whole interval', 'Momentary time sampling'][step] || 'Compare';
  const verdict = step === 2 ? 'OVERestimates' : step === 3 ? 'UNDERestimates' : step === 4 ? 'Can go either way' : '';
  return (
    <svg viewBox="0 0 360 240" className="h-full w-full">
      <text x="180" y="28" textAnchor="middle" fontSize="15" fontWeight="800" fill={BRAND}>
        {name}
      </text>
      {ints.map(([a, b], i) => (
        <g key={i}>
          <rect x={x(a)} y="70" width={54} height="70" fill={marks ? (marks[i] ? 'rgba(22,163,74,.22)' : 'rgba(225,29,72,.12)') : 'transparent'} stroke="#CBD5E1" style={{ transition: 'fill .5s' }} />
          <text x={x(a) + 27} y="160" textAnchor="middle" fontSize="11" fill="#64748B">
            {`${a}-${b}s`}
          </text>
          {marks && (
            <text x={x(a) + 27} y="62" textAnchor="middle" fontSize="15" fontWeight="800" fill={marks[i] ? '#16A34A' : '#E11D48'}>
              {marks[i] ? '✓' : '✗'}
            </text>
          )}
        </g>
      ))}
      {SEG.map(([s, e], i) => (
        <rect key={i} x={x(s)} y="95" width={(e - s) * 5.4} height="20" rx="6" fill={ACC} style={show(step >= 1)} />
      ))}
      {step === 4 && ints.map(([, b]) => <line key={b} x1={x(b) - 1} x2={x(b) - 1} y1="66" y2="146" stroke="#0F172A" strokeWidth="2" strokeDasharray="3 3" />)}
      <g style={show(step >= 1)}>
        <text x="180" y="196" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0F172A" className="dark:fill-white">
          Score: {pct}% {step >= 2 && step <= 4 ? `vs real 55%` : ''}
        </text>
        <text x="180" y="220" textAnchor="middle" fontSize="14" fontWeight="800" fill={step === 3 ? '#E11D48' : '#16A34A'}>
          {verdict}
        </text>
      </g>
    </svg>
  );
}

// 7. Extinction burst graph -------------------------------------------------
function Burst({ step }) {
  const data = [6, 7, 6, 7, 6, 12, 10, 7, 5, 3, 2, 1, 0, 4, 1, 0];
  const px = (i) => 34 + i * 20;
  const py = (v) => 200 - v * 13;
  const base = data.slice(0, 5);
  const ext = data.slice(5, step >= 4 ? 16 : step >= 3 ? 12 : step >= 2 ? 7 : 5);
  const path = (arr, off) => arr.map((v, i) => `${i ? 'L' : 'M'}${px(i + off)} ${py(v)}`).join(' ');
  return (
    <svg viewBox="0 0 360 240" className="h-full w-full">
      <path d="M30 20 V202 H350" stroke="#94A3B8" strokeWidth="2" fill="none" />
      <text x="190" y="232" textAnchor="middle" fontSize="11" fill="#64748B">
        Sessions
      </text>
      <text x="12" y="110" fontSize="11" fill="#64748B" transform="rotate(-90 12 110)" textAnchor="middle">
        Tantrums
      </text>
      <text x="80" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill="#64748B">
        Baseline
      </text>
      <path d={path(base, 0)} stroke={BRAND} strokeWidth="3" fill="none" />
      {base.map((v, i) => (
        <circle key={i} cx={px(i)} cy={py(v)} r="4" fill={BRAND} />
      ))}
      <g style={show(step >= 1)}>
        <line x1="144" x2="144" y1="24" y2="202" stroke="#64748B" strokeDasharray="5 4" strokeWidth="2" />
        <text x="250" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill="#64748B">
          Extinction
        </text>
      </g>
      {ext.length > 0 && <path d={path(ext, 5)} stroke={ACC} strokeWidth="3" fill="none" />}
      {ext.map((v, i) => (
        <circle key={i} cx={px(i + 5)} cy={py(v)} r="4" fill={ACC} />
      ))}
      <g style={show(step === 2)}>
        <text x={px(5) + 8} y={py(12) - 8} fontSize="13" fontWeight="800" fill="#E11D48">
          Burst! Worse first
        </text>
      </g>
      <g style={show(step === 4)}>
        <text x={px(13) - 30} y={py(4) - 10} fontSize="12" fontWeight="800" fill="#E11D48">
          Spontaneous recovery
        </text>
      </g>
    </svg>
  );
}

export const EXPLAINERS = [
  {
    id: 'abc',
    title: 'The ABC model',
    Comp: ABC,
    say: [
      'Every behavior has a story with three parts: A, B and C.',
      'A is the antecedent. It is what happens right before. The teacher says: math time!',
      'B is the behavior. What the person does. Jake throws his pencil.',
      'C is the consequence. What happens right after. The math work is taken away.',
      'The consequence changes the future. Because math went away, Jake will throw his pencil more next time. That is an escape function.',
    ],
  },
  {
    id: 'functions',
    title: 'The 4 functions',
    Comp: Functions,
    say: [
      'Why do people do things? There are four reasons. Remember the word SEAT.',
      'S is sensory, also called automatic. The behavior feels good by itself, like hand flapping alone in a room.',
      'E is escape. The behavior gets the person away from something, like hard work.',
      'A is attention. The behavior gets people to look, talk or react.',
      'T is tangible. The behavior gets an item, like candy or an iPad. On the exam, always ask: what happens right after?',
    ],
  },
  {
    id: 'grid',
    title: 'Reinforce or punish?',
    Comp: Grid,
    say: [
      'Two simple questions. Did we add or remove something? And did the behavior go up or down?',
      'Add something, and behavior goes up: positive reinforcement. Like a sticker for cleaning up.',
      'Remove something, and behavior goes up: negative reinforcement. Like taking away hard work when she asks for a break.',
      'Add something, and behavior goes down: positive punishment. Like extra chores after lying.',
      'Remove something, and behavior goes down: negative punishment. Like losing a token after hitting. Positive means add. Negative means remove. Not good or bad!',
    ],
  },
  {
    id: 'prompts',
    title: 'The prompt ladder',
    Comp: Prompts,
    say: [
      'Prompts are helpers. Some help a little, some help a lot.',
      'From most help to least help: full physical, partial physical, model, verbal, and gestural.',
      'Least to most: start with the smallest help, and go up only if she needs more.',
      'Most to least: start with a lot of help, then fade it. This is great for brand new skills, because there are fewer errors.',
      'Either way, the goal is the same: no prompt at all. Independence!',
    ],
  },
  {
    id: 'chaining',
    title: 'Chaining',
    Comp: Chaining,
    say: [
      'A task analysis breaks a skill into small steps. Like washing hands in five steps.',
      'Forward chaining: the child learns the first step first. The adult helps with the rest.',
      'Backward chaining: the adult does everything except the last step. The child finishes, and gets the reward right away.',
      'Total task chaining: the child does every step, every time, with help when needed.',
    ],
  },
  {
    id: 'intervals',
    title: 'Interval recording',
    Comp: Intervals,
    say: [
      'Here is one minute, cut into six intervals of ten seconds.',
      'The pink bars show when the behavior really happened. In real life, it happened about fifty-five percent of the time.',
      'Partial interval: score yes if the behavior happens at any moment in the interval. Every interval gets a yes. One hundred percent! It overestimates.',
      'Whole interval: score yes only if the behavior lasts the whole interval. Only one interval counts. Seventeen percent. It underestimates.',
      'Momentary time sampling: only look at the exact end of each interval. Here we get sixty-seven percent. It can go either way.',
    ],
  },
  {
    id: 'burst',
    title: 'Extinction burst',
    Comp: Burst,
    say: [
      'This graph shows tantrums during baseline. About six or seven per session.',
      'Now we start extinction. The tantrums no longer get the reinforcer.',
      'Watch out! At first, tantrums go UP. This is an extinction burst. Stay consistent, keep everyone safe.',
      'Then the behavior goes down, and down, toward zero.',
      'Sometimes the behavior suddenly comes back for a moment. That is spontaneous recovery. Keep following the plan!',
    ],
  },
].map((e) => ({ ...e, steps: e.say.length }));

export function ExplainerPlayer({ id }) {
  const e = EXPLAINERS.find((x) => x.id === id);
  const { s, update } = useStore();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef(null);

  useEffect(
    () => () => {
      stopSpeaking();
      clearTimeout(timer.current);
    },
    []
  );

  if (!e) return <p>Not found.</p>;
  const { Comp } = e;

  const finish = () => {
    setPlaying(false);
    setDone(true);
    if (!s.explainers[id]) {
      update((n) => {
        n.explainers = { ...n.explainers, [id]: Date.now() };
        addXP(n, XP.explainer);
        markStudy(n);
      });
    }
    sfx('win');
    celebrate();
  };

  const playFrom = (i) => {
    clearTimeout(timer.current);
    setStep(i);
    setDone(false);
    setPlaying(true);
    speak(e.say[i], s.rate, (ok) => {
      if (ok === false) {
        // No English voice: advance by reading time instead.
        timer.current = setTimeout(() => (i + 1 < e.steps ? playFrom(i + 1) : finish()), 4500);
        return;
      }
      timer.current = setTimeout(() => (i + 1 < e.steps ? playFrom(i + 1) : finish()), 700);
    });
  };

  const pause = () => {
    stopSpeaking();
    clearTimeout(timer.current);
    setPlaying(false);
  };

  const goStep = (i) => {
    const t = Math.max(0, Math.min(e.steps - 1, i));
    if (playing) playFrom(t);
    else setStep(t);
  };

  return (
    <div>
      <BackButton onClick={() => go('watch')} label="Watch" />
      <h1 className="mb-3 font-display text-2xl font-bold text-slate-900 dark:text-white">{e.title}</h1>
      <Card className="!p-4">
        <div className="mb-3 flex gap-1.5">
          {e.say.map((_, i) => (
            <button key={i} onClick={() => goStep(i)} aria-label={`Step ${i + 1}`} className={cx('h-1.5 flex-1 rounded-full transition', i <= step ? 'bg-brand-600' : 'bg-brand-600/15 dark:bg-white/10')} />
          ))}
        </div>
        <div className="aspect-[3/2] w-full rounded-2xl bg-white p-2 dark:bg-white/95">
          <Comp step={step} />
        </div>
        <div className="mt-4 flex items-start gap-3">
          <Mia size={52} className={cx('shrink-0', playing ? 'talking' : '')} />
          <p key={step} className="animate-rise text-[16px] leading-relaxed text-slate-700 dark:text-slate-200">
            {e.say[step]}
          </p>
        </div>
        <div className="mt-5 flex items-center justify-center gap-4">
          <button onClick={() => goStep(step - 1)} aria-label="Back" className="grid h-12 w-12 place-items-center rounded-full bg-brand-600/10 text-brand-700 dark:text-violet-200">
            <SkipBack size={20} />
          </button>
          <button onClick={() => (playing ? pause() : playFrom(done ? 0 : step))} aria-label={playing ? 'Pause' : 'Play'} className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-accent text-white shadow-lg">
            {playing ? <Pause size={28} /> : done ? <RotateCcw size={26} /> : <Play size={28} className="ml-1" />}
          </button>
          <button onClick={() => (step + 1 < e.steps ? goStep(step + 1) : finish())} aria-label="Next" className="grid h-12 w-12 place-items-center rounded-full bg-brand-600/10 text-brand-700 dark:text-violet-200">
            <SkipForward size={20} />
          </button>
        </div>
      </Card>
      {done && (
        <Card className="mt-4 animate-pop text-center">
          <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">Nice! +{XP.explainer} XP</p>
          <Button className="mt-3" onClick={() => go('watch')}>
            More explainers
          </Button>
        </Card>
      )}
    </div>
  );
}
