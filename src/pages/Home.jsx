import { useEffect, useMemo, useState } from 'react';
import { Flame, Heart, ChevronRight, Gift, Snowflake } from 'lucide-react';
import { useStore, readiness, domainStats, weakestDomain, streak, minutesToday, challenges, daysToNextLevel, todayKey, addXP, markStudy, logInc } from '../store.jsx';
import { DOMAINS } from '../data/domains.js';
import { LESSONS, lessonsByDomain } from '../data/lessons.js';
import { FLASHCARDS, MOTIVATION } from '../data/content.js';
import { greeting, go, pick, celebrate } from '../lib.js';
import { levelInfo, sfx, buzz, XP } from '../fun.js';
import { Card, Ring, Bar, Button, MiaSays, Elephant, DomainBadge, Modal, cx } from '../components/ui.jsx';

// The next most useful thing to study.
export function dailyPlan(s) {
  const weak = weakestDomain(s);
  const nextLesson = lessonsByDomain(weak.id).find((l) => !s.lessons[l.id]) || LESSONS.find((l) => !s.lessons[l.id]);
  const due = FLASHCARDS.filter((c) => !s.srs[c.id] || s.srs[c.id].due <= Date.now()).length;
  const t = s.log[todayKey()] || {};
  const steps = [
    nextLesson && { id: 'lesson', label: `Learn: ${nextLesson.title}`, done: (t.lessons || 0) >= 2, go: `learn/${nextLesson.d}?l=${nextLesson.id}` },
    { id: 'cards', label: `Review flashcards (${Math.min(due, 20)} ready)`, done: (t.cards || 0) >= Math.min(20, Math.max(due, 1)), go: 'flash/all' },
    { id: 'mixed', label: '10 mixed questions', done: (t.mixed || 0) >= 1, go: 'quiz/mixed' },
  ].filter(Boolean);
  return { steps, next: steps.find((x) => !x.done), weak };
}

function daysUntil(date) {
  if (!date) return null;
  const a = new Date(`${date}T00:00:00`);
  const b = new Date(`${todayKey()}T00:00:00`);
  return Math.round((a - b) / 86400000);
}

