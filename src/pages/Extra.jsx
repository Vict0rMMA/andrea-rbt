import { useState } from 'react';
import { Lock, Check, Share2, Swords } from 'lucide-react';
import { useStore, BADGES, domainStats, streak, minutesToday, todayLog, weekLog, weakestDomain, todayKey } from '../store.jsx';
import { DOMAINS, DOMAIN } from '../data/domains.js';
import { lessonsByDomain } from '../data/lessons.js';
import { go } from '../lib.js';
import { levelInfo } from '../fun.js';
import { Card, Button, PageTitle, BackButton, Mia, Medal, DomainBadge, Bar, Elephant, cx } from '../components/ui.jsx';

// ───────── Road to RBT ─────────
export function RoadMap() {
  const { s } = useStore();
  const firstOpen = DOMAINS.findIndex((d) => !s.bosses[d.id]);
  const allDone = firstOpen === -1;
  return (
    <div>
      <BackButton onClick={() => go('home')} label="Home" />
      <PageTitle title="Road to RBT" sub="Beat each boss to move forward. The mock exam is the castle!" />
      <div className="relative mx-auto max-w-md pb-6">
        <svg className="absolute left-1/2 top-0 h-full w-24 -translate-x-1/2" preserveAspectRatio="none" viewBox="0 0 100 700" aria-hidden="true">
          <path d="M50 0 C100 80 0 150 50 230 C100 310 0 380 50 460 C100 540 0 610 50 700" stroke="rgb(var(--b600) / .25)" strokeWidth="10" fill="none" strokeDasharray="2 16" strokeLinecap="round" />
        </svg>
        <div className="relative space-y-6">
          {DOMAINS.map((d, i) => {
            const beaten = !!s.bosses[d.id];
            const current = i === firstOpen;
            const locked = !beaten && !current;
            const st = domainStats(s, d.id);
            return (
              <div key={d.id} className={cx('flex', i % 2 ? 'justify-end' : 'justify-start')}>
                <Card className={cx('w-[78%] !p-4', current && 'ring-2 ring-brand-600', locked && 'opacity-70')}>
                  <div className="flex items-center gap-3">
                    <span className="relative">
                      <DomainBadge d={d} size={46} />
                      <span className={cx('absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full text-white', beaten ? 'bg-emerald-500' : locked ? 'bg-slate-400' : 'bg-brand-600')}>{beaten ? <Check size={12} /> : locked ? <Lock size={11} /> : <Swords size={11} />}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-tight text-slate-900 dark:text-white">{d.name}</span>
                      <span className="text-xs text-slate-500">{beaten ? 'Boss defeated!' : `${st.score}% mastered`}</span>
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="soft" className="flex-1" onClick={() => go(`learn/${d.id}`)}>
                      Study
                    </Button>
                    <Button size="sm" className="flex-1" variant={beaten ? 'soft' : 'primary'} onClick={() => go(`quiz/boss-${d.id}`)}>
                      {beaten ? 'Rematch' : 'Boss Battle'}
                    </Button>
                  </div>
                </Card>
              </div>
            );
          })}
          <div className="flex justify-center">
            <Card className={cx('w-full !p-5 text-center', allDone ? 'ring-2 ring-amber-400' : 'opacity-80')}>
              <svg viewBox="0 0 120 80" className="mx-auto h-20 w-28" aria-hidden="true">
                <rect x="20" y="30" width="80" height="45" fill={allDone ? '#FBBF24' : '#CBD5E1'} />
                <rect x="10" y="18" width="22" height="57" fill={allDone ? '#F59E0B' : '#94A3B8'} />
                <rect x="88" y="18" width="22" height="57" fill={allDone ? '#F59E0B' : '#94A3B8'} />
                <path d="M10 18l11-12 11 12M88 18l11-12 11 12" fill={allDone ? 'rgb(var(--acc))' : '#94A3B8'} />
                <rect x="50" y="50" width="20" height="25" rx="10" fill="#7C2D12" />
                <path d="M60 30V8l14 6-14 6" fill="rgb(var(--b600))" />
              </svg>
              <p className="mt-2 font-display text-lg font-bold text-slate-900 dark:text-white">The Castle: Mock Exam</p>
              <p className="text-sm text-slate-500">{allDone ? 'All bosses beaten. Take the full exam!' : 'Beat all 6 bosses to reach the castle (you can try it anytime).'}</p>
              <Button className="mt-3 w-full" variant={allDone ? 'primary' : 'soft'} onClick={() => go('exam')}>
                Mock exam
              </Button>
            </Card>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-slate-400">Win a boss with 12 of 15 correct. Lessons are always open for study.</p>
    </div>
  );
}

