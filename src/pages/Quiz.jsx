import { useEffect, useMemo, useState } from 'react';
import { Check, X, ArrowRight, RotateCcw, Heart } from 'lucide-react';
import { useStore, recordAnswer, setConfidence, addXP, logInc, markStudy } from '../store.jsx';
import { DOMAIN, DOMAINS } from '../data/domains.js';
import { QUESTION, questionsByDomain } from '../data/content.js';
import { go, shuffle, celebrate, stopSpeaking } from '../lib.js';
import { feedback, say, sfx, XP } from '../fun.js';
import { Card, Button, Ring, ListenButton, DomainChip, BackButton, MiaSays, Elephant, Mia, cx } from '../components/ui.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];

// Picks questions: never-tried and previously-wrong first.
function prioritized(pool, s, n) {
  const score = (q) => (!s.answers[q.id] ? 0 : s.answers[q.id].last ? 2 : 1);
  const groups = [0, 1, 2].map((k) => shuffle(pool.filter((q) => score(q) === k)));
  return shuffle([...groups[0], ...groups[1], ...groups[2]].slice(0, n));
}

function pickQuestions(kind, d, s) {
  if (kind === 'mistakes') return shuffle(s.mistakes.map((id) => QUESTION[id]).filter(Boolean)).slice(0, 10);
  if (kind === 'mixed') {
    // Interleaved: questions from every domain, mixed together.
    const per = { A: 2, B: 1, C: 3, D: 2, E: 1, F: 1 };
    return shuffle(DOMAINS.flatMap((x) => prioritized(questionsByDomain(x.id), s, per[x.id])));
  }
  if (kind === 'boss') return shuffle(questionsByDomain(d)).slice(0, 15);
  if (kind === 'check') return shuffle(questionsByDomain(d)).slice(0, 3);
  return prioritized(questionsByDomain(d), s, 10);
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
                'flex w-full items-start gap-3 rounded-2xl border-2 p-3.5 text-left text-[16px] leading-snug transition active:scale-[.99]',
                state === 'idle' && 'border-transparent bg-white/75 hover:border-brand-400/60 dark:bg-white/5',
                state === 'chosen' && 'border-brand-600 bg-brand-600/10',
                state === 'correct' && 'animate-pop border-emerald-500 bg-emerald-500/10',
                state === 'wrong' && 'animate-shake border-rose-500 bg-rose-500/10',
                state === 'muted' && 'border-transparent bg-white/40 opacity-80 dark:bg-white/[.03]'
              )}
            >
              <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-bold', state === 'correct' ? 'bg-emerald-500 text-white' : state === 'wrong' ? 'bg-rose-500 text-white' : state === 'chosen' ? 'bg-brand-600 text-white' : 'bg-brand-600/10 text-brand-700 dark:text-violet-200')}>
                {state === 'correct' ? <Check size={16} /> : state === 'wrong' ? <X size={16} /> : LETTERS[pos]}
              </span>
              <span className="pt-0.5 text-slate-800 dark:text-slate-100">{q.o[oi]}</span>
            </button>
            {reveal && <p className={cx('mt-1.5 animate-rise px-3 text-sm leading-snug', isCorrect ? 'font-medium text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400')}>{q.w[oi]}</p>}
          </div>
        );
      })}
    </div>
  );
}

function Hearts({ n }) {
  return (
    <span className="flex items-center gap-0.5 text-rose-500" aria-label={`${n} hearts left`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Heart key={i} size={18} className={cx('transition', i < n ? 'fill-rose-500' : 'scale-75 opacity-25')} />
      ))}
    </span>
  );
}

