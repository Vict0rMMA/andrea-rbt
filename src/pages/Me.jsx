import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Trash2, Pencil, Plus, Moon, Sun, Monitor, Volume2, Camera, Lock, Cloud } from 'lucide-react';
import { useStore, BADGES, streak, resetAll, markStudy, todayKey, cloudEnabled } from '../store.jsx';
import { DOMAINS, DOMAIN } from '../data/domains.js';
import { LESSONS } from '../data/lessons.js';
import { go, speak, hasEnglishVoice, englishVoice } from '../lib.js';
import { levelInfo, SKINS, OUTFITS, sfx } from '../fun.js';
import { Card, Button, PageTitle, Mia, BackButton, DomainChip, Elephant, ElephantParade, Medal, Bar, cx } from '../components/ui.jsx';

// Profile photo: saved on this device (and in her private cloud save), never inside the public app.
export function Avatar({ size = 64, className }) {
  const { s } = useStore();
  const [broken, setBroken] = useState(false);
  const src = s.photo || (!broken && '/andrea.jpg');
  if (src) return <img src={src} onError={() => setBroken(true)} alt={s.name} width={size} height={size} className={cx('shrink-0 rounded-full object-cover ring-2 ring-white shadow-md dark:ring-white/20', className)} style={{ width: size, height: size }} />;
  return (
    <span className={cx('grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-accent font-display font-bold text-white shadow-md', className)} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {(s.name || 'A')[0].toUpperCase()}
    </span>
  );
}

