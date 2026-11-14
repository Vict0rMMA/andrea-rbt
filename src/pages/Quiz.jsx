import { useEffect, useMemo, useState } from 'react';
import { Check, X, ArrowRight, RotateCcw } from 'lucide-react';
import { useStore, recordAnswer } from '../store.jsx';
import { DOMAIN } from '../data/domains.js';
import { QUESTION, questionsByDomain } from '../data/content.js';
import { MOTIVATION } from '../data/content.js';
import { go, shuffle, celebrate, pick, stopSpeaking } from '../lib.js';
import { Card, Button, Ring, ListenButton, DomainChip, BackButton, MiaSays, Elephant, cx } from '../components/ui.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];

// Picks 10 questions: never-tried and previously-wrong first, then the rest.
function pickQuestions(mode, s) {
  if (mode === 'mistakes') return shuffle(s.mistakes.map((id) => QUESTION[id]).filter(Boolean)).slice(0, 10);
  const pool = questionsByDomain(mode);
  const score = (q) => {
    const a = s.answers[q.id];
    if (!a) return 0;
    return a.last ? 2 : 1;
  };
  const groups = [0, 1, 2].map((k) => shuffle(pool.filter((q) => score(q) === k)));
  const order = [...groups[0], ...groups[1], ...groups[2]];
  return shuffle(order.slice(0, 10));
}

export const withOrder = (q) => ({ ...q, order: shuffle([0, 1, 2, 3]) });

