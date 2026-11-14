import { useEffect, useState } from 'react';
import { ChevronRight, RotateCw } from 'lucide-react';
import { useStore, markStudy, addXP, logInc } from '../store.jsx';
import { DOMAINS, DOMAIN } from '../data/domains.js';
import { FLASHCARDS, QUESTION, questionsByDomain } from '../data/content.js';
import { go, schedule, nextLabel, shuffle, celebrate, stopSpeaking } from '../lib.js';
import { XP, sfx } from '../fun.js';
import { Card, Button, PageTitle, ListenButton, BackButton, MiaSays, DomainChip, DomainBadge, Bar, Elephant, cx } from '../components/ui.jsx';

export function noteCards(s) {
  return s.notes.filter((n) => n.flash).map((n) => ({ id: `note-${n.id}`, d: n.d, front: n.title, back: n.text, note: true }));
}

function deckCards(deck, s) {
  if (deck === 'notes') return noteCards(s);
  const all = [...FLASHCARDS, ...noteCards(s)];
  return deck === 'all' ? all : all.filter((c) => c.d === deck);
}

const isDue = (s, c) => !s.srs[c.id] || s.srs[c.id].due <= Date.now();

function Row({ title, sub, onClick, big, right }) {
  return (
    <Card as="button" onClick={onClick} className={cx('tap flex w-full items-center gap-3 text-left', big ? '!bg-gradient-to-r from-brand-600 to-accent text-white' : '!p-4')}>
      <span className="min-w-0 flex-1">
        <span className={cx('block font-display font-semibold', big ? 'text-xl' : 'text-[17px] text-slate-900 dark:text-white')}>{title}</span>
        <span className={cx('block text-sm', big ? 'text-white/85' : 'text-slate-500 dark:text-slate-400')}>{sub}</span>
      </span>
      {right}
      <ChevronRight className={big ? '' : 'text-slate-400'} />
    </Card>
  );
}

export function Practice({ tab }) {
  if (tab === 'quizzes') return <Quizzes />;
  if (tab === 'flashcards') return <Decks />;
  if (tab === 'mistakes') return <Mistakes />;
  return <PracticeHub />;
}

function PracticeHub() {
  const { s } = useStore();
  const due = deckCards('all', s).filter((c) => isDue(s, c)).length;
  return (
    <div className="space-y-3">
      <PageTitle title="Practice" sub="Pick one. Short and sweet." />
      <Row big title="10 mixed questions" sub="All topics mixed, like the real exam" onClick={() => go('quiz/mixed')} />
      <Row title="Quiz by topic" sub="10 questions from one domain" onClick={() => go('practice/quizzes')} />
      <Row title="Flashcards" sub={`${due} cards ready to review`} onClick={() => go('practice/flashcards')} />
      <Row title="Games" sub="Learn while you play" onClick={() => go('games')} />
      <Row title="My mistakes" sub={`${s.mistakes.length} to fix · wins back hearts`} onClick={() => go('practice/mistakes')} />
      <Row title="Mock exam" sub="85 questions · 90 minutes" onClick={() => go('exam')} />
    </div>
  );
}

function Decks() {
  const { s } = useStore();
  const all = deckCards('all', s);
  const notes = noteCards(s);
  return (
    <div className="space-y-3">
      <BackButton onClick={() => go('practice')} label="Practice" />
      <PageTitle title="Flashcards" sub="Flip, then tell me how well you knew it" />
      <Row big title="Daily review" sub={`${all.filter((c) => isDue(s, c)).length} cards ready · all topics`} onClick={() => go('flash/all')} />
      <Row title="Type-the-answer mode" sub="Write the answer first, then check. Best for memory!" onClick={() => go('flash/all?type=1')} />
      {DOMAINS.map((d) => {
        const cards = deckCards(d.id, s);
        return (
          <Card key={d.id} as="button" onClick={() => go(`flash/${d.id}`)} className="tap flex w-full items-center gap-3 !p-4 text-left">
            <DomainBadge d={d} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold leading-tight text-slate-900 dark:text-white">{d.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {cards.length} cards · {cards.filter((c) => isDue(s, c)).length} ready
              </span>
            </span>
            <ChevronRight size={18} className="text-slate-400" />
          </Card>
        );
      })}
      <Row title="My notes" sub={notes.length ? `${notes.length} cards from your notes` : 'Turn your book notes into cards'} onClick={() => go(notes.length ? 'flash/notes' : 'notes')} />
    </div>
  );
}