export default function QuizRunner({ mode }) {
  const { s, update } = useStore();
  const [kind, d] = mode.startsWith('boss-') ? ['boss', mode.slice(5)] : mode.startsWith('check-') ? ['check', mode.slice(6)] : mode === 'mistakes' || mode === 'mixed' ? [mode, null] : ['domain', mode];
  const domain = DOMAIN[d];
  const usesHearts = kind === 'domain' || kind === 'mixed';
  const [qs] = useState(() => pickQuestions(kind, d, s).map(withOrder));
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [conf, setConf] = useState(null);
  const [results, setResults] = useState([]);
  const [combo, setCombo] = useState(0);
  const [msg, setMsg] = useState(null);
  const [ended, setEnded] = useState(false);
  const [hadHearts] = useState(() => s.hearts > 0);

  useEffect(() => stopSpeaking, []);

  const back = kind === 'boss' ? 'map' : kind === 'check' ? 'watch' : 'practice';
  if ((kind === 'domain' || kind === 'boss' || kind === 'check') && !domain) return <p>Quiz not found.</p>;

  if (!qs.length) {
    return (
      <div>
        <BackButton onClick={() => go('practice')} />
        <Card className="text-center">
          <Elephant size={110} balloon className="mx-auto animate-float" />
          <p className="mt-3 font-display text-xl font-semibold text-slate-900 dark:text-white">Your mistakes bank is empty!</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Wrong answers from quizzes and mock exams show up here.</p>
          <Button className="mt-5" onClick={() => go('quiz/mixed')}>
            Take a quiz
          </Button>
        </Card>
      </div>
    );
  }

  if (usesHearts && !hadHearts) {
    return (
      <div>
        <BackButton onClick={() => go('practice')} />
        <Card className="flex flex-col items-center text-center">
          <Mia size={100} mood="sad" />
          <p className="mt-3 font-display text-xl font-semibold text-slate-900 dark:text-white">Out of hearts!</p>
          <p className="mt-1 max-w-sm text-slate-500 dark:text-slate-400">Fix questions from your mistakes bank to win hearts back (1 heart each). Hearts also refill every day.</p>
          <Button className="mt-5" disabled={!s.mistakes.length} onClick={() => go('quiz/mistakes')}>
            Review my mistakes
          </Button>
          <Button variant="ghost" className="mt-2" onClick={() => go('flash/all')}>
            Study flashcards instead
          </Button>
        </Card>
      </div>
    );
  }

  if (ended) return <QuizResults qs={qs} results={results} kind={kind} domain={domain} mode={mode} outOfHearts={usesHearts && s.hearts <= 0} />;

  const q = qs[i];
  const reveal = chosen !== null;
  const right = results.filter((r) => r.ok).length + (reveal && chosen === q.a ? 1 : 0);

  const choose = (oi) => {
    if (reveal) return;
    const ok = oi === q.a;
    setChosen(oi);
    feedback(ok);
    const nextCombo = ok ? combo + 1 : 0;
    setCombo(nextCombo);
    setMsg(ok ? (nextCombo >= 3 ? say('streak') : say('correct')) : say('wrong'));
    if (ok && nextCombo >= 3) sfx('combo');
    update((n) => {
      recordAnswer(n, q.id, ok);
      if (!ok && usesHearts) n.hearts = Math.max(0, n.hearts - 1);
      if (ok && kind === 'mistakes') n.hearts = Math.min(5, n.hearts + 1);
    });
  };

  const rate = (c) => {
    setConf(c);
    update((n) => setConfidence(n, q.id, c));
  };

  const finish = (all) => {
    const score = all.filter((r) => r.ok).length;
    update((n) => {
      n.quizzes = [...n.quizzes, { d: kind === 'domain' ? d : kind, score, total: all.length, date: Date.now() }].slice(-300);
      addXP(n, XP.quiz);
      if (kind === 'mixed') logInc(n, 'mixed');
      if (kind === 'boss' && score >= 12) {
        n.bosses = { ...n.bosses, [d]: n.bosses[d] || Date.now() };
        addXP(n, XP.boss);
      }
      markStudy(n);
    });
    if (score / all.length >= 0.8) setTimeout(() => celebrate(true), 150);
    setEnded(true);
  };

  const next = () => {
    const all = [...results, { id: q.id, ok: chosen === q.a, chosen }];
    setResults(all);
    setChosen(null);
    setConf(null);
    setMsg(null);
    stopSpeaking();
    if (all.length === qs.length || (usesHearts && s.hearts <= 0)) finish(all);
    else {
      setI(i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const title = kind === 'mistakes' ? 'Mistakes practice' : kind === 'mixed' ? 'Mixed questions' : kind === 'check' ? 'Quick check' : kind === 'boss' ? `Boss Battle · ${domain.short}` : null;
  const bossHp = kind === 'boss' ? Math.max(0, 12 - right) : 0;

  return (
    <div>
      <BackButton onClick={() => go(back)} label="Quit" />
      <div className="mb-3 flex items-center justify-between gap-3">
        {title ? <span className="text-sm font-bold text-brand-600 dark:text-violet-300">{title}</span> : <DomainChip d={domain} />}
        <span className="flex items-center gap-3">
          {usesHearts && <Hearts n={s.hearts} />}
          <span className="text-sm font-semibold text-slate-400">
            {i + 1}/{qs.length}
          </span>
        </span>
      </div>

      {kind === 'boss' ? (
        <Card className="mb-4 flex items-center gap-3 !p-3">
          <span className="font-display text-sm font-bold text-rose-500">BOSS</span>
          <div className="flex-1">
            <div className="h-3 overflow-hidden rounded-full bg-rose-500/15">
              <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-500" style={{ width: `${(bossHp / 12) * 100}%` }} />
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">{bossHp} HP</span>
        </Card>
      ) : (
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-brand-600/10 dark:bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-accent transition-all duration-500" style={{ width: `${((i + (reveal ? 1 : 0)) / qs.length) * 100}%` }} />
        </div>
      )}

      <Card className="mb-4">
        {kind !== 'domain' && kind !== 'boss' && kind !== 'check' && <DomainChip d={DOMAIN[q.d]} className="mb-2" />}
        <p className="font-display text-lg font-semibold leading-snug text-slate-900 dark:text-white md:text-xl">{q.q}</p>
        {combo >= 2 && !reveal && <p className="mt-2 text-sm font-bold text-orange-500">Combo x{combo}</p>}
      </Card>

      <OptionList q={q} chosen={chosen} reveal={reveal} onChoose={choose} />

      {reveal && (
        <div className="mt-5 animate-rise space-y-3">
          <MiaSays mood={chosen === q.a ? (combo >= 3 ? 'proud' : 'happy') : 'sad'}>{msg}</MiaSays>
          <div className="glass rounded-2xl p-3">
            <p className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">How sure were you?</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                [1, 'I guessed'],
                [2, 'Kind of'],
                [3, 'Very sure'],
              ].map(([v, label]) => (
                <button key={v} onClick={() => rate(v)} className={cx('h-11 rounded-xl text-sm font-semibold transition', conf === v ? 'bg-brand-600 text-white' : 'bg-brand-600/10 text-brand-700 dark:text-violet-200')}>
                  {label}
                </button>
              ))}
            </div>
            {conf === 1 && <p className="mt-2 text-xs text-slate-500">Saved to review soon.</p>}
          </div>
          <div className="sticky bottom-24 z-10 flex gap-2 md:bottom-4">
            <ListenButton text={`${q.q} The correct answer is: ${q.o[q.a]}. ${q.w[q.a]}`} label="Hear why" size="md" />
            <Button onClick={next} className="flex-1" size="md">
              {i + 1 === qs.length || (usesHearts && s.hearts <= 0) ? 'See results' : 'Next'} <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizResults({ qs, results, kind, domain, mode, outOfHearts }) {
  const score = results.filter((r) => r.ok).length;
  const pct = Math.round((score / results.length) * 100);
  const missed = results.filter((r) => !r.ok);
  const bossWon = kind === 'boss' && score >= 12;
  const message =
    kind === 'boss'
      ? bossWon
        ? 'Boss defeated! The next stop on your road is unlocked.'
        : 'The boss survived this time. Review and try again!'
      : outOfHearts
        ? 'Out of hearts! Review your mistakes to win them back.'
        : pct >= 90
          ? 'Amazing work, Andrea!'
          : pct >= 80
            ? 'You passed this one!'
            : pct >= 60
              ? 'Getting there!'
              : 'Every mistake is a lesson.';
  return (
    <div className="space-y-5">
      <Card className="flex flex-col items-center text-center">
        <Mia size={90} mood={pct >= 80 || bossWon ? 'proud' : pct >= 60 ? 'happy' : 'cheer'} className="mb-2 animate-pop" />
        <Ring value={pct} size={140}>
          <div>
            <p className="font-display text-4xl font-bold text-slate-900 dark:text-white">{pct}%</p>
            <p className="text-xs text-slate-400">
              {score}/{results.length} correct
            </p>
          </div>
        </Ring>
        <p className="mt-4 font-display text-xl font-semibold text-slate-900 dark:text-white">{message}</p>
        <p className="mt-1 text-sm font-semibold text-brand-600 dark:text-violet-300">+{score * XP.correct + XP.quiz + (bossWon ? XP.boss : 0)} XP</p>
        <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {kind === 'check' ? (
            <Button onClick={() => go('watch')}>Back to videos</Button>
          ) : (
            <Button onClick={() => (window.location.hash = `/quiz/${mode}?${Date.now()}`)}>
              <RotateCcw size={18} /> {kind === 'boss' ? 'Fight again' : 'New quiz'}
            </Button>
          )}
          <Button variant="soft" onClick={() => go(kind === 'boss' ? 'map' : 'practice')}>
            {kind === 'boss' ? 'Road to RBT' : 'Practice'}
          </Button>
        </div>
      </Card>
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

