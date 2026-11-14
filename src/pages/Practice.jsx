import { useEffect, useMemo, useState } from 'react';
import { Layers, ListChecks, AlertCircle, ChevronRight, RotateCw, NotebookPen } from 'lucide-react';
import { useStore, markStudy } from '../store.jsx';
import { DOMAINS, DOMAIN } from '../data/domains.js';
import { FLASHCARDS, QUESTION, questionsByDomain } from '../data/content.js';
import { go, schedule, nextLabel, shuffle, celebrate, stopSpeaking } from '../lib.js';
import { Card, Button, PageTitle, ListenButton, BackButton, MiaSays, DomainChip, Bar, Elephant, cx } from '../components/ui.jsx';

const TABS = [
  { id: 'flashcards', label: 'Flashcards', Icon: Layers },
  { id: 'quizzes', label: 'Quizzes', Icon: ListChecks },
  { id: 'mistakes', label: 'Mistakes', Icon: AlertCircle },
];

export function noteCards(s) {
  return s.notes.filter((n) => n.flash).map((n) => ({ id: `note-${n.id}`, d: n.d, front: n.title, back: n.text, note: true }));
}

function deckCards(deck, s) {
  if (deck === 'notes') return noteCards(s);
  const all = [...FLASHCARDS, ...noteCards(s)];
  return deck === 'all' ? all : all.filter((c) => c.d === deck);
}

const isDue = (s, c) => !s.srs[c.id] || s.srs[c.id].due <= Date.now();

export function Practice({ tab = 'flashcards' }) {
  const current = TABS.some((t) => t.id === tab) ? tab : 'flashcards';
  return (
    <div>
      <PageTitle title="Practice" sub="Flashcards, quizzes and your mistakes bank" />
      <div className="glass mb-5 flex gap-1 rounded-2xl p-1.5" role="tablist">
        {TABS.map(({ id, label, Icon }) => (
          <a
            key={id}
            role="tab"
            aria-selected={current === id}
            href={`#/practice/${id}`}
            className={cx(
              'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition',
              current === id ? 'bg-gradient-to-r from-brand-600 to-fuchsia-500 text-white shadow' : 'text-slate-600 hover:bg-brand-600/10 dark:text-slate-300'
            )}
          >
            <Icon size={17} /> {label}
          </a>
        ))}
      </div>
      {current === 'flashcards' && <Decks />}
      {current === 'quizzes' && <Quizzes />}
      {current === 'mistakes' && <Mistakes />}
    </div>
  );
}