function Quizzes() {
  const { s } = useStore();
  return (
    <div className="space-y-3">
      <BackButton onClick={() => go('practice')} label="Practice" />
      <PageTitle title="Quiz by topic" sub="10 questions. I'll explain every answer." />
      {DOMAINS.map((d) => {
        const qs = s.quizzes.filter((q) => q.d === d.id);
        const best = qs.length ? Math.max(...qs.map((q) => Math.round((q.score / q.total) * 100))) : null;
        return (
          <Card key={d.id} as="button" onClick={() => go(`quiz/${d.id}`)} className="tap flex w-full items-center gap-3 !p-4 text-left">
            <DomainBadge d={d} size={44} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold leading-tight text-slate-900 dark:text-white">{d.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {questionsByDomain(d.id).length} questions · {d.weight}% of exam
              </span>
              {best !== null && <Bar value={best} color={d.color} className="mt-2 !h-1.5" />}
            </span>
            <span className="shrink-0 text-right">
              {best !== null ? (
                <span className="font-display text-lg font-bold text-slate-900 dark:text-white">{best}%</span>
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
  return (
    <div className="space-y-4">
      <BackButton onClick={() => go('practice')} label="Practice" />
      <PageTitle title="My mistakes" sub="Answer one right and it leaves the list (and you win a heart back)." />
      <Card className="text-center">
        <p className="font-display text-5xl font-bold text-slate-900 dark:text-white">{list.length}</p>
        <p className="text-slate-500 dark:text-slate-400">to fix · {s.fixed} fixed so far</p>
        <Button className="mt-4 w-full sm:w-auto" disabled={!list.length} onClick={() => go('quiz/mistakes')}>
          <RotateCw size={18} /> Practice my mistakes
        </Button>
      </Card>
      <div className="space-y-3">
        {list.map((q) => (
          <Card key={q.id} className="!p-4">
            <DomainChip d={DOMAIN[q.d]} />
            <p className="mt-2 text-[15px] font-medium text-slate-800 dark:text-slate-100">{q.q}</p>
            <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">Answer: {q.o[q.a]}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

const GRADES = [
  { g: 0, label: 'Again', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-300' },
  { g: 1, label: 'Hard', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  { g: 2, label: 'Good', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  { g: 3, label: 'Easy', cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
];

export function FlashSession({ deck, query }) {
  const { s, update } = useStore();
  const typeMode = query?.type === '1';
  const title = deck === 'all' ? 'Daily review' : deck === 'notes' ? 'My notes' : DOMAIN[deck]?.name;
  const [queue, setQueue] = useState(() => {
    const cards = deckCards(deck, s);
    const seen = shuffle(cards.filter((c) => s.srs[c.id] && s.srs[c.id].due <= Date.now()));
    const freshCards = shuffle(cards.filter((c) => !s.srs[c.id])).slice(0, 15);
    return [...seen, ...freshCards].slice(0, typeMode ? 15 : 30);
  });
  const [flipped, setFlipped] = useState(false);
  const [typed, setTyped] = useState('');
  const [count, setCount] = useState(0);
  const card = queue[0];

  useEffect(() => stopSpeaking, []);
  useEffect(() => {
    if (!card && count > 0) {
      celebrate();
      sfx('win');
    }
  }, [card, count]);

  const grade = (g) => {
    update((n) => {
      n.srs = { ...n.srs, [card.id]: schedule(n.srs[card.id], g) };
      n.reviews += 1;
      addXP(n, XP.card);
      logInc(n, 'cards');
      markStudy(n);
    });
    sfx(g === 0 ? 'tap' : 'correct');
    setCount((c) => c + 1);
    setFlipped(false);
    setTyped('');
    stopSpeaking();
    setTimeout(() => setQueue((q) => (g === 0 ? [...q.slice(1), q[0]] : q.slice(1))), 120);
  };

  if (!card) {
    return (
      <div>
        <BackButton onClick={() => go('practice/flashcards')} />
        <Card className="text-center">
          <Elephant size={110} balloon={!!count} className="mx-auto animate-float" />
          <p className="mt-3 font-display text-xl font-semibold text-slate-900 dark:text-white">{count ? `Done! You reviewed ${count} cards.` : 'No cards ready right now'}</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{count ? `+${count * XP.card} XP. Come back tomorrow for the next round.` : 'Cards come back right before you forget them. Try a quiz or a game!'}</p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={() => go('quiz/mixed')}>Mixed questions</Button>
            <Button variant="soft" onClick={() => go('games')}>
              Play a game
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const domain = DOMAIN[card.d];

  return (
    <div>
      <BackButton onClick={() => go('practice/flashcards')} label="Decks" />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">{typeMode ? 'Type the answer' : title}</h1>
        <span className="text-sm font-semibold text-slate-400">
          {count} done · {queue.length} left
        </span>
      </div>

      {typeMode && !flipped ? (
        <Card className="mx-auto max-w-xl space-y-4">
          {domain && <DomainChip d={domain} />}
          <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{card.front}</p>
          <textarea
            autoFocus
            rows={3}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="What does it mean? Write it in your own words..."
            className="w-full rounded-2xl border border-black/5 bg-white/80 p-4 leading-relaxed outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5"
          />
          <Button className="w-full" onClick={() => setFlipped(true)}>
            Check my answer
          </Button>
        </Card>
      ) : typeMode ? (
        <Card className="mx-auto max-w-xl animate-pop space-y-3">
          <p className="font-display text-xl font-bold text-slate-900 dark:text-white">{card.front}</p>
          <div className="rounded-2xl bg-brand-600/[.07] p-4">
            <p className="label mb-1">You wrote</p>
            <p className="text-slate-700 dark:text-slate-200">{typed.trim() || '(nothing)'}</p>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-4">
            <p className="label mb-1 !text-emerald-600">Correct answer</p>
            <p className="font-medium text-slate-800 dark:text-slate-100">{card.back}</p>
          </div>
          <p className="text-center text-sm text-slate-500">Be honest: how close were you?</p>
        </Card>
      ) : (
        <div
          className={cx('flip mx-auto h-[360px] max-w-xl cursor-pointer select-none sm:h-[380px]', flipped && 'flipped')}
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          aria-label={flipped ? 'Show front' : 'Show answer'}
          onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), setFlipped((f) => !f))}
        >
          <div className="flip-inner">
            <div className="flip-face glass flex flex-col items-center justify-center rounded-3xl p-6 text-center">
              {domain && <DomainChip d={domain} className="absolute left-5 top-5" />}
              {card.note && <span className="absolute right-5 top-5 rounded-full bg-pink-500/10 px-2.5 py-1 text-xs font-bold text-pink-600">My note</span>}
              <p className="font-display text-2xl font-bold leading-snug text-slate-900 dark:text-white md:text-3xl">{card.front}</p>
              <p className="absolute bottom-5 text-sm text-slate-400">Tap to flip</p>
            </div>
            <div className="flip-face flip-back flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-brand-600 to-accent p-6 text-center text-white shadow-xl shadow-brand-600/25">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/70">{card.front}</p>
              <p className="max-h-[230px] overflow-y-auto whitespace-pre-wrap text-lg font-medium leading-relaxed md:text-xl">{card.back}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto mt-4 flex max-w-xl justify-center">
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
      {!flipped && !typeMode && <MiaSays className="mx-auto mt-3 max-w-xl">Think of the answer first, then flip the card.</MiaSays>}
    </div>
  );
}