function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const S = 320;
      const c = document.createElement('canvas');
      c.width = S;
      c.height = S;
      const side = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function Me() {
  const { s, update } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [voiceName, setVoiceName] = useState(null);
  const fileRef = useRef(null);
  const lv = levelInfo(s.xp);
  const totalMin = Math.round(Object.values(s.time).reduce((a, b) => a + b, 0) / 60);
  const earned = BADGES.filter((b) => s.badges[b.id]).length;

  useEffect(() => {
    hasEnglishVoice().then((ok) => setVoiceName(ok ? englishVoice().name : ''));
  }, []);

  const pickPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = await resizePhoto(f);
      update((n) => void (n.photo = data));
    } catch {
      window.alert('This photo format can\'t be opened here. Try a JPG or PNG photo.');
    }
    e.target.value = '';
  };

  const stats = [
    ['Day streak', streak(s)],
    ['Total XP', s.xp],
    ['Minutes', totalMin],
    ['Lessons', `${Object.keys(s.lessons).length}/${LESSONS.length}`],
    ['Questions', Object.keys(s.answers).length],
    ['Mock exams', s.exams.length],
  ];

  return (
    <div className="space-y-5">
      <PageTitle title="Me" />

      <Card className="flex items-center gap-4">
        <button onClick={() => fileRef.current?.click()} className="relative shrink-0" aria-label="Change profile photo">
          <Avatar size={84} />
          <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white shadow">
            <Camera size={16} />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
        <div className="min-w-0 flex-1">
          <input
            aria-label="Your name"
            value={s.name}
            maxLength={24}
            onChange={(e) => update((n) => void (n.name = e.target.value))}
            onBlur={(e) => !e.target.value.trim() && update((n) => void (n.name = 'Andrea'))}
            className="w-full bg-transparent font-display text-2xl font-bold text-slate-900 outline-none dark:text-white"
          />
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <label className="flex items-center gap-1">
              Age
              <input type="number" min="15" max="99" value={s.age ?? 18} onChange={(e) => update((n) => void (n.age = Number(e.target.value) || 18))} className="w-12 rounded-lg bg-brand-600/10 px-1.5 py-0.5 text-center font-semibold text-brand-700 outline-none dark:text-violet-200" />
            </label>
            <span>· Future RBT</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-brand-600 dark:text-violet-300">
            Level {lv.level} · {lv.rank}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(([k, v]) => (
          <div key={k} className="glass rounded-2xl p-3 text-center">
            <p className="font-display text-xl font-bold text-slate-900 dark:text-white">{v}</p>
            <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">{k}</p>
          </div>
        ))}
      </div>

      <CloudCard />

      <div className="space-y-2">
        {[
          ['Badges', `${earned} of ${BADGES.length} unlocked`, 'badges'],
          ['Weekly report', 'Charts and what to study next', 'report'],
          ['My notes', `${s.notes.length} notes from your book`, 'notes'],
          ['Today\'s summary', 'A card to share', 'summary'],
        ].map(([t, sub, to]) => (
          <Card key={to} as="button" onClick={() => go(to)} className="tap flex w-full items-center gap-3 !p-4 text-left">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-900 dark:text-white">{t}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{sub}</span>
            </span>
            {to === 'badges' && <Medal got={earned > 0} size={36} name="" />}
            <ChevronRight className="text-slate-400" />
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-1 font-display text-lg font-semibold text-slate-900 dark:text-white">Themes</h2>
        <p className="mb-3 text-sm text-slate-500">New themes unlock as you level up.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SKINS.map((k) => {
            const locked = lv.level < k.level;
            return (
              <button
                key={k.id}
                disabled={locked}
                onClick={() => {
                  update((n) => void (n.skin = k.id));
                  sfx('tap');
                }}
                className={cx('relative h-20 overflow-hidden rounded-2xl p-2 text-left text-sm font-bold text-white transition', s.skin === k.id && 'ring-4 ring-brand-400 ring-offset-2 ring-offset-transparent', locked && 'opacity-50')}
                style={{ background: `linear-gradient(135deg, ${k.colors[0]}, ${k.colors[1]})` }}
              >
                {k.name}
                {locked && (
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 text-xs font-semibold">
                    <Lock size={12} /> Level {k.level}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-display text-lg font-semibold text-slate-900 dark:text-white">Coach Mia's outfits</h2>
        <p className="mb-3 text-sm text-slate-500">Dress up your study buddy.</p>
        <div className="grid grid-cols-5 gap-2">
          {OUTFITS.map((o) => {
            const locked = lv.level < o.level;
            return (
              <button
                key={o.id}
                disabled={locked}
                onClick={() => {
                  update((n) => void (n.outfit = o.id));
                  sfx('tap');
                }}
                className={cx('flex flex-col items-center rounded-2xl p-2 transition', s.outfit === o.id ? 'bg-brand-600/15 ring-2 ring-brand-600' : 'bg-black/[.03] dark:bg-white/5', locked && 'opacity-40')}
                aria-label={o.name}
              >
                <Mia size={48} outfit={o.id} bg={false} />
                <span className="mt-1 text-[10px] font-semibold leading-tight text-slate-600 dark:text-slate-300">{locked ? `Lv ${o.level}` : o.name}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Settings</h2>
        <div>
          <p className="label mb-2">Light or dark</p>
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
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block font-semibold text-slate-800 dark:text-slate-100">Sounds and vibration</span>
            <span className="text-sm text-slate-500">Happy sounds when you get it right</span>
          </span>
          <input type="checkbox" checked={s.sound} onChange={(e) => update((n) => void (n.sound = e.target.checked))} className="h-6 w-6 accent-brand-600" />
        </label>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="label">Coach Mia's voice speed</p>
            <span className="text-sm font-bold text-brand-600 dark:text-violet-300">{s.rate.toFixed(2)}x</span>
          </div>
          <div className="flex items-center gap-3">
            <input type="range" min="0.75" max="1.25" step="0.05" value={s.rate} onChange={(e) => update((n) => void (n.rate = Number(e.target.value)))} className="flex-1 accent-brand-600" aria-label="Voice speed" />
            <Button variant="soft" size="sm" onClick={() => speak(`Hi ${s.name}! I'm Coach Mia. You've got this!`, s.rate)}>
              <Volume2 size={16} /> Test
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {voiceName === null ? 'Checking voices...' : voiceName ? `Device voice: ${voiceName} (English). Lessons use Mia's natural voice when online.` : 'No English voice found on this device. On iPhone: Settings > Accessibility > Spoken Content > Voices > English.'}
          </p>
        </div>
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
        Made for Andrea · Based on the BACB RBT Test Content Outline (3rd ed., 2026).
        <br />
        Study aid only. Not affiliated with the BACB.
      </p>
    </div>
  );
}

function CloudCard() {
  const { cloud } = useStore();
  if (!cloudEnabled) {
    return (
      <Card className="flex items-center gap-3 !p-4">
        <Cloud className="shrink-0 text-amber-500" />
        <p className="text-sm text-slate-500">Test mode: progress is only kept on this device.</p>
      </Card>
    );
  }
  const ok = cloud.status === 'saved';
  const time = cloud.at ? new Date(cloud.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return (
    <Card className="flex items-center gap-3 !p-4">
      <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-full', ok ? 'bg-emerald-500/15 text-emerald-600' : 'bg-brand-600/10 text-brand-600')}>
        <Cloud size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 dark:text-white">Progress saved automatically</p>
        <p className="text-sm text-slate-500">{ok ? `Last saved ${time}. Open the app on any device to continue.` : cloud.status === 'offline' ? 'No internet. It will save when you are back online.' : 'Saving...'}</p>
      </div>
    </Card>
  );
}

const EMPTY = { title: '', text: '', d: 'A', flash: true };

export function Notes() {
  const { s, update } = useStore();
  const [form, setForm] = useState(null);
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
            <textarea id="nx" rows={5} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Paste or type what you learned..." className="mt-1 w-full rounded-2xl border border-black/5 bg-white/80 p-4 leading-relaxed outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5" />
          </div>
          <div>
            <p className="label mb-2">Topic</p>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((d) => (
                <button key={d.id} onClick={() => setForm({ ...form, d: d.id })} className="h-10 rounded-xl px-3 text-sm font-semibold transition" style={form.d === d.id ? { background: d.color, color: '#fff' } : { background: d.soft, color: d.color }}>
                  {d.id} · {d.short}
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
            {[{ id: 'all', short: 'All' }, ...DOMAINS].map((d) => (
              <button key={d.id} onClick={() => setFilter(d.id)} className={cx('h-10 shrink-0 rounded-xl px-3 text-sm font-semibold transition', filter === d.id ? 'bg-brand-600 text-white' : 'glass text-slate-600 dark:text-slate-300')}>
                {d.id === 'all' ? 'All' : `${d.id} · ${d.short}`}
              </button>
            ))}
          </div>
          {flashCount > 0 && (
            <Button variant="soft" className="mb-4 w-full" onClick={() => go('flash/notes')}>
              Study my {flashCount} note flashcards
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
            <button onClick={() => toggleFlash(n.id)} className={cx('mt-3 inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-semibold', n.flash ? 'bg-brand-600/10 text-brand-700 dark:text-violet-200' : 'bg-black/5 text-slate-500 dark:bg-white/5')}>
              {n.flash ? 'In flashcards' : 'Make flashcard'}
            </button>
          </Card>
        ))}
        {s.notes.length === 0 && !form && (
          <Card className="text-center">
            <Elephant size={110} className="mx-auto animate-float" />
            <p className="mt-3 font-display text-lg font-semibold text-slate-900 dark:text-white">No notes yet</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Copy important parts of The RBT Manual here and study them as flashcards.</p>
            <Button className="mt-4" onClick={() => setForm({ ...EMPTY })}>
              <Plus size={18} /> Write my first note
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

export { Bar };
