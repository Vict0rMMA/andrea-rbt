import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Printer, Search, Play } from 'lucide-react';
import { useStore, markStudy, addXP, logInc } from '../store.jsx';
import { DOMAINS, DOMAIN } from '../data/domains.js';
import { LESSONS, lessonsByDomain } from '../data/lessons.js';
import { CHEATSHEET } from '../data/content.js';
import { GLOSSARY } from '../data/glossary.js';
import { go, stopSpeaking } from '../lib.js';
import { XP, sfx } from '../fun.js';
import { Card, Bar, Button, PageTitle, MiaSays, ListenButton, DomainChip, DomainBadge, BackButton, AskMia, cx } from '../components/ui.jsx';

export const ytSearch = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`RBT ${q} explained`)}`;

export function Learn() {
  const { s } = useStore();
  const done = LESSONS.filter((l) => s.lessons[l.id]).length;
  return (
    <div>
      <PageTitle title="Learn" sub={`${done} of ${LESSONS.length} lessons learned`} />
      <MiaSays className="mb-5">Pick a topic. I'll explain each idea in simple English, and you can listen too.</MiaSays>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Card as="button" onClick={() => go('cheatsheet')} className="tap !p-4 text-left">
          <p className="font-display font-semibold text-slate-900 dark:text-white">Cheat sheet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Must-memorize facts</p>
        </Card>
        <Card as="button" onClick={() => go('glossary')} className="tap !p-4 text-left">
          <p className="font-display font-semibold text-slate-900 dark:text-white">Glossary</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">All the words, simple</p>
        </Card>
      </div>

      <div className="space-y-3">
        {DOMAINS.map((d) => {
          const ls = lessonsByDomain(d.id);
          const n = ls.filter((l) => s.lessons[l.id]).length;
          return (
            <Card key={d.id} as="button" onClick={() => go(`learn/${d.id}`)} className="tap flex w-full items-center gap-4 !p-4 text-left">
              <DomainBadge d={d} size={48} />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[17px] font-semibold leading-snug text-slate-900 dark:text-white">{d.name}</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">
                  {n}/{ls.length} lessons · {d.weight}% of exam
                </span>
                <Bar value={(n / ls.length) * 100} color={d.color} className="mt-2 !h-1.5" />
              </span>
              <ChevronRight className="shrink-0 text-slate-400" />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function LessonViewer({ domain, query }) {
  const d = DOMAIN[domain];
  const lessons = lessonsByDomain(domain);
  const { s, update } = useStore();
  const startIdx = Math.max(0, lessons.findIndex((l) => l.id === query?.l));
  const [idx, setIdx] = useState(startIdx);
  const [simple, setSimple] = useState({});
  const [ask, setAsk] = useState(null);
  const scroller = useRef(null);

  useEffect(() => stopSpeaking, []);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && startIdx) el.scrollLeft = startIdx * el.clientWidth;
  }, [startIdx]);

  if (!d) return <p>Topic not found.</p>;

  const scrollTo = (i) => scroller.current?.scrollTo({ left: i * scroller.current.clientWidth, behavior: 'smooth' });
  const onScroll = () => {
    const el = scroller.current;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) {
      setIdx(i);
      stopSpeaking();
    }
  };

  const learn = (l, i) => {
    if (!s.lessons[l.id]) {
      update((n) => {
        n.lessons = { ...n.lessons, [l.id]: Date.now() };
        addXP(n, XP.lesson);
        logInc(n, 'lessons');
        markStudy(n);
      });
      sfx('correct');
    }
    if (i < lessons.length - 1) scrollTo(i + 1);
  };

  const isLast = idx === lessons.length - 1;

  return (
    <div>
      <BackButton onClick={() => go('learn')} label="All topics" />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <DomainChip d={d} />
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">{d.name}</h1>
        </div>
        <span className="shrink-0 text-sm font-semibold text-slate-400">
          {idx + 1} / {lessons.length}
        </span>
      </div>

      <div className="mb-4 flex gap-1.5">
        {lessons.map((l, i) => (
          <button key={l.id} aria-label={`Go to lesson ${i + 1}`} onClick={() => scrollTo(i)} className={cx('h-2 flex-1 rounded-full transition', i === idx ? 'bg-brand-600' : s.lessons[l.id] ? 'bg-brand-400/60' : 'bg-brand-600/15 dark:bg-white/10')} />
        ))}
      </div>

      <div ref={scroller} onScroll={onScroll} className="no-scrollbar -mx-4 flex snap-x snap-mandatory items-start overflow-x-auto md:mx-0">
        {lessons.map((l, i) => {
          const isSimple = simple[l.id];
          return (
            <div key={l.id} className="w-full shrink-0 snap-center px-4 md:px-1">
              <Card className="space-y-4">
                <div>
                  <h2 className="font-display text-[22px] font-bold leading-tight text-slate-900 dark:text-white">{l.title}</h2>
                  {s.lessons[l.id] && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <Check size={14} /> Learned
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <ListenButton lesson={l.id} simple={!!isSimple} />
                  <Button variant="soft" size="sm" aria-pressed={!!isSimple} onClick={() => setSimple((x) => ({ ...x, [l.id]: !x[l.id] }))}>
                    {isSimple ? 'Full version' : 'Explain it simpler'}
                  </Button>
                  <Button variant="soft" size="sm" onClick={() => go(`watch/lesson/${l.id}`)}>
                    <Play size={15} /> Watch
                  </Button>
                </div>

                <Section title={isSimple ? 'In one line' : 'What it is'} tone="violet">
                  <p key={isSimple ? 's' : 'f'} className={cx('animate-pop', isSimple && 'text-lg font-semibold text-brand-700 dark:text-violet-200')}>
                    {isSimple ? l.simple : l.def}
                  </p>
                </Section>
                <Section title="Real-life example" tone="sky">
                  <p>{l.example}</p>
                </Section>
                <Section title="How the exam tricks you" tone="amber">
                  <p>{l.trap}</p>
                </Section>
                <Section title="Memory trick" tone="pink">
                  <p className="font-semibold">{l.trick}</p>
                </Section>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <button onClick={() => setAsk(l.title)} className="font-semibold text-brand-600 underline-offset-4 hover:underline dark:text-violet-300">
                    Still confused? Ask Mia
                  </button>
                  <a href={ytSearch(l.title)} target="_blank" rel="noreferrer" className="font-semibold text-slate-500 underline-offset-4 hover:underline dark:text-slate-400">
                    Videos on YouTube
                  </a>
                </div>

                <Button className="w-full" size="lg" onClick={() => learn(l, i)}>
                  <Check size={18} /> {i < lessons.length - 1 ? 'Got it! Next' : 'Got it!'}
                </Button>
              </Card>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => scrollTo(idx - 1)}>
          <ChevronLeft size={18} /> Prev
        </Button>
        {isLast ? (
          <Button size="sm" onClick={() => go(`quiz/${d.id}`)}>
            Quiz me <ChevronRight size={18} />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => scrollTo(idx + 1)}>
            Next <ChevronRight size={18} />
          </Button>
        )}
      </div>
      {ask && <AskMia topic={ask} onClose={() => setAsk(null)} />}
    </div>
  );
}

const TONES = {
  violet: 'bg-violet-500/[.07] text-violet-700 dark:text-violet-300',
  sky: 'bg-sky-500/[.08] text-sky-700 dark:text-sky-300',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  pink: 'bg-pink-500/10 text-pink-700 dark:text-pink-300',
};

function Section({ title, tone, children }) {
  return (
    <div className={cx('rounded-2xl p-4', TONES[tone])}>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wider">{title}</p>
      <div className="text-[16px] leading-relaxed text-slate-700 dark:text-slate-200">{children}</div>
    </div>
  );
}

export function CheatSheet() {
  return (
    <div>
      <BackButton onClick={() => go('learn')} label="Learn" />
      <PageTitle
        title="Cheat sheet"
        sub="RBT Task List, 3rd Edition (2026). Read it the night before."
        right={
          <Button variant="soft" size="sm" className="no-print hidden sm:inline-flex" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {CHEATSHEET.map((sec) => {
          const d = DOMAIN[sec.d];
          return (
            <Card key={sec.d} className="break-inside-avoid">
              <div className="mb-3 flex items-center gap-3">
                <DomainBadge d={d} size={34} />
                <h2 className="flex-1 font-display font-semibold text-slate-900 dark:text-white">{d.name}</h2>
                <span className="shrink-0 text-xs font-bold" style={{ color: d.color }}>
                  {d.weight}%
                </span>
              </div>
              <ul className="space-y-2">
                {sec.items.map((it) => (
                  <li key={it} className="flex gap-2 text-[15px] leading-snug text-slate-700 dark:text-slate-200">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: d.color }} />
                    {it}
                  </li>
                ))}
              </ul>
              <ListenButton className="no-print mt-4" text={`${d.name}. ${sec.items.join(' ')}`} />
            </Card>
          );
        })}
      </div>
      <Card className="mt-4 text-center">
        <p className="font-display font-semibold text-slate-900 dark:text-white">Exam day numbers</p>
        <p className="mt-1 text-[15px] text-slate-600 dark:text-slate-300">85 questions (75 scored + 10 unscored pilot) · 90 minutes · 6 domains · 43 tasks</p>
      </Card>
    </div>
  );
}

export function Glossary() {
  const [q, setQ] = useState('');
  const [d, setD] = useState('all');
  const [es, setEs] = useState({});
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return GLOSSARY.filter((g) => (d === 'all' || g.d === d) && (!t || g.front.toLowerCase().includes(t) || g.back.toLowerCase().includes(t)));
  }, [q, d]);
  return (
    <div>
      <BackButton onClick={() => go('learn')} label="Learn" />
      <PageTitle title="Glossary" sub={`${GLOSSARY.length} terms in simple English`} />
      <div className="relative mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a word..." className="h-12 w-full rounded-2xl border border-black/5 bg-white/80 pl-11 pr-4 outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/10" />
      </div>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {[{ id: 'all', short: 'All' }, ...DOMAINS].map((x) => (
          <button key={x.id} onClick={() => setD(x.id)} className={cx('h-10 shrink-0 rounded-xl px-3 text-sm font-semibold transition', d === x.id ? 'bg-brand-600 text-white' : 'glass text-slate-600 dark:text-slate-300')}>
            {x.id === 'all' ? 'All' : `${x.id} · ${x.short}`}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {list.map((g) => (
          <Card key={g.id} className="!p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">{g.front}</p>
              {g.es && (
                <button onClick={() => setEs((x) => ({ ...x, [g.id]: !x[g.id] }))} className={cx('shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition', es[g.id] ? 'bg-brand-600 text-white' : 'bg-brand-600/10 text-brand-700 dark:text-violet-200')}>
                  Spanish
                </button>
              )}
            </div>
            {es[g.id] && <p className="mt-1 animate-pop text-sm font-semibold italic text-brand-600 dark:text-violet-300">{g.es}</p>}
            <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">{g.back}</p>
            {g.ex && <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Example: {g.ex}</p>}
            <ListenButton className="mt-3" text={`${g.front}. ${g.back} ${g.ex ? `For example: ${g.ex}` : ''}`} />
          </Card>
        ))}
        {!list.length && <Card className="text-center text-slate-500">No words found.</Card>}
      </div>
    </div>
  );
}
