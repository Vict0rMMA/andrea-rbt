import { useEffect, useRef, useState } from 'react';
import { Volume2, Square, Loader2, X, Send } from 'lucide-react';
import { speak, stopSpeaking, playLesson, celebrate } from '../lib.js';
import { lessonSpeech, LESSON } from '../data/speech.js';
import { useStore, BADGES } from '../store.jsx';
import { levelInfo, sfx } from '../fun.js';

export const cx = (...c) => c.filter(Boolean).join(' ');

export function Card({ className, children, as: As = 'div', ...rest }) {
  return (
    <As className={cx('glass rounded-3xl p-5', className)} {...rest}>
      {children}
    </As>
  );
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }) {
  const v = {
    primary: 'bg-gradient-to-r from-brand-600 to-accent text-white shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40',
    soft: 'bg-brand-600/10 text-brand-700 hover:bg-brand-600/15 dark:bg-white/10 dark:text-violet-200 dark:hover:bg-white/15',
    ghost: 'text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10',
    white: 'bg-white text-brand-700 shadow hover:bg-brand-50',
    danger: 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/15 dark:text-rose-300',
    good: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25',
  }[variant];
  const sz = { sm: 'h-10 px-4 text-sm', md: 'h-12 px-5', lg: 'h-14 px-6 text-lg' }[size];
  return (
    <button
      className={cx('inline-flex select-none items-center justify-center gap-2 rounded-2xl font-semibold transition duration-150 active:scale-[.97] disabled:pointer-events-none disabled:opacity-40', v, sz, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

let ringId = 0;
export function Ring({ value, size = 160, stroke = 14, children }) {
  const [id] = useState(() => `rg${++ringId}`);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(Math.max(0, Math.min(100, value))), 60);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: 'rgb(var(--b600))' }} />
            <stop offset="100%" style={{ stopColor: 'rgb(var(--acc))' }} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-brand-600/10 dark:stroke-white/10" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * shown) / 100} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Bar({ value, color, className }) {
  return (
    <div className={cx('h-2.5 w-full overflow-hidden rounded-full bg-brand-600/10 dark:bg-white/10', className)}>
      <div
        className={cx('h-full rounded-full transition-[width] duration-700 ease-out', !color && 'bg-gradient-to-r from-brand-600 to-accent')}
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}

export function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="18" className="fill-brand-600" />
      <path d="M32 50S14 39 14 26a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 13-18 24-18 24z" fill="#fff" />
      <path d="M25.5 27.5c1.5-3.5 6.5-3.5 6.5 0m0 0c0-3.5 5-3.5 6.5 0M28 33.5c2.5 1.8 5.5 1.8 8 0M32 24v13" className="stroke-brand-600" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ───────── Coach Mia: pink elephant with moods and outfits ─────────
function Outfit({ outfit }) {
  if (outfit === 'flower')
    return (
      <g>
        {[22, 31, 40, 49, 58].map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 15 : 17} r="4" fill={['#F472B6', '#FDE047', '#A78BFA', '#FDE047', '#F472B6'][i]} />
        ))}
      </g>
    );
  if (outfit === 'glasses')
    return (
      <g fill="none" stroke="#4C1D95" strokeWidth="2">
        <circle cx="32" cy="36" r="6" />
        <circle cx="48" cy="36" r="6" />
        <path d="M38 36h4" />
        <path d="M44 18l-7-5v10zM44 18l7-5v10z" fill="#8B5CF6" stroke="none" />
      </g>
    );
  if (outfit === 'cap')
    return (
      <g>
        <path d="M18 18l22-9 22 9-22 9z" fill="#1E1B4B" />
        <path d="M28 22v6c6 4 18 4 24 0v-6" fill="#312E81" />
        <path d="M58 19v9" stroke="#FACC15" strokeWidth="2" />
        <circle cx="58" cy="29" r="2" fill="#FACC15" />
      </g>
    );
  if (outfit === 'crown')
    return <path d="M26 21l3-12 6 7 5-9 5 9 6-7 3 12z" fill="#FACC15" stroke="#EAB308" strokeWidth="1" />;
  return (
    <g>
      <path d="M44 18l-7-5v10zM44 18l7-5v10z" fill="#8B5CF6" />
      <circle cx="44" cy="18" r="2.6" fill="#7C3AED" />
    </g>
  );
}

