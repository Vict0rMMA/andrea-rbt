import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronRight, ExternalLink, RotateCcw } from 'lucide-react';
import { useStore, addXP, markStudy } from '../store.jsx';
import { DOMAIN } from '../data/domains.js';
import { lessonsByDomain } from '../data/lessons.js';
import { LESSON, lessonParts, lessonSpeech } from '../data/speech.js';
import { EXPLAINERS } from './Explainers.jsx';
import { go, playLesson, speak, stopSpeaking, celebrate } from '../lib.js';
import { XP, sfx } from '../fun.js';
import { Button, Mia, Elephant, BackButton, DomainChip, cx } from '../components/ui.jsx';
import { ytSearch } from './Learn.jsx';

// Lessons that get an animated diagram on the "What it is" slide.
const DIAGRAM = {
  'A-abc': 'abc',
  'A-discontinuous': 'intervals',
  'B-functions': 'functions',
  'C-reinforcement': 'grid',
  'D-punishment': 'grid',
  'C-prompts': 'prompts',
  'C-promptfading': 'prompts',
  'C-chaining': 'chaining',
  'D-extinction': 'burst',
};

// Splits text into sentences without breaking "U.S." or "e.g.".
export function sentences(text) {
  const out = [];
  let cur = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    cur += ch;
    if ('.!?'.includes(ch)) {
      const next = text[i + 1];
      const after = text[i + 2];
      const word = cur.trim().split(/\s+/).pop() || '';
      const abbreviation = /^(?:[A-Z]\.){1,3}$|^(?:e\.g|i\.e|vs|etc)\.$/i.test(word.replace(/^[("']/, ''));
      if ((next === undefined || next === ' ') && (after === undefined || /[A-Z"(0-9]/.test(after)) && !abbreviation) {
        out.push(cur.trim());
        cur = '';
      }
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

// Builds the timeline: every sentence is a "beat". Display text can be shorter than the
// spoken text (spoken parts start with "Here is an example." etc.).
function buildBeats(l) {
  const parts = lessonParts(l);
  const display = [l.title, l.def, l.example, l.trap, l.trick];
  const beats = [];
  parts.forEach((p, pi) => {
    const spoken = sentences(p.text);
    const shown = sentences(display[pi]);
    const prefix = Math.max(0, spoken.length - shown.length);
    spoken.forEach((t, si) => beats.push({ part: pi, sub: Math.max(0, si - prefix), text: t }));
  });
  const total = beats.reduce((a, b) => a + b.text.length, 0);
  let acc = 0;
  beats.forEach((b) => {
    b.start = acc / total;
    acc += b.text.length;
  });
  return { beats, shown: display.map((d) => sentences(d)) };
}

// ───────── Slides ─────────
function TitleSlide({ l, d, n, total }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <span className="grid h-16 w-16 animate-pop place-items-center rounded-2xl bg-white/20 font-display text-3xl font-bold">{d.id}</span>
      <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-white/75">{d.name}</p>
      <h2 className="mt-3 max-w-2xl animate-rise font-display text-3xl font-bold leading-tight md:text-5xl">{l.title}</h2>
      <p className="mt-3 text-white/75">
        Lesson {n} of {total}
      </p>
      <Mia size={96} mood="happy" className="mt-5 animate-float" />
    </div>
  );
}

function Bullets({ items, sub, light = true }) {
  return (
    <ul className="space-y-3">
      {items.map((t, i) => (
        <li
          key={i}
          className={cx('flex gap-3 text-left text-[17px] leading-snug transition-all duration-500 md:text-xl', i > sub ? 'translate-y-2 opacity-0' : 'opacity-100', i < sub && (light ? 'text-white/65' : 'text-slate-500'), i === sub && 'font-semibold')}
        >
          <span className={cx('mt-2 h-2.5 w-2.5 shrink-0 rounded-full transition', i === sub ? 'scale-125 bg-amber-300' : light ? 'bg-white/50' : 'bg-slate-400')} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function WhatSlide({ l, items, sub }) {
  const ex = EXPLAINERS.find((e) => e.id === DIAGRAM[l.id]);
  const step = ex ? Math.min(ex.steps - 1, Math.floor(((sub + 1) / items.length) * ex.steps)) : 0;
  return (
    <div className={cx('grid h-full items-center gap-5', ex && 'md:grid-cols-2')}>
      <div>
        <p className="mb-4 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">What it is</p>
        <Bullets items={items} sub={sub} />
      </div>
      {ex && (
        <div className="aspect-[3/2] w-full animate-pop rounded-2xl bg-white p-2 shadow-xl">
          <ex.Comp step={step} />
        </div>
      )}
    </div>
  );
}

function ExampleSlide({ items, sub }) {
  return (
    <div className="flex h-full flex-col justify-center">
      <p className="mb-4 inline-block self-start rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">Real-life example</p>
      <div className="flex items-end gap-3">
        <Elephant size={70} className="hidden shrink-0 sm:block" />
        <div className="flex-1 space-y-2.5">
          {items.map((t, i) => (
            <div
              key={i}
              className={cx('relative rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[16px] leading-snug text-slate-800 shadow-lg transition-all duration-500 md:text-lg', i > sub ? 'translate-y-3 scale-95 opacity-0' : 'opacity-100', i < sub && 'opacity-70')}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrapSlide({ items, sub }) {
  return (
    <div className="relative flex h-full flex-col justify-center">
      <span className="absolute right-0 top-0 rotate-12 rounded-xl border-4 border-rose-300 px-3 py-1 font-display text-lg font-black uppercase tracking-wider text-rose-200 md:text-2xl">Exam trap</span>
      <p className="mb-4 inline-block self-start rounded-full bg-rose-500/40 px-3 py-1 text-xs font-bold uppercase tracking-wider">How the exam tricks you</p>
      <div className="rounded-2xl border-l-8 border-rose-400 bg-black/20 p-4 md:p-6">
        <Bullets items={items} sub={sub} />
      </div>
    </div>
  );
}

function TrickSlide({ text }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <p className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">Memory trick</p>
      <div className="max-w-xl -rotate-2 animate-pop rounded-md bg-amber-200 px-6 py-7 font-display text-2xl font-bold leading-snug text-amber-950 shadow-2xl md:text-3xl">{text}</div>
      <Mia size={80} mood="proud" className="animate-float" />
    </div>
  );
}

function DoneSlide({ l }) {
  const rows = [
    ['What it is', l.simple],
    ['Exam trap', l.trap],
    ['Memory trick', l.trick],
  ];
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="mb-4 flex items-center gap-3">
        <Mia size={64} mood="proud" />
        <div>
          <p className="font-display text-2xl font-bold">Great job!</p>
          <p className="text-white/80">+{XP.video} XP · Quick recap:</p>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map(([k, v], i) => (
          <div key={k} className="animate-rise rounded-2xl bg-white/15 p-3" style={{ animationDelay: `${i * 0.15}s` }}>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">{k}</p>
            <p className="text-[15px] leading-snug md:text-base">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const BG = [
  'from-brand-900 via-brand-700 to-accent',
  'from-brand-900 via-brand-700 to-brand-600',
  'from-sky-700 via-brand-700 to-brand-600',
  'from-rose-900 via-rose-700 to-orange-500',
  'from-brand-900 via-fuchsia-800 to-accent',
];

// ───────── Player ─────────
export function LessonVideo({ id }) {
  const l = LESSON[id];
  const { s, update } = useStore();
  const { beats, shown } = useMemo(() => (l ? buildBeats(l) : { beats: [], shown: [] }), [l]);
  const [beat, setBeat] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | loading | playing | paused | done
  const engine = useRef(null);
  const audio = useRef(null);
  const beatRef = useRef(0);
  beatRef.current = beat;

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => {
    stopSpeaking();
    setBeat(0);
    setStatus('idle');
    engine.current = null;
  }, [id]);

  if (!l) return <p>Video not found.</p>;
  const d = DOMAIN[l.d];
  const list = lessonsByDomain(l.d);
  const n = list.findIndex((x) => x.id === id) + 1;
  const nextLesson = list[n];
  const cur = beats[beat] || beats[0];
  const partStart = (p) => beats.findIndex((b) => b.part === p);

  const finish = () => {
    setStatus('done');
    if (!s.watched[id]) {
      update((x) => {
        x.watched = { ...x.watched, [id]: Date.now() };
        addXP(x, XP.video);
        markStudy(x);
      });
    }
    sfx('win');
    celebrate();
  };

  // Device voice: one sentence at a time, so slides stay in sync.
  const speakFrom = (i) => {
    engine.current = 'device';
    setBeat(i);
    setStatus('playing');
    speak(beats[i].text, s.rate, (ok) => {
      if (ok === false) return setStatus('idle');
      if (i + 1 < beats.length) speakFrom(i + 1);
      else finish();
    });
  };

  const start = (from = 0) => {
    setStatus('loading');
    setBeat(from);
    audio.current = playLesson(id, false, lessonSpeech(l), {
      rate: s.rate,
      onStart: (eng) => {
        if (eng === 'device') {
          stopSpeaking();
          speakFrom(from);
        } else {
          engine.current = 'gemini';
          if (from && audio.current?.duration) audio.current.currentTime = beats[from].start * audio.current.duration;
          setStatus('playing');
        }
      },
      onTime: (f) => {
        let i = 0;
        while (i + 1 < beats.length && f >= beats[i + 1].start) i++;
        if (i !== beatRef.current) setBeat(i);
      },
      onEnd: (ok) => engine.current === 'gemini' && ok && finish(),
    });
  };

  const toggle = () => {
    if (status === 'idle' || status === 'done') return start(status === 'done' ? 0 : beat);
    if (status === 'loading') {
      stopSpeaking();
      return setStatus('idle');
    }
    if (engine.current === 'gemini' && audio.current) {
      if (status === 'playing') {
        audio.current.pause();
        setStatus('paused');
      } else {
        audio.current.play();
        setStatus('playing');
      }
    } else if (status === 'playing') {
      stopSpeaking();
      setStatus('paused');
    } else speakFrom(beat);
  };

  // Skip by slide (part).
  const jumpPart = (p) => {
    const t = Math.max(0, Math.min(4, p));
    const b = partStart(t);
    if (engine.current === 'gemini' && audio.current?.duration) {
      audio.current.currentTime = beats[b].start * audio.current.duration + 0.01;
      setBeat(b);
    } else if (status === 'playing') speakFrom(b);
    else {
      setBeat(b);
      if (status === 'done') setStatus('paused');
    }
  };

  const playing = status === 'playing';
  const part = status === 'done' ? 5 : cur.part;
  const sub = cur.sub;

  return (
    <div>
      <BackButton onClick={() => go('watch')} label="Watch" />
      <div className="mb-3 flex items-center justify-between gap-2">
        <DomainChip d={d} />
        {s.watched[id] && <span className="text-xs font-semibold text-emerald-600">Watched</span>}
      </div>

      <div className={cx('relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-2xl shadow-brand-900/30 transition-colors duration-700 md:p-8', BG[Math.min(part, 4)])}>
        {/* slide progress */}
        <div className="mb-5 flex gap-1.5">
          {[0, 1, 2, 3, 4].map((p) => (
            <button key={p} onClick={() => jumpPart(p)} aria-label={`Slide ${p + 1}`} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
              <span className={cx('block h-full rounded-full bg-white transition-all duration-500', p < part || (p === part && status !== 'idle') ? 'w-full' : 'w-0')} />
            </button>
          ))}
        </div>

        <div key={part} className="min-h-[380px] animate-rise md:min-h-[420px]">
          {part === 0 && <TitleSlide l={l} d={d} n={n} total={list.length} />}
          {part === 1 && <WhatSlide l={l} items={shown[1]} sub={status === 'idle' ? shown[1].length - 1 : sub} />}
          {part === 2 && <ExampleSlide items={shown[2]} sub={status === 'idle' ? shown[2].length - 1 : sub} />}
          {part === 3 && <TrapSlide items={shown[3]} sub={status === 'idle' ? shown[3].length - 1 : sub} />}
          {part === 4 && <TrickSlide text={l.trick} />}
          {part === 5 && <DoneSlide l={l} />}
        </div>

        <div className="mt-5 flex items-center justify-center gap-4">
          <button onClick={() => jumpPart(Math.min(part, 5) - 1)} aria-label="Previous slide" className="grid h-12 w-12 place-items-center rounded-full bg-white/15 active:scale-95">
            <SkipBack size={20} />
          </button>
          <button onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="grid h-16 w-16 place-items-center rounded-full bg-white text-brand-700 shadow-xl active:scale-95">
            {status === 'loading' ? <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-brand-600 border-t-transparent" /> : playing ? <Pause size={28} /> : status === 'done' ? <RotateCcw size={26} /> : <Play size={28} className="ml-1" />}
          </button>
          <button onClick={() => (part >= 4 ? (stopSpeaking(), finish()) : jumpPart(part + 1))} aria-label="Next slide" className="grid h-12 w-12 place-items-center rounded-full bg-white/15 active:scale-95">
            <SkipForward size={20} />
          </button>
        </div>
        {status === 'loading' && <p className="mt-3 text-center text-sm text-white/80">Getting Mia's voice ready...</p>}
        {status === 'idle' && part === 0 && <p className="mt-3 text-center text-sm text-white/80">Tap play. Mia will explain it slide by slide.</p>}
        {playing && <Mia size={44} className="talking absolute bottom-5 right-5 hidden md:block" />}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {nextLesson ? (
          <Button onClick={() => go(`watch/lesson/${nextLesson.id}`)}>
            Next video <ChevronRight size={18} />
          </Button>
        ) : (
          <Button onClick={() => go(`quiz/${l.d}`)}>Quiz this topic</Button>
        )}
        <Button variant="soft" onClick={() => go(`learn/${l.d}?l=${id}`)}>
          Read the lesson
        </Button>
      </div>
      <a href={ytSearch(l.title)} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
        More videos about this on YouTube <ExternalLink size={14} />
      </a>
    </div>
  );
}
