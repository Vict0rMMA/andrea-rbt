import { lazy, Suspense, useEffect, useState } from 'react';
import { Home as HomeIcon, BookOpen, PlayCircle, Layers, User, Moon, Sun } from 'lucide-react';
import { useStore } from './store.jsx';
import { stopSpeaking } from './lib.js';
import { BadgeToast, Logo, ElephantParade, Mia, cx } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import { Learn, LessonViewer, CheatSheet, Glossary } from './pages/Learn.jsx';
import { Practice, FlashSession } from './pages/Practice.jsx';
import QuizRunner from './pages/Quiz.jsx';
import { Me, Notes, Avatar } from './pages/Me.jsx';

// Heavy screens load only when opened (faster on phones).
const Watch = lazy(() => import('./pages/Watch.jsx').then((m) => ({ default: m.Watch })));
const LessonVideo = lazy(() => import('./pages/Watch.jsx').then((m) => ({ default: m.LessonVideo })));
const Podcast = lazy(() => import('./pages/Watch.jsx').then((m) => ({ default: m.Podcast })));
const YouTubeVideo = lazy(() => import('./pages/Watch.jsx').then((m) => ({ default: m.YouTubeVideo })));
const ExplainerPlayer = lazy(() => import('./pages/Explainers.jsx').then((m) => ({ default: m.ExplainerPlayer })));
const GamesHub = lazy(() => import('./pages/Games.jsx').then((m) => ({ default: m.GamesHub })));
const Game = lazy(() => import('./pages/Games.jsx').then((m) => ({ default: m.Game })));
const Exam = lazy(() => import('./pages/Exam.jsx').then((m) => ({ default: m.Exam })));
const ExamRunner = lazy(() => import('./pages/Exam.jsx').then((m) => ({ default: m.ExamRunner })));
const ExamResults = lazy(() => import('./pages/Exam.jsx').then((m) => ({ default: m.ExamResults })));
const RoadMap = lazy(() => import('./pages/Extra.jsx').then((m) => ({ default: m.RoadMap })));
const DaySummary = lazy(() => import('./pages/Extra.jsx').then((m) => ({ default: m.DaySummary })));
const Report = lazy(() => import('./pages/Extra.jsx').then((m) => ({ default: m.Report })));
const Chat = lazy(() => import('./pages/Chat.jsx'));
const Badges = lazy(() => import('./pages/Extra.jsx').then((m) => ({ default: m.Badges })));