// ───────── End-of-day summary ─────────
export function DaySummary() {
  const { s } = useStore();
  const t = todayLog(s);
  const lv = levelInfo(s.xp);
  const acc = t.q ? Math.round(((t.c || 0) / t.q) * 100) : 0;
  const [msg, setMsg] = useState('');
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const stats = [
    ['XP earned', t.xp || 0],
    ['Minutes', minutesToday(s)],
    ['Questions', t.q || 0],
    ['Accuracy', `${acc}%`],
    ['Cards', t.cards || 0],
    ['Streak', `${streak(s)} days`],
  ];
  const share = async () => {
    const text = `My RBT study day (${date}): ${t.xp || 0} XP, ${t.q || 0} questions (${acc}% correct), ${streak(s)}-day streak. Level ${lv.level} ${lv.rank}!`;
    try {
      if (navigator.share) await navigator.share({ title: 'Andrea RBT', text });
      else {
        await navigator.clipboard.writeText(text);
        setMsg('Copied! Paste it anywhere.');
      }
    } catch {
      /* cancelled */
    }
  };
  return (
    <div>
      <BackButton onClick={() => go('home')} label="Home" />
      <div className="mx-auto max-w-sm overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-900 via-brand-600 to-accent p-6 text-white shadow-2xl shadow-brand-900/30">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-bold">Andrea RBT</p>
          <p className="text-sm text-white/75">{date}</p>
        </div>
        <div className="my-5 flex items-center gap-4">
          <Mia size={84} mood="proud" />
          <div>
            <p className="text-sm text-white/75">Today's study</p>
            <p className="font-display text-2xl font-bold leading-tight">{(t.xp || 0) > 0 ? 'Great work, ' : 'Let\'s go, '}{s.name}!</p>
            <p className="text-sm text-white/85">
              Level {lv.level} · {lv.rank}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {stats.map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white/15 p-3 text-center">
              <p className="font-display text-xl font-bold">{v}</p>
              <p className="text-[11px] text-white/80">{k}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-sm text-white/85">One step closer to "RBT" after my name.</p>
      </div>
      <div className="mx-auto mt-4 max-w-sm space-y-2 text-center">
        <Button className="w-full" onClick={share}>
          <Share2 size={18} /> Share
        </Button>
        <p className="text-xs text-slate-400">{msg || 'Tip: take a screenshot to save this card.'}</p>
      </div>
    </div>
  );
}

// ───────── Weekly report ─────────
export function Report() {
  const { s } = useStore();
  const w = weekLog(s);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const k = todayKey(d);
    return { k, label: d.toLocaleDateString('en-US', { weekday: 'short' }), xp: s.log[k]?.xp || 0, min: Math.round((s.time[k] || 0) / 60) };
  });
  const maxXp = Math.max(50, ...days.map((d) => d.xp));
  const ranked = DOMAINS.map((d) => ({ d, ...domainStats(s, d.id) })).sort((a, b) => a.score - b.score);
  const weak = weakestDomain(s);
  const next = lessonsByDomain(weak.id).find((l) => !s.lessons[l.id]) || lessonsByDomain(weak.id)[0];
  return (
    <div className="space-y-5">
      <BackButton onClick={() => go('me')} label="Me" />
      <PageTitle title="Weekly report" sub="Your last 7 days" />
      <div className="grid grid-cols-3 gap-3">
        {[
          ['XP', w.xp],
          ['Questions', w.q],
          ['Days studied', `${w.days}/7`],
        ].map(([k, v]) => (
          <div key={k} className="glass rounded-2xl p-3 text-center">
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{v}</p>
            <p className="text-xs text-slate-500">{k}</p>
          </div>
        ))}
      </div>
      <Card>
        <h2 className="mb-4 font-display font-semibold text-slate-900 dark:text-white">XP per day</h2>
        <div className="flex h-36 items-end gap-2">
          {days.map((d) => (
            <div key={d.k} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-slate-400">{d.xp || ''}</span>
              <div className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-accent" style={{ height: `${Math.max(3, (d.xp / maxXp) * 100)}%`, opacity: d.xp ? 1 : 0.2, transformOrigin: 'bottom', animation: 'grow .7s ease-out both' }} />
              <span className="text-[11px] text-slate-500">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="mb-4 font-display font-semibold text-slate-900 dark:text-white">Score by domain</h2>
        <div className="space-y-3">
          {DOMAINS.map((d) => {
            const x = domainStats(s, d.id);
            return (
              <div key={d.id} className="flex items-center gap-3">
                <DomainBadge d={d} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between text-sm">
                    <span className="truncate text-slate-700 dark:text-slate-200">{d.short}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{x.score}%</span>
                  </span>
                  <Bar value={x.score} color={d.color} className="mt-1 !h-2" />
                </span>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 font-display font-semibold text-slate-900 dark:text-white">Your 3 weakest topics</h2>
        <ol className="space-y-2">
          {ranked.slice(0, 3).map((r, i) => (
            <li key={r.d.id} className="flex items-center justify-between gap-2">
              <span className="text-slate-700 dark:text-slate-200">
                {i + 1}. {r.d.name}
              </span>
              <Button size="sm" variant="soft" onClick={() => go(`quiz/${r.d.id}`)}>
                Practice
              </Button>
            </li>
          ))}
        </ol>
      </Card>
      {next && (
        <Card className="flex items-center gap-4">
          <Elephant size={70} />
          <div className="min-w-0 flex-1">
            <p className="label">Recommended next lesson</p>
            <p className="font-semibold text-slate-900 dark:text-white">{next.title}</p>
            <Button size="sm" className="mt-2" onClick={() => go(`learn/${next.d}?l=${next.id}`)}>
              Start lesson
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ───────── Badges collection ─────────
export function Badges() {
  const { s } = useStore();
  const got = BADGES.filter((b) => s.badges[b.id]).length;
  return (
    <div>
      <BackButton onClick={() => go('me')} label="Me" />
      <PageTitle title="Badges" sub={`${got} of ${BADGES.length} unlocked`} />
      <Bar value={(got / BADGES.length) * 100} className="mb-5" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BADGES.map((b) => {
          const has = s.badges[b.id];
          return (
            <Card key={b.id} className={cx('flex flex-col items-center !p-4 text-center', !has && 'opacity-60')}>
              <Medal got={!!has} name={b.name} size={70} />
              <p className="mt-2 font-semibold leading-tight text-slate-900 dark:text-white">{b.name}</p>
              <p className="mt-1 text-xs text-slate-500">{has ? `Unlocked ${has}` : b.desc}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export { DOMAIN };
