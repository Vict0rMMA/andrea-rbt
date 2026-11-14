import { useEffect, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { canSpeak, speak, stopSpeaking } from '../lib.js';
import { useStore, BADGES } from '../store.jsx';

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
    primary: 'bg-gradient-to-r from-brand-600 to-fuchsia-500 text-white shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40',
    soft: 'bg-brand-600/10 text-brand-700 hover:bg-brand-600/15 dark:bg-white/10 dark:text-violet-200 dark:hover:bg-white/15',
    ghost: 'text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10',
    white: 'bg-white text-brand-700 shadow hover:bg-brand-50',
    danger: 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/15 dark:text-rose-300',
  }[variant];
  const sz = { sm: 'h-10 px-4 text-sm', md: 'h-12 px-5', lg: 'h-14 px-6 text-lg' }[size];
  return (
    <button
      className={cx(
        'inline-flex select-none items-center justify-center gap-2 rounded-2xl font-semibold transition duration-150 active:scale-[.97] disabled:pointer-events-none disabled:opacity-40',
        v,
        sz,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Ring({ value, size = 160, stroke = 14, color = 'url(#ringGrad)', children, track = 'rgba(124,58,237,.12)' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(Math.max(0, Math.min(100, value))), 60);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#F0ABFC" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * shown) / 100}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Bar({ value, color = '#7C3AED', className }) {
  return (
    <div className={cx('h-2.5 w-full overflow-hidden rounded-full bg-brand-600/10 dark:bg-white/10', className)}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: `linear-gradient(90deg, ${color}, #F0ABFC)` }}
      />
    </div>
  );
}

export function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="logoG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#F0ABFC" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#logoG)" />
      <path d="M32 50S14 39 14 26a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 13-18 24-18 24z" fill="#fff" />
      <path d="M25.5 27.5c1.5-3.5 6.5-3.5 6.5 0m0 0c0-3.5 5-3.5 6.5 0M28 33.5c2.5 1.8 5.5 1.8 8 0M32 24v13" stroke="#7C3AED" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// Coach Mia: a cute pink elephant face with a purple bow.
export function Mia({ size = 56, className, bg = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className={className} role="img" aria-label="Coach Mia, a pink elephant">
      {bg && <circle cx="40" cy="40" r="40" fill="#FCE7F3" />}
      {/* ears */}
      <ellipse cx="15" cy="40" rx="14" ry="18" fill="#F472B6" />
      <ellipse cx="17" cy="40" rx="8.5" ry="12" fill="#FBCFE8" />
      <ellipse cx="65" cy="40" rx="14" ry="18" fill="#F472B6" />
      <ellipse cx="63" cy="40" rx="8.5" ry="12" fill="#FBCFE8" />
      {/* head */}
      <circle cx="40" cy="38" r="21" fill="#F9A8D4" />
      {/* trunk */}
      <path d="M40 46c0 9 1 15 7 17 4 1 6-2 5-4" stroke="#F9A8D4" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M44 61c2 0 4-1 4-3" stroke="#F472B6" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* eyes */}
      <ellipse cx="32" cy="36" rx="2.8" ry="3.4" fill="#3B0764" />
      <ellipse cx="48" cy="36" rx="2.8" ry="3.4" fill="#3B0764" />
      <circle cx="33" cy="34.8" r="1" fill="#fff" />
      <circle cx="49" cy="34.8" r="1" fill="#fff" />
      {/* blush */}
      <ellipse cx="27" cy="44" rx="3.6" ry="2.2" fill="#EC4899" opacity=".45" />
      <ellipse cx="53" cy="44" rx="3.6" ry="2.2" fill="#EC4899" opacity=".45" />
      {/* bow */}
      <path d="M44 18l-7-5v10zM44 18l7-5v10z" fill="#8B5CF6" />
      <circle cx="44" cy="18" r="2.6" fill="#7C3AED" />
    </svg>
  );
}

// Full-body pink elephant (decorations, empty states, celebrations).
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
      {/* tail */}
      <path d="M104 62c6 0 8 4 7 9" stroke="#F472B6" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="74" cy="66" rx="32" ry="25" fill="#F9A8D4" />
      {/* legs */}
      <rect x="50" y="78" width="12" height="22" rx="6" fill="#F9A8D4" />
      <rect x="66" y="80" width="12" height="20" rx="6" fill="#F472B6" />
      <rect x="84" y="78" width="12" height="22" rx="6" fill="#F9A8D4" />
      <rect x="96" y="76" width="10" height="20" rx="5" fill="#F472B6" />
      {/* head */}
      <circle cx="44" cy="52" r="22" fill="#F9A8D4" />
      {/* ear */}
      <ellipse cx="60" cy="50" rx="13" ry="17" fill="#F472B6" />
      <ellipse cx="58" cy="50" rx="8" ry="11" fill="#FBCFE8" />
      {/* trunk raised */}
      <path d="M28 58c-8 2-12-4-10-12 1-4 4-6 6-5" stroke="#F9A8D4" strokeWidth="9" fill="none" strokeLinecap="round" />
      {/* eye + blush */}
      <ellipse cx="38" cy="48" rx="2.6" ry="3.2" fill="#3B0764" />
      <circle cx="39" cy="47" r=".9" fill="#fff" />
      <ellipse cx="36" cy="57" rx="3.4" ry="2" fill="#EC4899" opacity=".45" />
      {/* bow */}
      <path d="M48 31l-6-5v9zM48 31l6-5v9z" fill="#8B5CF6" />
      <circle cx="48" cy="31" r="2.3" fill="#7C3AED" />
      {/* heart */}
      <path d="M12 30c0-2 3-3 4-1 1-2 4-1 4 1 0 3-4 5-4 5s-4-2-4-5z" fill="#EC4899" opacity={balloon ? 0 : 1} />
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

export function MiaSays({ children, className }) {
  return (
    <div className={cx('flex items-start gap-3', className)}>
      <Mia size={48} className="shrink-0 animate-float" />
      <div className="relative rounded-2xl rounded-tl-md bg-white/90 px-4 py-3 text-[15px] leading-snug text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
        <span className="mb-0.5 block text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-violet-300">Coach Mia</span>
        {children}
      </div>
    </div>
  );
}

export function ListenButton({ text, className, label = 'Listen' }) {
  const { s } = useStore();
  const [on, setOn] = useState(false);
  useEffect(() => () => on && stopSpeaking(), [on]);
  useEffect(() => {
    setOn(false);
  }, [text]);
  if (!canSpeak) return null;
  return (
    <Button
      variant="soft"
      size="sm"
      className={className}
      aria-pressed={on}
      onClick={() => {
        if (on) {
          stopSpeaking();
          setOn(false);
        } else {
          setOn(true);
          speak(text, s.rate, () => setOn(false));
        }
      }}
    >
      {on ? <Square size={16} /> : <Volume2 size={18} />}
      {on ? 'Stop' : label}
    </Button>
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

export function DomainChip({ d, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', className)} style={{ background: d.soft, color: d.color }}>
      {d.emoji} Domain {d.id}
    </span>
  );
}

export function BadgeToast() {
  const { s, update } = useStore();
  const id = s.newBadges?.[0];
  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => update((n) => void (n.newBadges = n.newBadges.slice(1))), 3800);
    return () => clearTimeout(t);
  }, [id, update]);
  if (!id) return null;
  const b = BADGES.find((x) => x.id === id);
  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4" role="status">
      <div key={id} className="glass-strong flex animate-pop items-center gap-3 rounded-2xl px-5 py-3 shadow-xl">
        <span className="text-3xl">{b.emoji}</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-violet-300">Badge unlocked!</p>
          <p className="font-semibold text-slate-900 dark:text-white">{b.name}</p>
        </div>
      </div>
    </div>
  );
}

export function BackButton({ onClick, label = 'Back' }) {
  return (
    <button onClick={onClick} className="mb-4 inline-flex h-10 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-brand-600 hover:bg-brand-600/10 dark:text-violet-300">
      ← {label}
    </button>
  );
}