export function Mia({ size = 56, className, bg = true, mood = 'happy', outfit }) {
  const ctx = useStore();
  const o = outfit || ctx?.s.outfit || 'bow';
  const eyes =
    mood === 'proud' ? (
      <g stroke="#3B0764" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M29 37q3-4 6 0" />
        <path d="M45 37q3-4 6 0" />
      </g>
    ) : mood === 'sad' ? (
      <g>
        <ellipse cx="32" cy="37" rx="2.6" ry="3" fill="#3B0764" />
        <ellipse cx="48" cy="37" rx="2.6" ry="3" fill="#3B0764" />
        <path d="M28 31l6 2M52 31l-6 2" stroke="#3B0764" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    ) : (
      <g>
        <ellipse cx="32" cy="36" rx="2.8" ry="3.4" fill="#3B0764" />
        <ellipse cx="48" cy="36" rx="2.8" ry="3.4" fill="#3B0764" />
        <circle cx="33" cy="34.8" r="1" fill="#fff" />
        <circle cx="49" cy="34.8" r="1" fill="#fff" />
      </g>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className={className} role="img" aria-label="Coach Mia, a pink elephant">
      {bg && <circle cx="40" cy="40" r="40" fill="#FCE7F3" />}
      <ellipse cx="15" cy="40" rx="14" ry="18" fill="#F472B6" />
      <ellipse cx="17" cy="40" rx="8.5" ry="12" fill="#FBCFE8" />
      <ellipse cx="65" cy="40" rx="14" ry="18" fill="#F472B6" />
      <ellipse cx="63" cy="40" rx="8.5" ry="12" fill="#FBCFE8" />
      <circle cx="40" cy="38" r="21" fill="#F9A8D4" />
      <path d={mood === 'cheer' ? 'M40 46c0 6-1 12-6 14-4 1-6-3-4-6' : 'M40 46c0 9 1 15 7 17 4 1 6-2 5-4'} stroke="#F9A8D4" strokeWidth="9" fill="none" strokeLinecap="round" />
      {eyes}
      <ellipse cx="27" cy="44" rx="3.6" ry="2.2" fill="#EC4899" opacity={mood === 'sad' ? 0.2 : 0.45} />
      <ellipse cx="53" cy="44" rx="3.6" ry="2.2" fill="#EC4899" opacity={mood === 'sad' ? 0.2 : 0.45} />
      {mood === 'sad' && <path d="M52 41q1 3 0 4" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />}
      <Outfit outfit={o} />
    </svg>
  );
}

export function Elephant({ size = 120, className, flip = false, balloon = false }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 120 108" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      {balloon && (
        <g>
          <path d="M22 64C18 48 16 36 20 26" stroke="#A78BFA" strokeWidth="1.5" fill="none" />
          <path d="M20 4c-8 0-13 7-12 14 1 6 7 10 12 12 5-2 11-6 12-12 1-7-4-14-12-14z" fill="#C084FC" />
          <path d="M14 10c-2 2-3 5-2 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7" fill="none" />
        </g>
      )}
      <path d="M104 62c6 0 8 4 7 9" stroke="#F472B6" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="74" cy="66" rx="32" ry="25" fill="#F9A8D4" />
      <rect x="50" y="78" width="12" height="22" rx="6" fill="#F9A8D4" />
      <rect x="66" y="80" width="12" height="20" rx="6" fill="#F472B6" />
      <rect x="84" y="78" width="12" height="22" rx="6" fill="#F9A8D4" />
      <rect x="96" y="76" width="10" height="20" rx="5" fill="#F472B6" />
      <circle cx="44" cy="52" r="22" fill="#F9A8D4" />
      <ellipse cx="60" cy="50" rx="13" ry="17" fill="#F472B6" />
      <ellipse cx="58" cy="50" rx="8" ry="11" fill="#FBCFE8" />
      <path d="M28 58c-8 2-12-4-10-12 1-4 4-6 6-5" stroke="#F9A8D4" strokeWidth="9" fill="none" strokeLinecap="round" />
      <ellipse cx="38" cy="48" rx="2.6" ry="3.2" fill="#3B0764" />
      <circle cx="39" cy="47" r=".9" fill="#fff" />
      <ellipse cx="36" cy="57" rx="3.4" ry="2" fill="#EC4899" opacity=".45" />
      <path d="M48 31l-6-5v9zM48 31l6-5v9z" fill="#8B5CF6" />
      <circle cx="48" cy="31" r="2.3" fill="#7C3AED" />
    </svg>
  );
}

export function ElephantParade({ className }) {
  return (
    <div className={cx('pointer-events-none flex items-end justify-center gap-1 opacity-90', className)} aria-hidden="true">
      <Elephant size={46} />
      <Elephant size={34} />
      <Elephant size={26} />
    </div>
  );
}

