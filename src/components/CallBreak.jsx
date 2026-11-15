import { useEffect, useRef, useState } from 'react';
import { useStore, todayKey } from '../store.jsx';
import { sfx, buzz } from '../fun.js';


// A little surprise from her boyfriend: after a long study session, Mia reminds her to call him.
// Put his number here (with country code, only digits), e.g. '573001234567'.
export const BOYFRIEND_PHONE = '573022641006';
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

  // Opens a WhatsApp chat with him, with a sweet message ready to send.
  const msg = 'Hola amor 💜 ya llevo un montón estudiando y la elefantica me dijo que te llamara 🐘📞';
  const href = BOYFRIEND_PHONE ? `https://wa.me/${BOYFRIEND_PHONE}?text=${encodeURIComponent(msg)}` : null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-3 bg-slate-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Llama a tu novio">
      {/* The design is the picture itself; the real button sits exactly over the pink button in the picture. */}
      <div className="relative inline-block animate-pop overflow-hidden rounded-[32px] shadow-2xl">
        <img src="/call-surprise.jpg" alt="¡Wow, ya llevas muchísimo tiempo aquí! ¡Llama a tu novio! Él te extraña un montón" className="block max-h-[80dvh] w-auto max-w-full" />
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" onClick={close} aria-label="Llamar al novio ahora" className="absolute left-[5%] right-[5%] top-[84%] h-[14%] animate-pulse rounded-full ring-4 ring-white/0 transition active:scale-95" />
        ) : (
          <button onClick={close} aria-label="Cerrar" className="absolute left-[5%] right-[5%] top-[84%] h-[14%] rounded-full" />
        )}
      </div>
      <button onClick={close} className="h-10 rounded-full px-5 text-sm font-semibold text-white/90 hover:bg-white/10">
        Ahorita sigo estudiando
      </button>
    </div>
  );
}