export function OptionList({ q, chosen, reveal, onChoose }) {
  return (
    <div className="space-y-2.5">
      {q.order.map((oi, pos) => {
        const isCorrect = oi === q.a;
        const isChosen = oi === chosen;
        const state = !reveal ? (isChosen ? 'chosen' : 'idle') : isCorrect ? 'correct' : isChosen ? 'wrong' : 'muted';
        return (
          <div key={oi}>
            <button
              disabled={reveal && !!onChoose}
              onClick={() => onChoose?.(oi)}
              className={cx(
                'flex w-full items-start gap-3 rounded-2xl border-2 p-3.5 text-left text-[15.5px] leading-snug transition active:scale-[.99]',
                state === 'idle' && 'border-transparent bg-white/70 hover:border-brand-400/60 dark:bg-white/5',
                state === 'chosen' && 'border-brand-600 bg-brand-600/10',
                state === 'correct' && 'animate-pop border-emerald-500 bg-emerald-500/10',
                state === 'wrong' && 'animate-shake border-rose-500 bg-rose-500/10',
                state === 'muted' && 'border-transparent bg-white/40 opacity-80 dark:bg-white/[.03]'
              )}
            >
              <span
                className={cx(
                  'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-bold',
                  state === 'correct' ? 'bg-emerald-500 text-white' : state === 'wrong' ? 'bg-rose-500 text-white' : state === 'chosen' ? 'bg-brand-600 text-white' : 'bg-brand-600/10 text-brand-700 dark:text-violet-200'
                )}
              >
                {state === 'correct' ? <Check size={16} /> : state === 'wrong' ? <X size={16} /> : LETTERS[pos]}
              </span>
              <span className="pt-0.5 text-slate-800 dark:text-slate-100">{q.o[oi]}</span>
            </button>
            {reveal && (
              <p className={cx('mt-1.5 animate-rise px-3 text-sm leading-snug', isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400')}>
                {isCorrect ? '✅ ' : '✖️ '}
                {q.w[oi]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function QuizRunner({ mode }) {
  const { s, update } = useStore();
  const isMistakes = mode === 'mistakes';
  const d = DOMAIN[mode];
  // Questions are chosen once when the quiz starts.
  const [qs] = useState(() => pickQuestions(mode, s).map(withOrder));
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [results, setResults] = useState([]);
  const done = results.length === qs.length && qs.length > 0 && chosen === null;

  useEffect(() => stopSpeaking, []);

  if (!d && !isMistakes) return <p>Quiz not found.</p>;

  if (qs.length === 0) {
    return (
      <div>
        <BackButton onClick={() => go('practice/mistakes')} />
        <Card className="text-center">
          <Elephant size={110} balloon className="mx-auto animate-float" />
          <p className="mt-3 font-display text-xl font-semibold text-slate-900 dark:text-white">Your mistakes bank is empty!</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Wrong answers from quizzes and mock exams will show up here.</p>
          <Button className="mt-5" onClick={() => go('practice/quizzes')}>
            Take a quiz
          </Button>
        </Card>
      </div>
    );
  }

  if (done) return <QuizResults qs={qs} results={results} d={d} mode={mode} />;

  const q = qs[i];
  const qd = DOMAIN[q.d];
  const reveal = chosen !== null;

  const choose = (oi) => {
    if (reveal) return;
    const ok = oi === q.a;
    setChosen(oi);
    update((n) => recordAnswer(n, q.id, ok));
  };

  const next = () => {
    const ok = chosen === q.a;
    const newResults = [...results, { id: q.id, ok, chosen }];
    setResults(newResults);
    setChosen(null);
    stopSpeaking();
    if (newResults.length === qs.length) {
      const score = newResults.filter((r) => r.ok).length;
      update((n) => {
        n.quizzes = [...n.quizzes, { d: isMistakes ? 'mistakes' : mode, score, total: qs.length, date: Date.now() }].slice(-200);
      });
      if (score / qs.length >= 0.8) setTimeout(() => celebrate(true), 150);
    } else {
      setI(i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const explanation = `${q.q} The correct answer is: ${q.o[q.a]}. ${q.w[q.a]}`;

  return (
    <div>
      <BackButton onClick={() => go('practice/quizzes')} label="Quit quiz" />
      <div className="mb-3 flex items-center justify-between">
        {isMistakes ? <span className="text-sm font-bold text-rose-500">Mistakes practice</span> : <DomainChip d={d} />}
        <span className="text-sm font-semibold text-slate-400">
          {i + 1} / {qs.length}
        </span>
      </div>
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-brand-600/10 dark:bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-fuchsia-400 transition-all duration-500" style={{ width: `${((i + (reveal ? 1 : 0)) / qs.length) * 100}%` }} />
      </div>

      <Card className="mb-4">
        {isMistakes && <DomainChip d={qd} className="mb-2" />}
        <p className="font-display text-lg font-semibold leading-snug text-slate-900 dark:text-white md:text-xl">{q.q}</p>
      </Card>

      <OptionList q={q} chosen={chosen} reveal={reveal} onChoose={choose} />

      {reveal && (
        <div className="sticky bottom-24 z-10 mt-5 flex animate-rise flex-wrap items-center gap-3 md:bottom-4">
          <div className={cx('glass-strong flex flex-1 items-center gap-2 rounded-2xl px-4 py-3 font-semibold shadow-lg', chosen === q.a ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            {chosen === q.a ? '🎉 Correct!' : '💡 Saved to your mistakes bank'}
          </div>
          <ListenButton text={explanation} label="Hear why" className="h-12" />
          <Button onClick={next} className="h-12">
            {i + 1 === qs.length ? 'See results' : 'Next'} <ArrowRight size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}

function QuizResults({ qs, results, d, mode }) {
  const score = results.filter((r) => r.ok).length;
  const pct = Math.round((score / qs.length) * 100);
  const msg = useMemo(() => pick(MOTIVATION), []);
  const missed = results.filter((r) => !r.ok);
  return (
    <div className="space-y-5">
      <Card className="flex flex-col items-center text-center">
        {pct >= 80 && <Elephant size={84} balloon className="mb-1 animate-float" />}
        <p className="label mb-3">{d ? d.name : 'Mistakes practice'}</p>
        <Ring value={pct} size={150}>
          <div>
            <p className="font-display text-4xl font-bold text-slate-900 dark:text-white">{pct}%</p>
            <p className="text-xs text-slate-400">
              {score}/{qs.length} correct
            </p>
          </div>
        </Ring>
        <p className="mt-4 font-display text-xl font-semibold text-slate-900 dark:text-white">
          {pct >= 90 ? 'Amazing work, Andrea! 🌟' : pct >= 80 ? 'You passed this one! 🎉' : pct >= 60 ? 'Getting there! 💪' : "Every mistake is a lesson 💜"}
        </p>
        <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button onClick={() => (window.location.hash = `/quiz/${mode}?${Date.now()}`)}>
            <RotateCcw size={18} /> New quiz
          </Button>
          <Button variant="soft" onClick={() => go('practice/quizzes')}>
            All quizzes
          </Button>
        </div>
      </Card>
      <MiaSays>{msg}</MiaSays>
      {missed.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-slate-900 dark:text-white">Review what you missed</h2>
          <div className="space-y-4">
            {missed.map((r) => {
              const q = qs.find((x) => x.id === r.id);
              return (
                <Card key={r.id}>
                  <p className="mb-3 font-semibold text-slate-900 dark:text-white">{q.q}</p>
                  <OptionList q={q} chosen={r.chosen} reveal />
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