export function MiaSays({ children, className, mood = 'happy', talking = false }) {
  return (
    <div className={cx('flex items-start gap-3', className)}>
      <Mia size={48} mood={mood} className={cx('shrink-0', talking ? 'talking' : 'animate-float')} />
      <div className="relative rounded-2xl rounded-tl-md bg-white/90 px-4 py-3 text-[15px] leading-snug text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
        <span className="mb-0.5 block text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-violet-300">Coach Mia</span>
        {children}
      </div>
    </div>
  );
}

// Plays a lesson with the natural Gemini voice (if `lesson` is given) or the device's English voice.
export function ListenButton({ text, lesson, simple = false, className, label = 'Listen', size = 'sm' }) {
  const { s } = useStore();
  const [state, setState] = useState('idle'); // idle | loading | playing | novoice
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    setState((st) => (st === 'idle' || st === 'novoice' ? st : 'idle'));
  }, [text, lesson, simple]);
  useEffect(() => () => stopSpeaking(), []);

  const done = (ok) => mounted.current && setState(ok === false ? 'novoice' : 'idle');

  const start = () => {
    if (state === 'loading' || state === 'playing') {
      stopSpeaking();
      setState('idle');
      return;
    }
    if (lesson) {
      setState('loading');
      playLesson(lesson, simple, lessonSpeech(LESSON[lesson], simple), {
        rate: s.rate,
        onStart: () => mounted.current && setState('playing'),
        onEnd: done,
      });
    } else {
      setState('playing');
      speak(text, s.rate, done);
    }
  };

  return (
    <span className="inline-flex flex-col">
      <Button variant="soft" size={size} className={className} aria-pressed={state === 'playing'} onClick={start}>
        {state === 'loading' ? <Loader2 size={16} className="animate-spin" /> : state === 'playing' ? <Square size={15} /> : <Volume2 size={17} />}
        {state === 'loading' ? 'Loading voice' : state === 'playing' ? 'Stop' : label}
      </Button>
      {state === 'novoice' && <span className="mt-1 max-w-[220px] text-xs text-rose-500">No English voice on this device. Add one in your phone's settings (Accessibility, Spoken Content).</span>}
    </span>
  );
}

