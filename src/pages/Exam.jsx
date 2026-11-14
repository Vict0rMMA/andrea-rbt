import { useEffect, useMemo, useState } from 'react';
import { Timer, Flag, ChevronLeft, ChevronRight, Grid3x3, Play, Trophy, Clock, X } from 'lucide-react';
import { useStore, recordAnswer, addXP, markStudy } from '../store.jsx';
import { XP } from '../fun.js';
import { DOMAINS, DOMAIN, EXAM_PLAN, EXAM_MINUTES, PASS_TARGET } from '../data/domains.js';
import { QUESTION, questionsByDomain } from '../data/content.js';
import { go, shuffle, celebrate } from '../lib.js';
import { Card, Button, PageTitle, Ring, Bar, MiaSays, BackButton, DomainChip, Elephant, Modal, cx } from '../components/ui.jsx';
import { OptionList } from './Quiz.jsx';

function buildExam() {
  const items = [];
  for (const [d, n] of Object.entries(EXAM_PLAN)) {
    for (const q of shuffle(questionsByDomain(d)).slice(0, n)) items.push({ id: q.id, order: shuffle([0, 1, 2, 3]) });
  }
  const list = shuffle(items);
  // 10 random items are "unscored pilot" questions, like the real exam (she won't know which).
  const pilot = shuffle(list.map((x) => x.id)).slice(0, 10);
  return { items: list, pilot, answers: {}, flags: {}, idx: 0, end: Date.now() + EXAM_MINUTES * 60000, start: Date.now() };
}