function Decks() {
  const { s } = useStore();
  const all = deckCards('all', s);
  const dueAll = all.filter((c) => isDue(s, c)).length;
  const notes = noteCards(s);
  return (
    <div className="space-y-4">
      <Card as="button" onClick={() => go('flash/all')} className="tap flex w-full items-center gap-4 !bg-gradient-to-r from-brand-600 to-fuchsia-500 text-left text-white">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20">
          <Layers size={24} />
        </span>
        <span className="flex-1">
          <span className="block font-display text-lg font-semibold">Daily review</span>
          <span className="text-sm text-white/80">
            {dueAll} cards ready · all domains
          </span>
        </span>
        <ChevronRight />
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {DOMAINS.map((d) => {
          const cards = deckCards(d.id, s);
          const due = cards.filter((c) => isDue(s, c)).length;
          return (
            <Card key={d.id} as="button" onClick={() => go(`flash/${d.id}`)} className="tap flex items-center gap-3 !p-4 text-left">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl" style={{ background: d.soft }}>
                {d.emoji}
              </span>
              <span className="flex-1">
                <span className="block font-semibold leading-tight text-slate-900 dark:text-white">{d.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {cards.length} cards · {due} due
                </span>
              </span>
              <ChevronRight size={18} className="text-slate-400" />
            </Card>
          );
        })}
        <Card as="button" onClick={() => (notes.length ? go('flash/notes') : go('notes'))} className="tap flex items-center gap-3 !p-4 text-left">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-pink-500/10 text-pink-600">
            <NotebookPen size={20} />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-slate-900 dark:text-white">My notes</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{notes.length ? `${notes.length} cards from your notes` : 'Turn your book notes into cards'}</span>
          </span>
          <ChevronRight size={18} className="text-slate-400" />
        </Card>
      </div>
    </div>
  );
}

function Quizzes() {
  const { s } = useStore();
  return (
    <div className="space-y-3">
      <MiaSays className="mb-2">10 questions per quiz. I'll tell you why each answer is right or wrong. 🧠</MiaSays>
      {DOMAINS.map((d) => {
        const qs = s.quizzes.filter((q) => q.d === d.id);
        const best = qs.length ? Math.max(...qs.map((q) => Math.round((q.score / q.total) * 100))) : null;
        return (
          <Card key={d.id} as="button" onClick={() => go(`quiz/${d.id}`)} className="tap flex w-full items-center gap-3 !p-4 text-left">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: d.soft }}>
              {d.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold leading-tight text-slate-900 dark:text-white">
                {d.id}. {d.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {questionsByDomain(d.id).length} questions in bank · {d.weight}% of exam
              </span>
              {best !== null && <Bar value={best} color={d.color} className="mt-2 !h-1.5" />}
            </span>
            <span className="shrink-0 text-right">
              {best !== null ? (
                <>
                  <span className="block font-display text-lg font-bold text-slate-900 dark:text-white">{best}%</span>
                  <span className="text-[11px] text-slate-400">best</span>
                </>
              ) : (
                <span className="rounded-full bg-brand-600/10 px-3 py-1 text-xs font-bold text-brand-700 dark:text-violet-200">Start</span>
              )}
            </span>
          </Card>
        );
      })}
    </div>
  );
}

function Mistakes() {
  const { s } = useStore();
  const list = s.mistakes.map((id) => QUESTION[id]).filter(Boolean);
  const byD = DOMAINS.map((d) => ({ d, n: list.filter((q) => q.d === d.id).length }));
  return (
    <div className="space-y-4">
      <Card className="text-center">
        <p className="font-display text-5xl font-bold text-slate-900 dark:text-white">{list.length}</p>
        <p className="text-slate-500 dark:text-slate-400">questions to fix · {s.fixed} fixed so far</p>
        <Button className="mt-4 w-full sm:w-auto" disabled={!list.length} onClick={() => go('quiz/mistakes')}>
          <RotateCw size={18} /> Practice my mistakes
        </Button>
        <p className="mt-2 text-xs text-slate-400">Answer one correctly and it leaves the bank.</p>
      </Card>
      {list.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {byD.map(({ d, n }) => (
              <div key={d.id} className="glass rounded-2xl p-3 text-center">
                <p className="text-lg">{d.emoji}</p>
                <p className="font-display text-xl font-bold text-slate-900 dark:text-white">{n}</p>
                <p className="text-[11px] text-slate-400">Domain {d.id}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {list.map((q) => (
              <Card key={q.id} className="!p-4">
                <DomainChip d={DOMAIN[q.d]} />
                <p className="mt-2 text-[15px] font-medium text-slate-800 dark:text-slate-100">{q.q}</p>
                <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">✅ {q.o[q.a]}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const GRADES = [
  { g: 0, label: 'Again', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-300' },
  { g: 1, label: 'Hard', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  { g: 2, label: 'Good', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  { g: 3, label: 'Easy', cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
];

export function FlashSession({ deck }) {
  const { s, update } = useStore();
  const title = deck === 'all' ? 'Daily review' : deck === 'notes' ? 'My notes' : DOMAIN[deck]?.name;
  // Build the queue once: due cards first, then up to 15 new ones.
  const [queue, setQueue] = useState(() => {
    const cards = deckCards(deck, s);
    const seen = shuffle(cards.filter((c) => s.srs[c.id] && s.srs[c.id].due <= Date.now()));
    const fresh = shuffle(cards.filter((c) => !s.srs[c.id])).slice(0, 15);
    let q = [...seen, ...fresh].slice(0, 30);
    if (!q.length) q = []; // nothing due
    return q;
  });
  const [flipped, setFlipped] = useState(false);
  const [count, setCount] = useState(0);
  const card = queue[0];

  useEffect(() => stopSpeaking, []);
  useEffect(() => {
    if (!card && count > 0) celebrate();
  }, [card, count]);

  const grade = (g) => {
    update((n) => {
      n.srs = { ...n.srs, [card.id]: schedule(n.srs[card.id], g) };
      n.reviews += 1;
      markStudy(n);
    });
    setCount((c) => c + 1);
    setFlipped(false);
    stopSpeaking();
    setTimeout(() => setQueue((q) => (g === 0 ? [...q.slice(1), q[0]] : q.slice(1))), 120);
  };

  const domain = card ? DOMAIN[card.d] : null;
  const progress = useMemo(() => count, [count]);

  if (!card) {
    return (
      <div>
        <BackButton onClick={() => go('practice/flashcards')} />
        <Card className="text-center">
          <Elephant size={110} balloon={!!count} className="mx-auto animate-float" />
          <p className="mt-3 font-display text-xl font-semibold text-slate-900 dark:text-white">{count ? `Done! You reviewed ${count} cards.` : 'No cards due right now'}</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{count ? 'Your brain thanks you. Come back tomorrow for the next round.' : 'Spaced repetition shows cards right before you forget them. Try another deck or a quiz!'}</p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={() => go('practice/quizzes')}>Take a quiz</Button>
            <Button variant="soft" onClick={() => go('practice/flashcards')}>
              Other decks
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <BackButton onClick={() => go('practice/flashcards')} label="Decks" />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <span className="text-sm font-semibold text-slate-400">
          {progress} done · {queue.length} left
        </span>
      </div>

      <div className={cx('flip mx-auto h-[360px] max-w-xl cursor-pointer select-none sm:h-[380px]', flipped && 'flipped')} onClick={() => setFlipped((f) => !f)} role="button" tabIndex={0} aria-label={flipped ? 'Show front' : 'Show answer'} onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), setFlipped((f) => !f))}>
        <div className="flip-inner">
          <div className="flip-face glass flex flex-col items-center justify-center rounded-3xl p-6 text-center">
            {domain && <DomainChip d={domain} className="absolute left-5 top-5" />}
            {card.note && <span className="absolute right-5 top-5 rounded-full bg-pink-500/10 px-2.5 py-1 text-xs font-bold text-pink-600">My note</span>}
            <p className="font-display text-2xl font-bold leading-snug text-slate-900 dark:text-white md:text-3xl">{card.front}</p>
            <p className="absolute bottom-5 text-sm text-slate-400">Tap to flip ↻</p>
          </div>
          <div className="flip-face flip-back flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-brand-600 to-fuchsia-500 p-6 text-center text-white shadow-xl shadow-brand-600/25">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/70">{card.front}</p>
            <p className="max-h-[230px] overflow-y-auto whitespace-pre-wrap text-lg font-medium leading-relaxed md:text-xl">{card.back}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-xl justify-center" onClick={(e) => e.stopPropagation()}>
        <ListenButton text={`${card.front}. ${card.back}`} />
      </div>

      <div className={cx('mx-auto mt-4 grid max-w-xl grid-cols-4 gap-2 transition', flipped ? 'opacity-100' : 'pointer-events-none opacity-0')}>
        {GRADES.map(({ g, label, cls }) => (
          <button key={g} onClick={() => grade(g)} className={cx('flex h-16 flex-col items-center justify-center rounded-2xl font-semibold transition active:scale-95', cls)}>
            {label}
            <span className="text-[11px] font-medium opacity-70">{nextLabel(s.srs[card.id], g)}</span>
          </button>
        ))}
      </div>
      {!flipped && <p className="mt-2 text-center text-sm text-slate-400">Think of the answer, then flip the card.</p>}
    </div>
  );
}
