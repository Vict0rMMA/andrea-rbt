import { useEffect, useRef, useState } from 'react';
import { useStore, todayKey } from '../store.jsx';
import { sfx, buzz } from '../fun.js';
import { Elephant } from './ui.jsx';

// A little surprise from her boyfriend: after a long study session, Mia reminds her to call him.
// Put his number here (with country code, only digits), e.g. '573001234567'.
export const BOYFRIEND_PHONE = '';
const AFTER_MINUTES = 40; // continuous study time before the reminder shows (once a day)

export default function CallBreak() {
  const { s, update } = useStore();
  // Preview: open the site with ?test=1&call to see it right away.
  const [open, setOpen] = useState(() => /[?&]call/.test(window.location.search));
  const start = useRef(Date.now());
  const hiddenAt = useRef(null);

  useEffect(() => {
    // A pause of 10+ minutes away from the app starts a new session.
    const onVis = () => {
      if (document.visibilityState === 'hidden') hiddenAt.current = Date.now();
      else if (hiddenAt.current && Date.now() - hiddenAt.current > 10 * 60000) start.current = Date.now();
    };
    // Preview: open the site with ?test=1&call to see it right away.
    if (/[?&]call/.test(window.location.search)) setOpen(true);
    document.addEventListener('visibilitychange', onVis);
    const id = setInterval(() => {
      const busy = /^#\/exam\/run/.test(window.location.hash);
      if (document.visibilityState === 'visible' && !busy && Date.now() - start.current >= AFTER_MINUTES * 60000) {
        setOpen((o) => o || true);
      }
    }, 30000);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    if (open) {
      sfx('chest');
      buzz([40, 60, 40]);
    }
  }, [open]);

  if (!open || s.callDay === todayKey()) return null;

  const close = () => {
    update((n) => void (n.callDay = todayKey()), true);
    start.current = Date.now();
    setOpen(false);
  };

  const href = BOYFRIEND_PHONE ? `tel:+${BOYFRIEND_PHONE}` : null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Time to call">
      <div className="relative w-full max-w-sm animate-pop overflow-hidden rounded-[32px] bg-[#E8F5E1] px-6 pb-6 pt-8 text-center shadow-2xl">
        {/* floating hearts and notes */}
        {[
          ['♥', 'left-5 top-6 text-rose-400 text-2xl', '0s'],
          ['♥', 'right-6 top-4 text-pink-400 text-xl', '.6s'],
          ['♪', 'right-8 top-1/2 text-violet-400 text-2xl', '.3s'],
          ['♫', 'left-6 top-[58%] text-violet-400 text-2xl', '.9s'],
          ['♥', 'right-5 top-[64%] text-rose-400 text-2xl', '1.2s'],
          ['♥', 'left-10 top-[44%] text-pink-400 text-lg', '1.5s'],
        ].map(([c, cls, delay], i) => (
          <span key={i} className={`pointer-events-none absolute animate-float ${cls}`} style={{ animationDelay: delay }} aria-hidden="true">
            {c}
          </span>
        ))}

        <p className="relative font-display text-2xl font-bold leading-tight text-slate-800">¡Wow, ya llevas muchísimo tiempo aquí!</p>
        <p className="relative mt-3 font-display text-[34px] font-extrabold leading-[1.1]">
          <span className="text-rose-500">¡Llama</span> <span className="text-slate-800">a</span> <span className="text-teal-500">tu</span> <span className="text-violet-500">novio!</span>
        </p>
        <p className="relative mt-1 font-display text-2xl font-bold leading-tight text-slate-800">él te extraña un montón ❤️</p>
        <p className="relative mt-3 text-[15px] font-medium leading-snug text-slate-600">(Dice que ya se le olvidó cómo es tu voz y que hasta la elefantica de aquí abajo está preocupada 🐘📞)</p>

        <Elephant size={170} className="relative mx-auto mt-3 animate-float" />

        {href ? (
          <a href={href} onClick={close} className="relative mt-2 flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-lg font-bold text-white shadow-lg shadow-rose-500/40 ring-4 ring-cyan-300 transition active:scale-95">
            Llamar al novio ahora 📞✨
          </a>
        ) : (
          <button onClick={close} className="relative mt-2 flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-lg font-bold text-white shadow-lg shadow-rose-500/40 ring-4 ring-cyan-300 transition active:scale-95">
            ¡Ya lo llamo! 📞✨
          </button>
        )}
        <button onClick={close} className="relative mt-3 text-sm font-semibold text-slate-500">
          Ahorita sigo estudiando
        </button>
      </div>
    </div>
  );
}
