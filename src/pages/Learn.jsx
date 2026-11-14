import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Wand2, Lightbulb, AlertTriangle, Baby, BookOpen, Printer, FileText } from 'lucide-react';
import { useStore, markStudy } from '../store.jsx';
import { DOMAINS, DOMAIN } from '../data/domains.js';
import { LESSONS, lessonsByDomain } from '../data/lessons.js';
import { CHEATSHEET } from '../data/content.js';
import { go, stopSpeaking } from '../lib.js';
import { Card, Bar, Button, PageTitle, MiaSays, ListenButton, DomainChip, BackButton, cx } from '../components/ui.jsx';

export function Learn() {
  const { s } = useStore();
  const done = LESSONS.filter((l) => s.lessons[l.id]).length;
  return (
    <div>
      <PageTitle title="Learn" sub={`${done} of ${LESSONS.length} lessons learned`} />
      <MiaSays className="mb-5">I'm Mia, your elephant coach 🐘 Pick a domain and swipe through the cards. Tap "Listen" and I'll read it to you!</MiaSays>

      <Card as="button" onClick={() => go('cheatsheet')} className="tap mb-5 flex w-full items-center gap-4 !bg-gradient-to-r from-brand-600 to-fuchsia-500 text-left text-white">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20">
          <FileText size={24} />
        </span>
        <span className="flex-1">
          <span className="block font-display text-lg font-semibold">Must-Memorize Cheat Sheet</span>
          <span className="text-sm text-white/80">The highest-yield facts on one page</span>
        </span>
        <ChevronRight />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {DOMAINS.map((d) => {
          const ls = lessonsByDomain(d.id);
          const n = ls.filter((l) => s.lessons[l.id]).length;
          return (
            <Card key={d.id} as="button" onClick={() => go(`learn/${d.id}`)} className="tap flex flex-col gap-3 text-left">
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl text-2xl" style={{ background: d.soft }}>
                  {d.emoji}
                </span>
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: d.soft, color: d.color }}>
                  {d.weight}% of exam
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">DOMAIN {d.id}</p>
                <p className="font-display text-lg font-semibold leading-snug text-slate-900 dark:text-white">{d.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{d.blurb}</p>
              </div>
              <div>
                <Bar value={(n / ls.length) * 100} color={d.color} />
                <p className="mt-1.5 text-xs text-slate-400">
                  {n}/{ls.length} lessons {n === ls.length && '✓'}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function lessonSpeech(l, simple) {
  return `${l.title}. ${simple ? l.simple : l.def} Example: ${l.example} How the exam tricks you: ${l.trap} Memory trick: ${l.trick}`;
}

export function LessonViewer({ domain }) {
  const d = DOMAIN[domain];
  const lessons = lessonsByDomain(domain);
  const { s, update } = useStore();
  const [idx, setIdx] = useState(0);
  const [simple, setSimple] = useState({});
  const scroller = useRef(null);

  useEffect(() => stopSpeaking, []);

  if (!d) return <p>Domain not found.</p>;

  const scrollTo = (i) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = scroller.current;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) {
      setIdx(i);
      stopSpeaking();
    }
  };

  const learn = (l, i) => {
    update((n) => {
      n.lessons = { ...n.lessons, [l.id]: n.lessons[l.id] || Date.now() };
      markStudy(n);
    });
    if (i < lessons.length - 1) scrollTo(i + 1);
  };

  const isLast = idx === lessons.length - 1;

  return (
    <div>
      <BackButton onClick={() => go('learn')} label="All domains" />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <DomainChip d={d} />
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">{d.name}</h1>
        </div>
        <span className="shrink-0 text-sm font-semibold text-slate-400">
          {idx + 1} / {lessons.length}
        </span>
      </div>

      {/* Progress dots */}
      <div className="mb-4 flex gap-1.5">
        {lessons.map((l, i) => (
          <button
            key={l.id}
            aria-label={`Go to lesson ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={cx('h-2 flex-1 rounded-full transition', i === idx ? 'bg-brand-600' : s.lessons[l.id] ? 'bg-brand-400/60' : 'bg-brand-600/15 dark:bg-white/10')}
          />
        ))}
      </div>

      <div ref={scroller} onScroll={onScroll} className="no-scrollbar -mx-4 flex items-start snap-x snap-mandatory overflow-x-auto md:mx-0">
        {lessons.map((l, i) => {
          const isSimple = simple[l.id];
          return (
            <div key={l.id} className="w-full shrink-0 snap-center px-4 md:px-1">
              <Card className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl" style={{ background: d.soft }}>
                    {l.emoji}
                  </span>
                  <div className="flex-1">
                    <h2 className="font-display text-xl font-bold leading-tight text-slate-900 dark:text-white">{l.title}</h2>
                    {s.lessons[l.id] && (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check size={14} /> Learned
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <ListenButton text={lessonSpeech(l, isSimple)} />
                  <Button variant="soft" size="sm" aria-pressed={!!isSimple} onClick={() => setSimple((x) => ({ ...x, [l.id]: !x[l.id] }))}>
                    <Wand2 size={16} /> {isSimple ? 'Show full version' : 'Explain it simpler'}
                  </Button>
                </div>

                <Section icon={BookOpen} title={isSimple ? 'In one line' : 'What it is'} tone="violet">
                  <p key={isSimple ? 's' : 'f'} className={cx('animate-pop', isSimple && 'text-lg font-semibold text-brand-700 dark:text-violet-200')}>
                    {isSimple ? l.simple : l.def}
                  </p>
                </Section>
                <Section icon={Baby} title="Real-life example" tone="sky">
                  <p>{l.example}</p>
                </Section>
                <Section icon={AlertTriangle} title="How the exam tricks you" tone="amber">
                  <p>{l.trap}</p>
                </Section>
                <Section icon={Lightbulb} title="Memory trick" tone="pink">
                  <p className="font-semibold">{l.trick}</p>
                </Section>

                <Button className="w-full" onClick={() => learn(l, i)}>
                  <Check size={18} /> {i < lessons.length - 1 ? 'Got it! Next card' : 'Got it!'}
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
            Quiz me on this domain <ChevronRight size={18} />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => scrollTo(idx + 1)}>
            Next <ChevronRight size={18} />
          </Button>
        )}
      </div>
    </div>
  );
}

const TONES = {
  violet: 'bg-violet-500/[.07] text-violet-700 dark:text-violet-300',
  sky: 'bg-sky-500/[.08] text-sky-700 dark:text-sky-300',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  pink: 'bg-pink-500/10 text-pink-700 dark:text-pink-300',
};

function Section({ icon: Icon, title, tone, children }) {
  return (
    <div className={cx('rounded-2xl p-4', TONES[tone])}>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
        <Icon size={15} /> {title}
      </p>
      <div className="text-[15.5px] leading-relaxed text-slate-700 dark:text-slate-200">{children}</div>
    </div>
  );
}

export function CheatSheet() {
  return (
    <div>
      <BackButton onClick={() => go('learn')} label="Learn" />
      <PageTitle
        title="Must-Memorize Cheat Sheet"
        sub="RBT Task List, 3rd Edition (2026). Read it the night before!"
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
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-display font-semibold text-slate-900 dark:text-white">
                  {d.emoji} {d.id}. {d.name}
                </h2>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: d.soft, color: d.color }}>
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
        <p className="mt-1 text-[15px] text-slate-600 dark:text-slate-300">
          85 questions (75 scored + 10 unscored pilot) · 90 minutes · 6 domains · 43 tasks
        </p>
      </Card>
    </div>
  );
}
