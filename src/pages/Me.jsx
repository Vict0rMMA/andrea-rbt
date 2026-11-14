import { useState } from 'react';
import { NotebookPen, ChevronRight, Trash2, Pencil, Plus, Layers, Moon, Sun, Monitor, Volume2 } from 'lucide-react';
import { useStore, BADGES, streak, resetAll } from '../store.jsx';
import { DOMAINS, DOMAIN } from '../data/domains.js';
import { LESSONS } from '../data/lessons.js';
import { go, speak, canSpeak } from '../lib.js';
import { Card, Button, PageTitle, Mia, BackButton, DomainChip, Elephant, ElephantParade, cx } from '../components/ui.jsx';
import { markStudy, todayKey } from '../store.jsx';

export function Me() {
  const { s, update } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const totalMin = Math.round(Object.values(s.time).reduce((a, b) => a + b, 0) / 60);
  const answered = Object.keys(s.answers).length;
  const earned = BADGES.filter((b) => s.badges[b.id]).length;

  const stats = [
    { label: 'Day streak', value: streak(s) },
    { label: 'Minutes studied', value: totalMin },
    { label: 'Questions tried', value: answered },
    { label: 'Lessons learned', value: `${Object.keys(s.lessons).length}/${LESSONS.length}` },
    { label: 'Cards reviewed', value: s.reviews },
    { label: 'Mock exams', value: s.exams.length },
  ];

  return (
    <div className="space-y-5">
      <PageTitle title="Me" />
      <Card className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-brand-600 to-fuchsia-400 font-display text-2xl font-bold text-white shadow-lg shadow-brand-600/30">
          {(s.name || 'A')[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor="name" className="label">
            Your name
          </label>
          <input
            id="name"
            value={s.name}
            maxLength={24}
            onChange={(e) => update((n) => void (n.name = e.target.value))}
            onBlur={(e) => !e.target.value.trim() && update((n) => void (n.name = 'Andrea'))}
            className="w-full bg-transparent font-display text-xl font-bold text-slate-900 outline-none dark:text-white"
          />
          <p className="text-sm text-slate-500 dark:text-slate-400">Future RBT · {earned}/{BADGES.length} badges</p>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((x) => (
          <div key={x.label} className="glass rounded-2xl p-3 text-center">
            <p className="font-display text-xl font-bold text-slate-900 dark:text-white">{x.value}</p>
            <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">{x.label}</p>
          </div>
        ))}
      </div>

      <Card as="button" onClick={() => go('notes')} className="tap flex w-full items-center gap-4 text-left">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-pink-500/10 text-pink-600">
          <NotebookPen size={22} />
        </span>
        <span className="flex-1">
          <span className="block font-display text-lg font-semibold text-slate-900 dark:text-white">My notes</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">{s.notes.length} notes from your study book</span>
        </span>
        <ChevronRight className="text-slate-400" />
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-slate-900 dark:text-white">Badges</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {BADGES.map((b) => {
            const got = s.badges[b.id];
            return (
              <div key={b.id} className={cx('flex flex-col items-center rounded-2xl p-3 text-center transition', got ? 'bg-gradient-to-br from-brand-600/10 to-fuchsia-400/15' : 'bg-black/[.03] dark:bg-white/[.03]')}>
                <span className={cx('text-3xl', !got && 'opacity-30 grayscale')}>{b.emoji}</span>
                <p className={cx('mt-1 text-xs font-bold leading-tight', got ? 'text-slate-900 dark:text-white' : 'text-slate-400')}>{b.name}</p>
                <p className="mt-0.5 text-[10.5px] leading-tight text-slate-400">{got ? 'Unlocked!' : b.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Settings</h2>

        <div>
          <p className="label mb-2">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: 'light', label: 'Light', Icon: Sun },
              { v: 'dark', label: 'Dark', Icon: Moon },
              { v: null, label: 'Auto', Icon: Monitor },
            ].map(({ v, label, Icon }) => (
              <button key={label} onClick={() => update((n) => void (n.theme = v))} className={cx('flex h-12 items-center justify-center gap-2 rounded-2xl font-semibold transition', s.theme === v ? 'bg-brand-600 text-white' : 'bg-brand-600/10 text-brand-700 dark:text-violet-200')}>
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label mb-2">Daily goal</p>
          <div className="grid grid-cols-4 gap-2">
            {[10, 15, 30, 45].map((m) => (
              <button key={m} onClick={() => update((n) => void (n.goal = m))} className={cx('h-12 rounded-2xl font-semibold transition', s.goal === m ? 'bg-brand-600 text-white' : 'bg-brand-600/10 text-brand-700 dark:text-violet-200')}>
                {m} min
              </button>
            ))}
          </div>
        </div>

        {canSpeak && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="label">Coach Mia's voice speed</p>
              <span className="text-sm font-bold text-brand-600 dark:text-violet-300">{s.rate.toFixed(2)}x</span>
            </div>
            <div className="flex items-center gap-3">
              <Mia size={40} />
              <input type="range" min="0.75" max="1.25" step="0.05" value={s.rate} onChange={(e) => update((n) => void (n.rate = Number(e.target.value)))} className="flex-1 accent-brand-600" aria-label="Voice speed" />
              <Button variant="soft" size="sm" onClick={() => speak(`Hi ${s.name}! I'm Coach Mia. You've got this!`, s.rate)}>
                <Volume2 size={16} /> Test
              </Button>
            </div>
          </div>
        )}

        <div className="border-t border-black/5 pt-4 dark:border-white/10">
          {confirmReset ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">This erases all progress, notes and badges on this device. Are you sure?</p>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={resetAll}>
                  Yes, reset everything
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
              <Trash2 size={16} /> Reset progress
            </Button>
          )}
        </div>
      </Card>

      <ElephantParade />
      <p className="pb-4 text-center text-xs leading-relaxed text-slate-400">
        Made with 💜 for Andrea · Based on the BACB RBT Test Content Outline (3rd ed., 2026).
        <br />
        Study aid only. Not affiliated with the BACB. Your progress is saved on this device.
      </p>
    </div>
  );
}

const EMPTY = { title: '', text: '', d: 'A', flash: true };

export function Notes() {
  const { s, update } = useStore();
  const [form, setForm] = useState(null); // null = closed, otherwise note being edited
  const [filter, setFilter] = useState('all');
  const list = [...s.notes].reverse().filter((n) => filter === 'all' || n.d === filter);

  const save = () => {
    if (!form.title.trim() || !form.text.trim()) return;
    update((n) => {
      const note = { ...form, title: form.title.trim(), text: form.text.trim() };
      if (form.id) n.notes = n.notes.map((x) => (x.id === form.id ? note : x));
      else n.notes = [...n.notes, { ...note, id: Date.now().toString(36), created: todayKey() }];
      markStudy(n);
    });
    setForm(null);
  };

  const remove = (id) => update((n) => void (n.notes = n.notes.filter((x) => x.id !== id)));
  const toggleFlash = (id) => update((n) => void (n.notes = n.notes.map((x) => (x.id === id ? { ...x, flash: !x.flash } : x))));
  const flashCount = s.notes.filter((n) => n.flash).length;

  return (
    <div>
      <BackButton onClick={() => go('me')} label="Me" />
      <PageTitle
        title="My notes"
        sub="Type or paste notes from your study book"
        right={
          !form && (
            <Button size="sm" onClick={() => setForm({ ...EMPTY })}>
              <Plus size={18} /> New
            </Button>
          )
        }
      />

      {form && (
        <Card className="mb-5 animate-pop space-y-3">
          <div>
            <label className="label" htmlFor="nt">
              Title (flashcard front)
            </label>
            <input id="nt" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Resurgence" className="mt-1 h-12 w-full rounded-2xl border border-black/5 bg-white/80 px-4 outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div>
            <label className="label" htmlFor="nx">
              Note (flashcard back)
            </label>
            <textarea id="nx" rows={5} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Paste or type what you learned…" className="mt-1 w-full rounded-2xl border border-black/5 bg-white/80 p-4 leading-relaxed outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div>
            <p className="label mb-2">Domain</p>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((d) => (
                <button key={d.id} onClick={() => setForm({ ...form, d: d.id })} className={cx('h-10 rounded-xl px-3 text-sm font-semibold transition', form.d === d.id ? 'text-white' : '')} style={form.d === d.id ? { background: d.color } : { background: d.soft, color: d.color }}>
                  {d.emoji} {d.short}
                </button>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-brand-600/[.06] p-3">
            <input type="checkbox" checked={form.flash} onChange={(e) => setForm({ ...form, flash: e.target.checked })} className="h-5 w-5 accent-brand-600" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Turn this note into a flashcard</span>
          </label>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={save} disabled={!form.title.trim() || !form.text.trim()}>
              Save note
            </Button>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {s.notes.length > 0 && (
        <>
          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
            {[{ id: 'all', short: 'All', emoji: '✨' }, ...DOMAINS].map((d) => (
              <button key={d.id} onClick={() => setFilter(d.id)} className={cx('h-10 shrink-0 rounded-xl px-3 text-sm font-semibold transition', filter === d.id ? 'bg-brand-600 text-white' : 'glass text-slate-600 dark:text-slate-300')}>
                {d.emoji} {d.short}
              </button>
            ))}
          </div>
          {flashCount > 0 && (
            <Button variant="soft" className="mb-4 w-full" onClick={() => go('flash/notes')}>
              <Layers size={18} /> Study my {flashCount} note flashcards
            </Button>
          )}
        </>
      )}

      <div className="space-y-3">
        {list.map((n) => (
          <Card key={n.id} className="!p-4">
            <div className="flex items-start justify-between gap-2">
              <DomainChip d={DOMAIN[n.d]} />
              <div className="flex gap-1">
                <button onClick={() => setForm({ ...n })} aria-label="Edit note" className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-black/5 dark:hover:bg-white/10">
                  <Pencil size={16} />
                </button>
                <button onClick={() => remove(n.id)} aria-label="Delete note" className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="mt-2 font-semibold text-slate-900 dark:text-white">{n.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{n.text}</p>
            <button onClick={() => toggleFlash(n.id)} className={cx('mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold', n.flash ? 'bg-brand-600/10 text-brand-700 dark:text-violet-200' : 'bg-black/5 text-slate-500 dark:bg-white/5')}>
              <Layers size={14} /> {n.flash ? 'In flashcards' : 'Make flashcard'}
            </button>
          </Card>
        ))}
        {s.notes.length === 0 && !form && (
          <Card className="text-center">
            <Elephant size={110} className="mx-auto animate-float" />
            <p className="mt-3 font-display text-lg font-semibold text-slate-900 dark:text-white">No notes yet</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Copy important parts of The RBT Manual here, tag the domain, and study them as flashcards.</p>
            <Button className="mt-4" onClick={() => setForm({ ...EMPTY })}>
              <Plus size={18} /> Write my first note
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
