import { useMemo } from 'react';
import { Flame, Target, Sparkles, ArrowRight, Layers, AlertCircle, FileText, Timer } from 'lucide-react';
import { useStore, readiness, domainStats, weakestDomain, streak, minutesToday } from '../store.jsx';
import { DOMAINS } from '../data/domains.js';
import { FLASHCARDS, MOTIVATION } from '../data/content.js';
import { greeting, go, pick } from '../lib.js';
import { Card, Ring, Bar, Button, MiaSays, Elephant } from '../components/ui.jsx';

export default function Home() {
  const { s } = useStore();
  const ready = readiness(s);
  const weak = weakestDomain(s);
  const st = streak(s);
  const mins = minutesToday(s);
  const goalPct = Math.min(100, Math.round((mins / s.goal) * 100));
  const tip = useMemo(() => pick(MOTIVATION), []);
  const due = FLASHCARDS.filter((c) => !s.srs[c.id] || s.srs[c.id].due <= Date.now()).length;

  const readyMsg =
    ready >= 80 ? 'You look exam-ready! Keep it fresh with a mock exam.' : ready >= 50 ? 'Great progress! Focus on your weakest domain.' : ready > 0 ? 'Nice start! Every quiz makes this ring grow.' : 'Take your first quiz to see your readiness.';

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3 pt-2">
        <div>
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white md:text-4xl">{greeting(s.name)}</h1>
          <p className="mt-1 text-[15px] text-slate-500 dark:text-slate-400">You've got this, {s.name} 💜</p>
        </div>
        <Elephant size={92} balloon className="-mb-2 shrink-0 animate-float" />
      </div>

      <div className="grid gap-5 md:grid-cols-5">
        {/* Readiness */}
        <Card className="flex flex-col items-center gap-4 text-center md:col-span-3 md:flex-row md:text-left">
          <Ring value={ready} size={168} stroke={15}>
            <div>
              <p className="font-display text-4xl font-bold text-slate-900 dark:text-white">{ready}%</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Readiness</p>
            </div>
          </Ring>
          <div className="flex-1">
            <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">Exam readiness</p>
            <p className="mt-1 text-[15px] text-slate-500 dark:text-slate-400">{readyMsg}</p>
            <Button className="mt-4 w-full md:w-auto" onClick={() => go(`quiz/${weak.id}`)}>
              <Sparkles size={18} /> Study my weakest area
            </Button>
            <p className="mt-2 text-xs text-slate-400">
              Weakest: {weak.emoji} {weak.name}
            </p>
          </div>
        </Card>

        {/* Streak + goal */}
        <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-1">
          <Card className="flex flex-col justify-between">
            <div className="flex items-center gap-2 text-orange-500">
              <Flame size={20} />
              <span className="label !text-orange-500/80">Streak</span>
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">
              {st} <span className="text-base font-medium text-slate-400">{st === 1 ? 'day' : 'days'}</span>
            </p>
            <p className="text-xs text-slate-400">{st >= 7 ? 'On fire! 🔥' : 'Study daily to grow it'}</p>
          </Card>
          <Card className="flex flex-col justify-between">
            <div className="flex items-center gap-2 text-brand-600 dark:text-violet-300">
              <Target size={20} />
              <span className="label !text-current">Daily goal</span>
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">
              {Math.min(mins, s.goal)}
              <span className="text-base font-medium text-slate-400">/{s.goal} min</span>
            </p>
            <Bar value={goalPct} className="mt-2" />
            <p className="mt-1.5 text-xs text-slate-400">{goalPct >= 100 ? 'Goal reached! 🎉' : `${s.goal} minutes today`}</p>
          </Card>
        </div>
      </div>

      <MiaSays>{tip}</MiaSays>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <QuickAction icon={Layers} label="Flashcards" sub={`${due} due`} onClick={() => go('flash/all')} />
        <QuickAction icon={AlertCircle} label="Mistakes" sub={`${s.mistakes.length} to fix`} onClick={() => go('practice/mistakes')} />
        <QuickAction icon={FileText} label="Cheat sheet" sub="Must-memorize" onClick={() => go('cheatsheet')} />
        <QuickAction icon={Timer} label="Mock exam" sub="85 Q · 90 min" onClick={() => go('exam')} />
      </div>

      {/* Domain scores */}
      <Card>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Score by domain</h2>
          <span className="text-xs text-slate-400">2026 exam weight</span>
        </div>
        <div className="space-y-4">
          {DOMAINS.map((d) => {
            const st = domainStats(s, d.id);
            return (
              <button key={d.id} onClick={() => go(`quiz/${d.id}`)} className="group block w-full text-left">
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {d.emoji} <span className="text-slate-400">{d.id}.</span> {d.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: d.soft, color: d.color }}>
                      {d.weight}%
                    </span>
                    <span className="w-9 text-right font-bold text-slate-900 dark:text-white">{st.score}%</span>
                  </span>
                </div>
                <Bar value={st.score} color={d.color} />
                <p className="mt-1 text-[11px] text-slate-400">
                  {st.answered}/{st.total} questions tried · {Math.round(st.accuracy * 100)}% correct
                  <ArrowRight size={12} className="ml-1 inline opacity-0 transition group-hover:opacity-100" />
                </p>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function QuickAction({ icon: Icon, label, sub, onClick }) {
  return (
    <Card as="button" onClick={onClick} className="tap flex flex-col items-start gap-3 !p-4 text-left">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-fuchsia-400 text-white shadow-md shadow-brand-600/20">
        <Icon size={20} />
      </span>
      <span>
        <span className="block font-semibold text-slate-900 dark:text-white">{label}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{sub}</span>
      </span>
    </Card>
  );
}