// Tiny hash router: #/learn/A?l=A-opdef
function useRoute() {
  const get = () => window.location.hash.replace(/^#\/?/, '') || 'home';
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => {
      stopSpeaking();
      setRoute(get());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

const TABS = [
  { id: 'home', label: 'Home', Icon: HomeIcon, match: ['home', 'map', 'summary'] },
  { id: 'learn', label: 'Learn', Icon: BookOpen, match: ['learn', 'cheatsheet', 'glossary'] },
  { id: 'watch', label: 'Watch', Icon: PlayCircle, match: ['watch'] },
  { id: 'practice', label: 'Practice', Icon: Layers, match: ['practice', 'flash', 'quiz', 'games', 'game', 'exam', 'chat'] },
  { id: 'me', label: 'Me', Icon: User, match: ['me', 'notes', 'badges', 'report'] },
];

function Screen({ route }) {
  const [path, qs] = route.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  const [a, b, c] = path.split('/');
  switch (a) {
    case 'learn':
      return b ? <LessonViewer domain={b} query={query} key={route} /> : <Learn />;
    case 'cheatsheet':
      return <CheatSheet />;
    case 'glossary':
      return <Glossary />;
    case 'watch':
      if (b === 'lesson') return <LessonVideo id={c} />;
      if (b === 'podcast') return <Podcast domain={c} key={c} />;
      if (b === 'explain') return <ExplainerPlayer id={c} key={c} />;
      if (b === 'yt') return <YouTubeVideo id={c} />;
      return <Watch />;
    case 'practice':
      return <Practice tab={b} />;
    case 'flash':
      return <FlashSession deck={b || 'all'} query={query} key={route} />;
    case 'quiz':
      return <QuizRunner mode={b} key={route} />;
    case 'chat':
      return <Chat query={query} key={route} />;
    case 'games':
      return <GamesHub />;
    case 'game':
      return <Game id={b} key={route} />;
    case 'exam':
      if (b === 'run') return <ExamRunner />;
      if (b === 'results') return <ExamResults />;
      return <Exam />;
    case 'map':
      return <RoadMap />;
    case 'summary':
      return <DaySummary />;
    case 'report':
      return <Report />;
    case 'badges':
      return <Badges />;
    case 'me':
      return <Me />;
    case 'notes':
      return <Notes />;
    default:
      return <Home />;
  }
}

function ThemeToggle({ className }) {
  const { s, update } = useStore();
  const dark = s.skin === 'galaxy' || (s.theme ? s.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <button
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() =>
        update((n) => {
          n.theme = dark ? 'light' : 'dark';
          if (n.skin === 'galaxy' && dark) n.skin = 'lavender';
        })
      }
      className={cx('grid h-11 w-11 place-items-center rounded-2xl text-brand-600 transition hover:bg-brand-600/10 active:scale-95 dark:text-violet-300 dark:hover:bg-white/10', className)}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Mia size={70} className="animate-float" />
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const first = route.split('?')[0].split('/')[0];
  const active = TABS.find((t) => t.match.includes(first))?.id || 'home';
  const focusMode = route === 'exam/run';

  return (
    <div className="min-h-[100dvh]">
      <div className="bg-blobs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <BadgeToast />

      {!focusMode && (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col p-5 md:flex">
          <div className="glass flex h-full flex-col rounded-3xl p-4">
            <a href="#/me" className="mb-8 flex items-center gap-3 px-2 pt-1">
              <Avatar size={46} />
              <div>
                <p className="font-display text-lg font-bold leading-tight text-slate-900 dark:text-white">Andrea RBT</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">You've got this</p>
              </div>
            </a>
            <nav className="flex flex-col gap-1">
              {TABS.map(({ id, label, Icon }) => (
                <a
                  key={id}
                  href={`#/${id}`}
                  aria-current={active === id ? 'page' : undefined}
                  className={cx('flex h-12 items-center gap-3 rounded-2xl px-4 font-semibold transition', active === id ? 'bg-gradient-to-r from-brand-600 to-accent text-white shadow-lg shadow-brand-600/25' : 'text-slate-600 hover:bg-brand-600/10 dark:text-slate-300 dark:hover:bg-white/10')}
                >
                  <Icon size={20} /> {label}
                </a>
              ))}
            </nav>
            <ElephantParade className="mb-4 mt-auto" />
            <div className="flex items-center justify-between px-2">
              <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Logo size={22} /> Theme
              </span>
              <ThemeToggle />
            </div>
          </div>
        </aside>
      )}

      {!focusMode && (
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 pb-2 pt-[calc(env(safe-area-inset-top)+10px)] backdrop-blur-xl md:hidden">
          <a href="#/home" className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="font-display text-lg font-bold text-slate-900 dark:text-white">Andrea RBT</span>
          </a>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <a href="#/me" aria-label="My profile">
              <Avatar size={36} />
            </a>
          </div>
        </header>
      )}

      <main className={cx('mx-auto w-full max-w-3xl px-4 pb-32 pt-2 md:pb-12 md:pt-8', !focusMode && 'md:ml-64 md:mr-0 md:w-auto md:max-w-none md:px-10 lg:px-14')}>
        <div className={cx(!focusMode && 'mx-auto max-w-4xl')} key={route.split('?')[0].split('/').slice(0, 2).join('/')}>
          <div className="animate-rise">
            <Suspense fallback={<Loading />}>
              <Screen route={route} />
            </Suspense>
          </div>
        </div>
      </main>

      {!focusMode && (
        <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-safe md:hidden" aria-label="Main">
          <div className="glass-strong mx-auto mb-2 flex max-w-md items-stretch justify-between rounded-3xl p-1.5 shadow-xl shadow-brand-900/10">
            {TABS.map(({ id, label, Icon }) => (
              <a
                key={id}
                href={`#/${id}`}
                aria-current={active === id ? 'page' : undefined}
                className={cx('flex min-h-[54px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold transition active:scale-95', active === id ? 'bg-gradient-to-br from-brand-600 to-accent text-white shadow-md' : 'text-slate-500 dark:text-slate-400')}
              >
                <Icon size={21} strokeWidth={active === id ? 2.4 : 2} />
                {label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
