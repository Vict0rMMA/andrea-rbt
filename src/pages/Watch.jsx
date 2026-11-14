import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Check, X, Trash2, ChevronRight, ExternalLink } from 'lucide-react';
import { useStore, addXP, markStudy } from '../store.jsx';
import { DOMAINS, DOMAIN } from '../data/domains.js';
import { lessonsByDomain } from '../data/lessons.js';
import { LESSON, lessonParts, lessonSpeech } from '../data/speech.js';
import CONFIG_VIDEOS from '../data/videos.json';
import { EXPLAINERS } from './Explainers.jsx';
import { go, playLesson, speak, stopSpeaking, celebrate } from '../lib.js';
import { XP, sfx } from '../fun.js';
import { Card, Button, PageTitle, Mia, MiaSays, BackButton, DomainBadge, DomainChip, Bar, cx } from '../components/ui.jsx';
import { ytSearch } from './Learn.jsx';

// ───────── Hub ─────────
export function Watch() {
  const { s } = useStore();
  const [d, setD] = useState('A');
  const lessons = lessonsByDomain(d);
  const watched = lessons.filter((l) => s.watched[l.id]).length;
  return (
    <div className="space-y-6">
      <PageTitle title="Watch" sub="Videos, animations and audio" />

      <section>
        <h2 className="mb-1 font-display text-lg font-semibold text-slate-900 dark:text-white">Animated explainers</h2>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">The trickiest ideas, step by step.</p>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {EXPLAINERS.map((e) => (
            <Card key={e.id} as="button" onClick={() => go(`watch/explain/${e.id}`)} className="tap w-44 shrink-0 !p-4 text-left">
              <div className="mb-3 grid h-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-600/15 to-accent/20">
                <Play size={28} className="text-brand-600 dark:text-violet-300" />
              </div>
              <p className="font-semibold leading-tight text-slate-900 dark:text-white">{e.title}</p>
              <p className="mt-1 text-xs text-slate-400">{s.explainers[e.id] ? 'Watched' : `${e.steps} steps`}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Video lessons with Mia</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {watched}/{lessons.length} watched in this topic
            </p>
          </div>
          <Button variant="soft" size="sm" onClick={() => go(`watch/podcast/${d}`)}>
            Podcast mode
          </Button>
        </div>
        <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
          {DOMAINS.map((x) => (
            <button key={x.id} onClick={() => setD(x.id)} className={cx('h-10 shrink-0 rounded-xl px-3 text-sm font-semibold transition', d === x.id ? 'text-white' : 'glass text-slate-600 dark:text-slate-300')} style={d === x.id ? { background: x.color } : undefined}>
              {x.id} · {x.short}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {lessons.map((l, i) => (
            <Card key={l.id} as="button" onClick={() => go(`watch/lesson/${l.id}`)} className="tap flex w-full items-center gap-3 !p-3 text-left">
              <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-xl', s.watched[l.id] ? 'bg-emerald-500 text-white' : 'bg-brand-600/10 text-brand-600 dark:text-violet-300')}>{s.watched[l.id] ? <Check size={20} /> : <Play size={18} />}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900 dark:text-white">{l.title}</span>
                <span className="text-xs text-slate-400">Lesson {i + 1} · about 1 min</span>
              </span>
            </Card>
          ))}
        </div>
      </section>

      <YouTubeLibrary />
    </div>
  );
}

// Mia video lessons now live in SlideLesson.jsx (slides + voice).
export { LessonVideo } from './SlideLesson.jsx';

// ───────── Podcast mode ─────────
export function Podcast({ domain }) {
  const d = DOMAIN[domain] || DOMAINS[0];
  const lessons = lessonsByDomain(d.id);
  const { s, update } = useStore();
  const [i, setI] = useState(0);
  const [status, setStatus] = useState('idle');
  const audio = useRef(null);
  const iRef = useRef(0);

  useEffect(() => () => stopSpeaking(), []);

  const playAt = (k) => {
    if (k >= lessons.length) {
      setStatus('done');
      sfx('win');
      return;
    }
    iRef.current = k;
    setI(k);
    setStatus('loading');
    const l = lessons[k];
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({ title: l.title, artist: 'Coach Mia', album: `RBT · ${d.name}` });
        navigator.mediaSession.setActionHandler('nexttrack', () => playAt(iRef.current + 1));
        navigator.mediaSession.setActionHandler('previoustrack', () => playAt(Math.max(0, iRef.current - 1)));
      } catch {
        /* not supported */
      }
    }
    audio.current = playLesson(l.id, false, lessonSpeech(l), {
      rate: s.rate,
      onStart: () => setStatus('playing'),
      onEnd: (ok) => {
        if (ok === false) return setStatus('idle');
        update((n) => {
          markStudy(n);
          addXP(n, 3);
        });
        playAt(k + 1);
      },
    });
  };

  const toggle = () => {
    if (status === 'idle' || status === 'done') return playAt(status === 'done' ? 0 : i);
    if (status === 'playing') {
      if (audio.current && !audio.current.paused) audio.current.pause();
      else stopSpeaking();
      setStatus('paused');
    } else if (status === 'paused') {
      if (audio.current && audio.current.src) {
        audio.current.play();
        setStatus('playing');
      } else playAt(i);
    }
  };

  return (
    <div>
      <BackButton onClick={() => go('watch')} label="Watch" />
      <PageTitle title="Podcast mode" sub="Mia reads every lesson, one after another. Great for the bus." />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {DOMAINS.map((x) => (
          <button
            key={x.id}
            onClick={() => {
              stopSpeaking();
              go(`watch/podcast/${x.id}`);
            }}
            className={cx('h-10 shrink-0 rounded-xl px-3 text-sm font-semibold', d.id === x.id ? 'text-white' : 'glass text-slate-600 dark:text-slate-300')}
            style={d.id === x.id ? { background: x.color } : undefined}
          >
            {x.id} · {x.short}
          </button>
        ))}
      </div>
      <Card className="flex flex-col items-center text-center">
        <Mia size={110} className={status === 'playing' ? 'talking' : 'animate-float'} />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">{status === 'done' ? 'All done' : `Now playing · ${i + 1}/${lessons.length}`}</p>
        <p className="mt-1 font-display text-xl font-semibold text-slate-900 dark:text-white">{status === 'done' ? `You listened to all of ${d.short}!` : lessons[i].title}</p>
        <div className="mt-5 flex items-center gap-4">
          <button onClick={() => playAt(Math.max(0, i - 1))} aria-label="Previous" className="grid h-12 w-12 place-items-center rounded-full bg-brand-600/10 text-brand-700 dark:text-violet-200">
            <SkipBack size={20} />
          </button>
          <button onClick={toggle} aria-label={status === 'playing' ? 'Pause' : 'Play'} className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-accent text-white shadow-lg">
            {status === 'loading' ? <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-white border-t-transparent" /> : status === 'playing' ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>
          <button onClick={() => playAt(i + 1)} aria-label="Next" className="grid h-12 w-12 place-items-center rounded-full bg-brand-600/10 text-brand-700 dark:text-violet-200">
            <SkipForward size={20} />
          </button>
        </div>
      </Card>
      <div className="mt-4 space-y-2">
        {lessons.map((l, k) => (
          <button key={l.id} onClick={() => playAt(k)} className={cx('flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition', k === i && status !== 'done' ? 'bg-brand-600/10 font-semibold text-brand-700 dark:text-violet-200' : 'text-slate-600 dark:text-slate-300')}>
            <span className="w-6 text-sm text-slate-400">{k + 1}</span>
            {l.title}
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────── YouTube library ─────────
export function parseYouTube(url) {
  const m = String(url).trim().match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/) || String(url).trim().match(/^([A-Za-z0-9_-]{11})$/);
  return m ? m[1] : null;
}

function YouTubeLibrary() {
  const { s, update } = useStore();
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [d, setD] = useState('A');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const all = [...CONFIG_VIDEOS.map((v) => ({ id: `cfg-${v.youtubeId}`, yt: v.youtubeId, title: v.title, d: v.domain, fixed: true })), ...s.videos];

  const add = async (e) => {
    e.preventDefault();
    const yt = parseYouTube(link);
    if (!yt) return setErr('That doesn\'t look like a YouTube link.');
    setErr('');
    setBusy(true);
    let name = title.trim();
    if (!name) {
      try {
        const r = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${yt}`)}`);
        const j = await r.json();
        name = j.title || '';
      } catch {
        /* offline: use a default title */
      }
    }
    update((n) => {
      n.videos = [...n.videos, { id: Date.now().toString(36), yt, title: name || 'My video', d, watched: false }];
    });
    setBusy(false);
    setLink('');
    setTitle('');
  };

  return (
    <section>
      <h2 className="mb-1 font-display text-lg font-semibold text-slate-900 dark:text-white">My YouTube videos</h2>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Found a good video? Paste the link to save it here.</p>
      <Card className="mb-3 space-y-3 !p-4">
        <form onSubmit={add} className="space-y-3">
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste a YouTube link" className="h-12 w-full rounded-2xl border border-black/5 bg-white/80 px-4 outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/10" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className="h-12 w-full rounded-2xl border border-black/5 bg-white/80 px-4 outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/10" />
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map((x) => (
              <button type="button" key={x.id} onClick={() => setD(x.id)} className="h-9 rounded-xl px-3 text-sm font-semibold" style={d === x.id ? { background: x.color, color: '#fff' } : { background: x.soft, color: x.color }}>
                {x.id} · {x.short}
              </button>
            ))}
          </div>
          {err && <p className="text-sm text-rose-500">{err}</p>}
          <Button type="submit" className="w-full" disabled={!link.trim() || busy}>
            {busy ? 'Saving...' : 'Add video'}
          </Button>
        </form>
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-black/5 pt-3 text-sm dark:border-white/10">
          <span className="text-slate-400">Find videos:</span>
          {DOMAINS.map((x) => (
            <a key={x.id} href={ytSearch(x.name)} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 dark:text-violet-300">
              {x.short}
            </a>
          ))}
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {all.map((v) => (
          <Card key={v.id} as="button" onClick={() => go(`watch/yt/${v.id}`)} className="tap overflow-hidden !p-0 text-left">
            <div className="relative aspect-video bg-black/10">
              <img src={`https://i.ytimg.com/vi/${v.yt}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white">
                  <Play size={22} className="ml-0.5" />
                </span>
              </span>
              {v.watched && <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">Watched</span>}
            </div>
            <div className="flex items-center gap-2 p-3">
              <DomainBadge d={DOMAIN[v.d]} size={28} />
              <p className="line-clamp-2 flex-1 text-sm font-semibold text-slate-900 dark:text-white">{v.title}</p>
            </div>
          </Card>
        ))}
      </div>
      {!all.length && <p className="text-center text-sm text-slate-400">No videos yet.</p>}
    </section>
  );
}

export function YouTubeVideo({ id }) {
  const { s, update } = useStore();
  const cfg = CONFIG_VIDEOS.map((v) => ({ id: `cfg-${v.youtubeId}`, yt: v.youtubeId, title: v.title, d: v.domain, fixed: true }));
  const v = [...cfg, ...s.videos].find((x) => x.id === id);
  const [show, setShow] = useState(false);
  if (!v) return <p>Video not found.</p>;
  const d = DOMAIN[v.d];
  const watched = v.watched || s.watched[`yt-${v.yt}`];

  const markWatched = () => {
    update((n) => {
      if (v.fixed) n.watched = { ...n.watched, [`yt-${v.yt}`]: Date.now() };
      else n.videos = n.videos.map((x) => (x.id === v.id ? { ...x, watched: true } : x));
      addXP(n, XP.video);
      markStudy(n);
    });
    go(`quiz/check-${v.d}`);
  };

  return (
    <div>
      <BackButton onClick={() => go('watch')} label="Watch" />
      <DomainChip d={d} />
      <h1 className="mb-4 mt-2 font-display text-xl font-bold text-slate-900 dark:text-white">{v.title}</h1>
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-xl">
        {show ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${v.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={v.title}
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button onClick={() => setShow(true)} className="group relative h-full w-full" aria-label="Play video">
            <img src={`https://i.ytimg.com/vi/${v.yt}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-90" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-brand-700 shadow-xl transition group-active:scale-95">
                <Play size={28} className="ml-1" />
              </span>
            </span>
          </button>
        )}
      </div>
      <Card className="mt-4">
        <MiaSays>When you finish, I'll ask you 3 quick questions about {d.name}.</MiaSays>
        <Button className="mt-4 w-full" size="lg" onClick={markWatched}>
          <Check size={18} /> {watched ? 'Check me again' : 'I watched it! Quiz me'}
        </Button>
        {!v.fixed && (
          <Button
            variant="danger"
            size="sm"
            className="mt-3"
            onClick={() => {
              update((n) => void (n.videos = n.videos.filter((x) => x.id !== v.id)));
              go('watch');
            }}
          >
            <Trash2 size={16} /> Remove video
          </Button>
        )}
      </Card>
    </div>
  );
}

