import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { useStore, markStudy } from '../store.jsx';
import { go } from '../lib.js';
import { sfx } from '../fun.js';
import { Mia, ListenButton, BackButton, cx } from '../components/ui.jsx';

const IDEAS = [
  'What is the difference between DRA and DRI?',
  'Explain partial interval like I\'m 10',
  'Give me a practice question about ethics',
  'How do I know the function of a behavior?',
  'What is resurgence?',
  'Quiz me on prompting',
];

export default function Chat({ query }) {
  const { s, update } = useStore();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  const sentInitial = useRef(false);
  const chat = s.chat || [];

  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [chat.length, busy]);

  const send = async (raw, topic) => {
    const question = (raw ?? text).trim();
    if (!question || busy) return;
    setText('');
    const history = chat.slice(-8).map((m) => ({ role: m.who === 'me' ? 'user' : 'model', text: m.text }));
    update((n) => {
      n.chat = [...(n.chat || []), { who: 'me', text: question, at: Date.now() }].slice(-40);
      markStudy(n);
    });
    setBusy(true);
    let answer;
    let err = false;
    try {
      const r = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, topic, history }) });
      const j = await r.json().catch(() => ({}));
      answer = j.answer;
      if (!answer) {
        err = true;
        answer = j.error || 'Coach Mia is resting right now. Try again in a minute.';
      }
    } catch {
      err = true;
      answer = 'You seem to be offline. Try again when you have internet.';
    }
    setBusy(false);
    sfx(err ? 'wrong' : 'tap');
    update((n) => {
      n.chat = [...(n.chat || []), { who: 'mia', text: answer, at: Date.now(), err }].slice(-40);
    });
  };

  // Opened from a quiz: send that question right away.
  useEffect(() => {
    if (query?.q && !sentInitial.current) {
      sentInitial.current = true;
      send(query.q, query.topic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[calc(100dvh-180px)] flex-col">
      <div className="flex items-center justify-between">
        <span />
        {chat.length > 0 && (
          <button onClick={() => update((n) => void (n.chat = []))} className="mb-4 inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-black/5 dark:hover:bg-white/10">
            <Trash2 size={16} /> New chat
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Mia size={56} className={busy ? 'talking' : 'animate-float'} />
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Chat with Mia</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ask anything about the RBT exam. Simple answers.</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 pb-4">
        {chat.length === 0 && (
          <div className="glass animate-rise rounded-3xl p-5">
            <p className="text-[16px] leading-relaxed text-slate-700 dark:text-slate-200">Hi {s.name}! I know everything in your lessons. Ask me to explain something, give you an example, or quiz you. Try one of these:</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {IDEAS.map((x) => (
                <button key={x} onClick={() => send(x)} className="rounded-full bg-brand-600/10 px-3.5 py-2 text-left text-sm font-medium text-brand-700 transition active:scale-95 dark:text-violet-200">
                  {x}
                </button>
              ))}
            </div>
          </div>
        )}

        {chat.map((m, i) =>
          m.who === 'me' ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] animate-rise whitespace-pre-wrap rounded-3xl rounded-br-md bg-gradient-to-br from-brand-600 to-accent px-4 py-3 text-[16px] leading-snug text-white shadow-md">{m.text}</p>
            </div>
          ) : (
            <div key={i} className="flex items-end gap-2">
              <Mia size={34} className="mb-1 shrink-0" />
              <div className={cx('max-w-[85%] animate-rise rounded-3xl rounded-bl-md px-4 py-3 shadow-sm', m.err ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'glass text-slate-800 dark:text-slate-100')}>
                <p className="whitespace-pre-wrap text-[16px] leading-relaxed">{m.text}</p>
                {!m.err && <ListenButton text={m.text} className="mt-2 !h-9" />}
              </div>
            </div>
          )
        )}

        {busy && (
          <div className="flex items-end gap-2">
            <Mia size={34} className="talking mb-1 shrink-0" />
            <div className="glass flex items-center gap-2 rounded-3xl rounded-bl-md px-4 py-3 text-slate-500">
              <Loader2 size={16} className="animate-spin" /> Mia is thinking...
            </div>
          </div>
        )}
        <div ref={end} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="sticky bottom-[92px] z-10 flex gap-2 md:bottom-4"
      >
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type your question..."
          className="glass-strong max-h-32 min-h-[52px] flex-1 resize-none rounded-2xl border border-black/5 px-4 py-3.5 leading-snug shadow-lg outline-none focus:border-brand-400 dark:border-white/10"
        />
        <button type="submit" disabled={!text.trim() || busy} aria-label="Send" className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent text-white shadow-lg transition active:scale-95 disabled:opacity-40">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