export function PageTitle({ title, sub, right }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-[15px] text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

// Domain marker: a simple colored letter instead of icons.
export function DomainBadge({ d, size = 44, className }) {
  return (
    <span className={cx('grid shrink-0 place-items-center rounded-2xl font-display font-bold text-white', className)} style={{ width: size, height: size, background: d.color, fontSize: size * 0.42 }}>
      {d.id}
    </span>
  );
}

export function DomainChip({ d, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', className)} style={{ background: d.soft, color: d.color }}>
      Domain {d.id} · {d.short}
    </span>
  );
}

export function Medal({ got, name, size = 64 }) {
  return (
    <span className={cx('relative grid place-items-center rounded-full', got && 'shiny')} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill={got ? '#FDE68A' : '#E5E7EB'} className={got ? '' : 'dark:fill-white/10'} />
        <circle cx="32" cy="32" r="24" fill={got ? '#FBBF24' : '#D1D5DB'} className={got ? '' : 'dark:fill-white/5'} />
        <g transform="translate(12 13) scale(.5)" opacity={got ? 1 : 0.35}>
          <ellipse cx="15" cy="40" rx="14" ry="18" fill="#F472B6" />
          <ellipse cx="65" cy="40" rx="14" ry="18" fill="#F472B6" />
          <circle cx="40" cy="38" r="21" fill="#F9A8D4" />
          <path d="M40 46c0 9 1 15 7 17 4 1 6-2 5-4" stroke="#F9A8D4" strokeWidth="9" fill="none" strokeLinecap="round" />
          <ellipse cx="32" cy="36" rx="2.8" ry="3.4" fill="#3B0764" />
          <ellipse cx="48" cy="36" rx="2.8" ry="3.4" fill="#3B0764" />
        </g>
      </svg>
      <span className="sr-only">{name}</span>
    </span>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 backdrop-blur-sm sm:items-center" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className={cx('glass-strong max-h-[88dvh] w-full animate-pop overflow-y-auto rounded-3xl p-5 shadow-2xl', wide ? 'max-w-2xl' : 'max-w-lg')} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-black/5 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Badge toasts + level-up celebration.
export function BadgeToast() {
  const { s, update } = useStore();
  const id = s.newBadges?.[0];
  useEffect(() => {
    if (!id) return;
    sfx('win');
    const t = setTimeout(() => update((n) => void (n.newBadges = n.newBadges.slice(1)), true), 3800);
    return () => clearTimeout(t);
  }, [id, update]);

  useEffect(() => {
    if (!s.levelUp) return;
    sfx('level');
    celebrate(true);
  }, [s.levelUp]);

  const b = id && BADGES.find((x) => x.id === id);
  const lv = s.levelUp && levelInfo(s.xp);
  return (
    <>
      {b && (
        <div className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4" role="status">
          <div key={id} className="glass-strong flex animate-pop items-center gap-3 rounded-2xl px-5 py-3 shadow-xl">
            <Medal got size={44} name={b.name} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-violet-300">Badge unlocked!</p>
              <p className="font-semibold text-slate-900 dark:text-white">{b.name}</p>
            </div>
          </div>
        </div>
      )}
      {lv && (
        <Modal title="Level up!" onClose={() => update((n) => void (n.levelUp = null), true)}>
          <div className="flex flex-col items-center text-center">
            <Mia size={110} mood="proud" className="animate-pop" />
            <p className="mt-3 font-display text-5xl font-bold text-brand-600 dark:text-violet-300">Level {lv.level}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{lv.rank}</p>
            <p className="mt-2 text-slate-500 dark:text-slate-400">You're getting stronger every day, {s.name}! Check "Me" for new themes and outfits.</p>
            <Button className="mt-5 w-full" onClick={() => update((n) => void (n.levelUp = null), true)}>
              Keep going
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function BackButton({ onClick, label = 'Back' }) {
  return (
    <button onClick={onClick} className="mb-4 inline-flex h-10 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-brand-600 hover:bg-brand-600/10 dark:text-violet-300">
      ← {label}
    </button>
  );
}

// ───────── Ask Coach Mia (Gemini) ─────────
const SUGGEST = ['Explain this like I\'m 10', 'Give me another example', 'How will the exam ask about this?', 'What is the difference between DRA and DRI?'];

export function AskMia({ topic, onClose }) {
  const [q, setQ] = useState('');
  const [chat, setChat] = useState([]);
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [chat, busy]);

  const ask = async (text) => {
    const question = (text ?? q).trim();
    if (!question || busy) return;
    setQ('');
    setChat((c) => [...c, { who: 'me', text: question }]);
    setBusy(true);
    try {
      const r = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, topic }) });
      const j = await r.json().catch(() => ({}));
      setChat((c) => [...c, { who: 'mia', text: j.answer || j.error || 'Coach Mia is resting right now. Try again in a minute.', err: !j.answer }]);
    } catch {
      setChat((c) => [...c, { who: 'mia', text: 'You seem to be offline. Try again when you have internet.', err: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Ask Coach Mia" onClose={onClose} wide>
      <div className="space-y-3">
        <MiaSays>{topic ? `Ask me anything about "${topic}". I'll explain it simply.` : 'Ask me anything about the RBT exam. I\'ll explain it simply.'}</MiaSays>
        {chat.map((m, i) =>
          m.who === 'me' ? (
            <p key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-white">
              {m.text}
            </p>
          ) : (
            <div key={i} className={cx('max-w-[92%] animate-rise rounded-2xl rounded-tl-md px-4 py-3 text-[15px] leading-relaxed', m.err ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'bg-white/80 text-slate-700 dark:bg-white/10 dark:text-slate-200')}>
              <p className="whitespace-pre-wrap">{m.text}</p>
              {!m.err && <ListenButton text={m.text} className="mt-2" />}
            </div>
          )
        )}
        {busy && (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Mia is thinking...
          </p>
        )}
        <div ref={end} />
        {!chat.length && (
          <div className="flex flex-wrap gap-2">
            {SUGGEST.map((x) => (
              <button key={x} onClick={() => ask(x)} className="rounded-full bg-brand-600/10 px-3 py-2 text-sm font-medium text-brand-700 dark:text-violet-200">
                {x}
              </button>
            ))}
          </div>
        )}
        <form
          className="sticky bottom-0 flex gap-2 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your question..." className="h-12 min-w-0 flex-1 rounded-2xl border border-black/5 bg-white px-4 outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/10" />
          <Button type="submit" disabled={!q.trim() || busy} aria-label="Send" className="w-12 !px-0">
            <Send size={18} />
          </Button>
        </form>
      </div>
    </Modal>
  );
}