export function Exam() {
  const { s, update } = useStore();
  const inProgress = s.exam && s.exam.end > Date.now();
  const best = s.exams.length ? Math.max(...s.exams.map((e) => e.pct)) : null;

  const start = () => {
    update((n) => void (n.exam = buildExam()));
    go('exam/run');
  };

  return (
    <div className="space-y-5">
      <PageTitle title="Mock Exam" sub="Just like the real 2026 BACB RBT exam" />
      <Card className="overflow-hidden !p-0">
        <div className="bg-gradient-to-br from-brand-600 via-violet-500 to-accent p-6 text-white">
          <div className="flex items-start justify-between"><Trophy size={32} className="mb-3" /><Elephant size={70} balloon className="-mt-2 animate-float" /></div>
          <p className="font-display text-2xl font-bold">Full practice exam</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white/20 px-3 py-1">85 questions</span>
            <span className="rounded-full bg-white/20 px-3 py-1">75 scored + 10 pilot</span>
            <span className="rounded-full bg-white/20 px-3 py-1">90 minutes</span>
            <span className="rounded-full bg-white/20 px-3 py-1">Goal ≥ {PASS_TARGET}%</span>
          </div>
        </div>
        <div className="space-y-3 p-5">
          {DOMAINS.map((d) => (
            <div key={d.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-200">
                {d.id}. {d.name}
              </span>
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {EXAM_PLAN[d.id]} Q · {d.weight}%
              </span>
            </div>
          ))}
          <div className="flex flex-col gap-2 pt-3 sm:flex-row">
            {inProgress && (
              <Button className="flex-1" onClick={() => go('exam/run')}>
                <Play size={18} /> Resume exam
              </Button>
            )}
            <Button className="flex-1" variant={inProgress ? 'soft' : 'primary'} onClick={start}>
              <Timer size={18} /> {inProgress ? 'Start over' : 'Start mock exam'}
            </Button>
          </div>
        </div>
      </Card>

      <MiaSays>
        Tips: read the LAST line of the question first ("What should the RBT do FIRST?"). Cross out answers where the RBT changes the plan or acts outside her role. Flag hard ones and come back!
      </MiaSays>

      {s.exams.length > 0 && (
        <Card>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Your attempts</h2>
            <span className="text-sm text-slate-400">Best: {best}%</span>
          </div>
          <div className="space-y-2">
            {[...s.exams].reverse().slice(0, 8).map((e, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/50 p-3 dark:bg-white/5">
                <span className={cx('grid h-10 w-12 place-items-center rounded-xl text-xs font-bold', e.passed ? 'bg-emerald-500/15' : 'bg-rose-500/10')}>{e.passed ? 'Pass' : 'Try'}</span>
                <span className="flex-1 text-sm">
                  <span className="block font-semibold text-slate-800 dark:text-slate-100">{e.pct}% {e.passed ? '· Pass' : '· Keep going'}</span>
                  <span className="text-slate-400">
                    {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {e.correct}/{e.total} scored correct · {e.minutes} min
                  </span>
                </span>
              </div>
            ))}
          </div>
          {s.lastExam && (
            <Button variant="soft" size="sm" className="mt-4" onClick={() => go('exam/results')}>
              Review last exam
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

function useCountdown(end) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, end - now);
}

function finishExam(n) {
  const ex = n.exam;
  const byDomain = {};
  let correct = 0;
  let total = 0;
  for (const it of ex.items) {
    const q = QUESTION[it.id];
    const chosen = ex.answers[it.id];
    const ok = chosen === q.a;
    if (chosen !== undefined) recordAnswer(n, it.id, ok);
    else if (!n.mistakes.includes(it.id)) n.mistakes = [...n.mistakes, it.id];
    if (ex.pilot.includes(it.id)) continue;
    byDomain[q.d] = byDomain[q.d] || { c: 0, t: 0 };
    byDomain[q.d].t += 1;
    total += 1;
    if (ok) {
      byDomain[q.d].c += 1;
      correct += 1;
    }
  }
  const pct = Math.round((correct / total) * 100);
  const minutes = Math.max(1, Math.round((Math.min(Date.now(), ex.end) - ex.start) / 60000));
  const result = { date: Date.now(), pct, correct, total, byDomain, passed: pct >= PASS_TARGET, minutes };
  n.exams = [...n.exams, result].slice(-50);
  n.lastExam = { ...result, items: ex.items, answers: ex.answers, pilot: ex.pilot };
  addXP(n, XP.exam);
  markStudy(n);
  n.exam = null;
}

export function ExamRunner() {
  const { s, update } = useStore();
  const ex = s.exam;
  const left = useCountdown(ex?.end || 0);
  const [grid, setGrid] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const submit = () => {
    update(finishExam);
    go('exam/results');
  };

  useEffect(() => {
    if (ex && left === 0) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left === 0, !!ex]);

  if (!ex) {
    return (
      <div>
        <BackButton onClick={() => go('exam')} />
        <Card className="text-center">
          <p className="text-slate-600 dark:text-slate-300">No exam in progress.</p>
          <Button className="mt-4" onClick={() => go('exam')}>
            Go to mock exam
          </Button>
        </Card>
      </div>
    );
  }

  const idx = ex.idx;
  const it = ex.items[idx];
  const q = { ...QUESTION[it.id], order: it.order };
  const answered = Object.keys(ex.answers).length;
  const mm = Math.floor(left / 60000);
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
  const low = left < 5 * 60000;

  const setIdx = (i) => update((n) => void (n.exam.idx = Math.max(0, Math.min(n.exam.items.length - 1, i))));
  const choose = (oi) => update((n) => void (n.exam.answers = { ...n.exam.answers, [it.id]: oi }));
  const flag = () => update((n) => void (n.exam.flags = { ...n.exam.flags, [it.id]: !n.exam.flags[it.id] }));

  return (
    <div className="pb-6">
      {/* Top bar */}
      <div className="glass-strong sticky top-[calc(env(safe-area-inset-top)+8px)] z-20 mb-5 flex items-center gap-3 rounded-2xl px-3 py-2 shadow-lg">
        <button onClick={() => go('exam')} aria-label="Leave exam (progress is saved)" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-black/5 dark:hover:bg-white/10">
          <X size={20} />
        </button>
        <div className={cx('flex items-center gap-1.5 font-display text-lg font-bold tabular-nums', low ? 'text-rose-500' : 'text-slate-900 dark:text-white')}>
          <Clock size={18} /> {mm}:{ss}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="mr-1 hidden text-sm font-semibold text-slate-400 sm:block">{answered}/85 answered</span>
          <button onClick={() => setGrid(true)} aria-label="Question map" className="grid h-10 w-10 place-items-center rounded-xl text-brand-600 hover:bg-brand-600/10 dark:text-violet-300">
            <Grid3x3 size={20} />
          </button>
          <Button size="sm" onClick={() => setConfirm(true)}>
            Submit
          </Button>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-400">Question {idx + 1} of 85</span>
        <button onClick={flag} className={cx('inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition', ex.flags[it.id] ? 'bg-amber-500/15 text-amber-600' : 'text-slate-400 hover:bg-black/5 dark:hover:bg-white/10')}>
          <Flag size={16} fill={ex.flags[it.id] ? 'currentColor' : 'none'} /> {ex.flags[it.id] ? 'Flagged' : 'Flag'}
        </button>
      </div>
      <Bar value={(answered / 85) * 100} className="mb-5 !h-1.5" />

      <Card className="mb-4" key={it.id}>
        <p className="font-display text-lg font-semibold leading-snug text-slate-900 dark:text-white md:text-xl">{q.q}</p>
      </Card>
      <OptionList q={q} chosen={ex.answers[it.id]} reveal={false} onChoose={choose} />

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="soft" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
          <ChevronLeft size={18} /> Back
        </Button>
        {idx < 84 ? (
          <Button onClick={() => setIdx(idx + 1)}>
            Next <ChevronRight size={18} />
          </Button>
        ) : (
          <Button onClick={() => setConfirm(true)}>Finish exam</Button>
        )}
      </div>

      {grid && (
        <Modal onClose={() => setGrid(false)} title="Question map">
          <div className="mb-3 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-brand-600" /> Answered</span>
            <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-amber-400" /> Flagged</span>
            <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-brand-600/15" /> Blank</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10">
            {ex.items.map((x, i) => (
              <button
                key={x.id}
                onClick={() => {
                  setIdx(i);
                  setGrid(false);
                }}
                className={cx(
                  'h-10 rounded-lg text-sm font-semibold transition active:scale-95',
                  ex.flags[x.id] ? 'bg-amber-400 text-white' : ex.answers[x.id] !== undefined ? 'bg-brand-600 text-white' : 'bg-brand-600/10 text-slate-600 dark:text-slate-300',
                  i === idx && 'ring-2 ring-accent ring-offset-2 ring-offset-transparent'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal onClose={() => setConfirm(false)} title="Submit your exam?">
          <p className="text-slate-600 dark:text-slate-300">
            You answered <b>{answered}</b> of 85 questions.
            {answered < 85 && ` ${85 - answered} are still blank. Blank answers count as wrong.`}
            {Object.values(ex.flags).filter(Boolean).length > 0 && ` You have ${Object.values(ex.flags).filter(Boolean).length} flagged.`}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
            <Button className="flex-1" onClick={submit}>
              Submit exam
            </Button>
            <Button className="flex-1" variant="soft" onClick={() => setConfirm(false)}>
              Keep working
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function ExamResults() {
  const { s } = useStore();
  const r = s.lastExam;
  const [filter, setFilter] = useState('wrong');
  const [dom, setDom] = useState('all');
  useEffect(() => {
    if (r?.passed && Date.now() - r.date < 10000) celebrate(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const review = useMemo(() => {
    if (!r) return [];
    return r.items
      .map((it, i) => ({ ...QUESTION[it.id], order: it.order, n: i + 1, chosen: r.answers[it.id] }))
      .filter((q) => (filter === 'wrong' ? q.chosen !== q.a : true) && (dom === 'all' || q.d === dom));
  }, [r, filter, dom]);

  if (!r) {
    return (
      <div>
        <BackButton onClick={() => go('exam')} />
        <Card>No results yet.</Card>
      </div>
    );
  }

  const weakest = DOMAINS.map((d) => ({ d, p: r.byDomain[d.id] ? r.byDomain[d.id].c / r.byDomain[d.id].t : 0 })).sort((a, b) => a.p - b.p)[0];

  return (
    <div className="space-y-5">
      <BackButton onClick={() => go('exam')} label="Mock exam" />
      <Card className="flex flex-col items-center text-center">
        {r.passed && <Elephant size={100} balloon className="mb-2 animate-float" />}
        <span className={cx('mb-3 rounded-full px-4 py-1.5 text-sm font-bold', r.passed ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300')}>
          {r.passed ? 'Likely PASS' : 'Not yet, keep studying'}
        </span>
        <Ring value={r.pct} size={170} stroke={15}>
          <div>
            <p className="font-display text-4xl font-bold text-slate-900 dark:text-white">{r.pct}%</p>
            <p className="text-xs text-slate-400">
              {r.correct}/{r.total} scored
            </p>
          </div>
        </Ring>
        <p className="mt-4 max-w-md font-display text-xl font-semibold text-slate-900 dark:text-white">
          {r.passed ? 'You did it, Andrea! You\'re ready for the real thing!' : `So close! Target is ${PASS_TARGET}%. Focus on ${weakest.d.name}.`}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Finished in {r.minutes} min · 10 pilot questions were not scored
        </p>
        {!r.passed && (
          <Button className="mt-4" onClick={() => go(`quiz/${weakest.d.id}`)}>
            Practice {weakest.d.short}
          </Button>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-slate-900 dark:text-white">Results by domain</h2>
        <div className="space-y-4">
          {DOMAINS.map((d) => {
            const x = r.byDomain[d.id] || { c: 0, t: 0 };
            const p = x.t ? Math.round((x.c / x.t) * 100) : 0;
            return (
              <div key={d.id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {d.id}. {d.name}
                  </span>
                  <span className={cx('font-bold', p >= PASS_TARGET ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white')}>
                    {x.c}/{x.t} · {p}%
                  </span>
                </div>
                <Bar value={p} color={d.color} />
              </div>
            );
          })}
        </div>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Review answers</h2>
          <div className="glass flex rounded-xl p-1 text-sm">
            {['wrong', 'all'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cx('h-9 rounded-lg px-3 font-semibold', filter === f ? 'bg-brand-600 text-white' : 'text-slate-500')}>
                {f === 'wrong' ? 'Missed' : 'All'}
              </button>
            ))}
          </div>
        </div>
        <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
          {['all', ...DOMAINS.map((d) => d.id)].map((x) => (
            <button key={x} onClick={() => setDom(x)} className={cx('h-9 shrink-0 rounded-xl px-3 text-sm font-semibold', dom === x ? 'bg-brand-600 text-white' : 'glass text-slate-600 dark:text-slate-300')}>
              {x === 'all' ? 'All topics' : `${x} · ${DOMAIN[x].short}`}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {review.map((q) => (
            <Card key={q.id}>
              <div className="mb-2 flex items-center justify-between">
                <DomainChip d={DOMAIN[q.d]} />
                <span className="text-xs font-semibold text-slate-400">
                  #{q.n} {r.pilot.includes(q.id) && '· pilot (unscored)'}
                </span>
              </div>
              <p className="mb-3 font-semibold text-slate-900 dark:text-white">{q.q}</p>
              {q.chosen === undefined && <p className="mb-2 text-sm font-semibold text-amber-600">Left blank</p>}
              <OptionList q={q} chosen={q.chosen} reveal />
            </Card>
          ))}
          {review.length === 0 && <Card className="text-center text-slate-500">No missed questions. Perfect!</Card>}
        </div>
      </div>
    </div>
  );
}