export default function Home() {
  const { s, update } = useStore();
  const ready = readiness(s);
  const st = streak(s);
  const mins = minutesToday(s);
  const goalDone = mins >= s.goal;
  const lv = levelInfo(s.xp);
  const plan = dailyPlan(s);
  const tip = useMemo(() => pick(MOTIVATION), []);
  const dtl = daysToNextLevel(s);
  const left = daysUntil(s.examDate);
  const [chest, setChest] = useState(null);
  const [pomo, setPomo] = useState(false);

  const openChest = () => {
    const freeze = Math.random() < 0.3;
    update((n) => {
      n.chestDay = todayKey();
      if (freeze) n.freezes = (n.freezes || 0) + 1;
      else addXP(n, XP.chest);
    });
    sfx('chest');
    buzz([30, 40, 30]);
    celebrate();
    setChest(freeze ? 'freeze' : 'xp');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 pt-2">
        <div>
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white md:text-4xl">{greeting(s.name)}</h1>
          <p className="mt-1 text-[15px] text-slate-500 dark:text-slate-400">You've got this, {s.name}.</p>
        </div>
        <Elephant size={88} balloon className="-mb-2 shrink-0 animate-float" />
      </div>

      {/* Level + streak + hearts strip */}
      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent font-display text-lg font-bold text-white">{lv.level}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate font-semibold text-slate-900 dark:text-white">{lv.rank}</p>
              <p className="shrink-0 text-xs text-slate-400">
                {lv.into}/{lv.need} XP
              </p>
            </div>
            <Bar value={lv.pct} className="mt-1.5" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 font-semibold text-orange-500">
            <Flame size={18} className={st ? 'fill-orange-400' : ''} /> {st} day streak
            {s.freezes > 0 && (
              <span className="ml-1 flex items-center gap-0.5 text-sky-500" title="Streak freezes">
                <Snowflake size={15} />
                {s.freezes}
              </span>
            )}
          </span>
          <span className="flex items-center gap-0.5 text-rose-500" aria-label={`${s.hearts} hearts`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Heart key={i} size={16} className={i < s.hearts ? 'fill-rose-500' : 'opacity-25'} />
            ))}
          </span>
        </div>
        {dtl && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{s.name}, at your pace you're about {dtl} {dtl === 1 ? 'day' : 'days'} from level {lv.level + 1}!</p>}
      </Card>

      {/* Today's plan: one big button */}
      <Card className="overflow-hidden !p-0">
        <div className="bg-gradient-to-br from-brand-600 to-accent p-5 text-white">
          <p className="text-sm font-semibold text-white/80">Today's plan</p>
          <p className="mt-1 font-display text-xl font-bold">{plan.next ? plan.next.label : 'All done for today. Amazing!'}</p>
          <Button variant="white" size="lg" className="mt-4 w-full" onClick={() => go(plan.next ? plan.next.go : 'games')}>
            {plan.next ? 'Start' : 'Play a game for fun'} <ChevronRight size={20} />
          </Button>
        </div>
        <div className="space-y-2 p-4">
          {plan.steps.map((x, i) => (
            <button key={x.id} onClick={() => go(x.go)} className="flex w-full items-center gap-3 rounded-xl p-1 text-left">
              <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold', x.done ? 'bg-emerald-500 text-white' : 'bg-brand-600/10 text-brand-700 dark:text-violet-200')}>{x.done ? '✓' : i + 1}</span>
              <span className={cx('text-[15px]', x.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200')}>{x.label}</span>
            </button>
          ))}
          <div className="flex items-center justify-between gap-3 border-t border-black/5 pt-3 dark:border-white/10">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Daily goal: {Math.min(mins, s.goal)}/{s.goal} min
              </p>
              <Bar value={(mins / s.goal) * 100} className="mt-1.5" />
            </div>
            {goalDone && s.chestDay !== todayKey() ? (
              <Button size="sm" className="shiny" onClick={openChest}>
                <Gift size={18} className="wiggle" /> Open chest
              </Button>
            ) : (
              <Button size="sm" variant="soft" onClick={() => setPomo(true)}>
                Focus timer
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Exam countdown */}
      <Card className="flex items-center gap-4 !p-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-600/10 text-center font-display font-bold leading-none text-brand-700 dark:text-violet-200">
          {left !== null && left >= 0 ? (
            <span>
              <span className="text-xl">{left}</span>
              <span className="block text-[10px] font-semibold">days</span>
            </span>
          ) : (
            <span className="text-xs">Exam</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-white">{left === null ? 'When is your exam?' : left > 0 ? 'Until your RBT exam' : left === 0 ? 'Exam day! You\'ve got this!' : 'Exam date passed'}</p>
          <input
            type="date"
            aria-label="Exam date"
            value={s.examDate || ''}
            min={todayKey()}
            onChange={(e) => update((n) => void (n.examDate = e.target.value || null))}
            className="mt-1 h-10 w-full max-w-[200px] rounded-xl border border-black/5 bg-white/70 px-3 text-sm dark:border-white/10 dark:bg-white/10"
          />
        </div>
      </Card>

      <MiaSays>{tip}</MiaSays>

      {/* Challenges */}
      <div className="grid gap-3 sm:grid-cols-2">
        {challenges(s).map((c) => (
          <Card key={c.id} className="!p-4">
            <p className="label">{c.kind}</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{c.text}</p>
            <Bar value={(c.value / c.goal) * 100} className="mt-2" />
            <p className="mt-1 text-xs text-slate-400">
              {c.value}/{c.goal} {c.value >= c.goal && '· Complete!'}
            </p>
          </Card>
        ))}
      </div>

      {/* Readiness */}
      <Card>
        <div className="flex items-center gap-5">
          <Ring value={ready} size={112} stroke={11}>
            <div>
              <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{ready}%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ready</p>
            </div>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">Exam readiness</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Weakest area: {plan.weak.name}</p>
            <Button size="sm" className="mt-3" onClick={() => go(`quiz/${plan.weak.id}`)}>
              Study my weakest area
            </Button>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {DOMAINS.map((d) => {
            const x = domainStats(s, d.id);
            return (
              <button key={d.id} onClick={() => go(`quiz/${d.id}`)} className="flex w-full items-center gap-3 text-left">
                <DomainBadge d={d} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-slate-700 dark:text-slate-200">{d.name}</span>
                    <span className="shrink-0 font-bold text-slate-900 dark:text-white">{x.score}%</span>
                  </span>
                  <Bar value={x.score} color={d.color} className="mt-1 !h-2" />
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">Exam weights: A 17% · B 11% · C 25% · D 19% · E 13% · F 15%</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="soft" size="lg" onClick={() => go('map')}>
          Road to RBT
        </Button>
        <Button variant="soft" size="lg" onClick={() => go('summary')}>
          Today's summary
        </Button>
      </div>

      {chest && (
        <Modal title="Daily chest" onClose={() => setChest(null)}>
          <div className="flex flex-col items-center text-center">
            <Elephant size={120} balloon className="animate-pop" />
            <p className="mt-3 font-display text-2xl font-bold text-slate-900 dark:text-white">{chest === 'xp' ? `+${XP.chest} XP!` : 'A streak freeze!'}</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{chest === 'xp' ? 'Bonus XP for reaching your goal.' : 'If you miss a day, it protects your streak.'}</p>
            <Button className="mt-5 w-full" onClick={() => setChest(null)}>
              Yay!
            </Button>
          </div>
        </Modal>
      )}
      {pomo && <Pomodoro onClose={() => setPomo(false)} />}
    </div>
  );
}

// 25/5 focus timer with a session log.
export function Pomodoro({ onClose }) {
  const { s, update } = useStore();
  const [mode, setMode] = useState('focus');
  const [end, setEnd] = useState(null);
  const [left, setLeft] = useState(25 * 60);
  const total = mode === 'focus' ? 25 * 60 : 5 * 60;

  useEffect(() => {
    if (!end) return;
    const id = setInterval(() => {
      const l = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) {
        clearInterval(id);
        setEnd(null);
        sfx('win');
        buzz([100, 80, 100]);
        if (mode === 'focus') {
          update((n) => {
            n.pomos = [...n.pomos, { date: Date.now(), min: 25 }].slice(-100);
            addXP(n, XP.pomodoro);
            markStudy(n);
            logInc(n, 'pomos');
          });
          celebrate();
          setMode('break');
          setLeft(5 * 60);
        } else {
          setMode('focus');
          setLeft(25 * 60);
        }
      }
    }, 500);
    return () => clearInterval(id);
  }, [end, mode, update]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const today = s.pomos.filter((p) => todayKey(new Date(p.date)) === todayKey()).length;

  return (
    <Modal title="Focus timer" onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <p className={cx('mb-3 rounded-full px-3 py-1 text-sm font-bold', mode === 'focus' ? 'bg-brand-600/10 text-brand-700 dark:text-violet-200' : 'bg-emerald-500/15 text-emerald-600')}>{mode === 'focus' ? 'Focus: 25 min' : 'Break: 5 min'}</p>
        <Ring value={((total - left) / total) * 100} size={190} stroke={14}>
          <p className="font-display text-4xl font-bold tabular-nums text-slate-900 dark:text-white">
            {mm}:{ss}
          </p>
        </Ring>
        <div className="mt-5 flex w-full gap-2">
          <Button
            className="flex-1"
            onClick={() => {
              if (end) setEnd(null);
              else {
                setEnd(Date.now() + left * 1000);
                sfx('tap');
              }
            }}
          >
            {end ? 'Pause' : left < total ? 'Resume' : 'Start'}
          </Button>
          <Button
            variant="soft"
            onClick={() => {
              setEnd(null);
              setLeft(total);
            }}
          >
            Reset
          </Button>
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {today} focus {today === 1 ? 'session' : 'sessions'} today · {s.pomos.length} total · +{XP.pomodoro} XP each
        </p>
        <p className="mt-1 text-xs text-slate-400">Keep this window open while you study.</p>
      </div>
    </Modal>
  );
}
