import { useEffect, useState } from 'react';
import { Home as HomeIcon, BookOpen, Layers, Timer, User, Moon, Sun } from 'lucide-react';
import { useStore } from './store.jsx';
import { stopSpeaking } from './lib.js';
export { go } from './lib.js';
import { BadgeToast, Logo, ElephantParade, cx } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import { Learn, LessonViewer, CheatSheet } from './pages/Learn.jsx';
import { Practice, FlashSession } from './pages/Practice.jsx';
import QuizRunner from './pages/Quiz.jsx';
import { Exam, ExamRunner, ExamResults } from './pages/Exam.jsx';
import { Me, Notes } from './pages/Me.jsx';

// Tiny hash router: #/learn/A, #/quiz/C, #/exam/run ...
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
  { id: 'home', label: 'Home', Icon: HomeIcon, match: ['home'] },
  { id: 'learn', label: 'Learn', Icon: BookOpen, match: ['learn', 'cheatsheet'] },
  { id: 'practice', label: 'Practice', Icon: Layers, match: ['practice', 'flash', 'quiz'] },
  { id: 'exam', label: 'Exam', Icon: Timer, match: ['exam'] },
  { id: 'me', label: 'Me', Icon: User, match: ['me', 'notes'] },
];

function Screen({ route }) {
  const [a, b] = route.split('?')[0].split('/');
  switch (a) {
    case 'learn':
      return b ? <LessonViewer domain={b} /> : <Learn />;
    case 'cheatsheet':
      return <CheatSheet />;
    case 'practice':
      return <Practice tab={b} />;
    case 'flash':
      return <FlashSession deck={b || 'all'} />;
    case 'quiz':
      return <QuizRunner mode={b} key={route} />;
    case 'exam':
      if (b === 'run') return <ExamRunner />;
      if (b === 'results') return <ExamResults />;
      return <Exam />;
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
  const dark = s.theme ? s.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  return (
    <button
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => update((n) => void (n.theme = dark ? 'light' : 'dark'))}
      className={cx('grid h-11 w-11 place-items-center rounded-2xl text-brand-600 transition hover:bg-brand-600/10 active:scale-95 dark:text-violet-300 dark:hover:bg-white/10', className)}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export default function App() {
  const route = useRoute();
  const first = route.split('/')[0];
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

      {/* Desktop sidebar */}
      {!focusMode && (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col p-5 md:flex">
          <div className="glass flex h-full flex-col rounded-3xl p-4">
            <a href="#/home" className="mb-8 flex items-center gap-3 px-2 pt-1">
              <Logo size={44} />
              <div>
                <p className="font-display text-lg font-bold leading-tight text-slate-900 dark:text-white">Andrea RBT</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">You've got this 💜</p>
              </div>
            </a>
            <nav className="flex flex-col gap-1">
              {TABS.map(({ id, label, Icon }) => (
                <a
                  key={id}
                  href={`#/${id}`}
                  aria-current={active === id ? 'page' : undefined}
                  className={cx(
                    'flex h-12 items-center gap-3 rounded-2xl px-4 font-semibold transition',
                    active === id
                      ? 'bg-gradient-to-r from-brand-600 to-fuchsia-500 text-white shadow-lg shadow-brand-600/25'
                      : 'text-slate-600 hover:bg-brand-600/10 dark:text-slate-300 dark:hover:bg-white/10'
                  )}
                >
                  <Icon size={20} /> {label}
                </a>
              ))}
            </nav>
            <ElephantParade className="mt-auto mb-4" />
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </aside>
      )}

      {/* Mobile header */}
      {!focusMode && (
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 pb-2 pt-[calc(env(safe-area-inset-top)+10px)] backdrop-blur-xl md:hidden">
          <a href="#/home" className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="font-display text-lg font-bold text-slate-900 dark:text-white">Andrea RBT</span>
          </a>
          <ThemeToggle />
        </header>
      )}

      <main className={cx('mx-auto w-full max-w-3xl px-4 pb-32 pt-2 md:pb-12 md:pt-8', !focusMode && 'md:ml-64 md:mr-0 md:w-auto md:max-w-none md:px-10 lg:px-14')}>
        <div className={cx(!focusMode && 'mx-auto max-w-4xl')} key={route.split('/').slice(0, 2).join('/')}>
          <div className="animate-rise">
            <Screen route={route} />
          </div>
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      {!focusMode && (
        <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-safe md:hidden" aria-label="Main">
          <div className="glass-strong mx-auto mb-2 flex max-w-md items-stretch justify-between rounded-3xl p-1.5 shadow-xl shadow-brand-900/10">
            {TABS.map(({ id, label, Icon }) => (
              <a
                key={id}
                href={`#/${id}`}
                aria-current={active === id ? 'page' : undefined}
                className={cx(
                  'flex min-h-[54px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold transition active:scale-95',
                  active === id ? 'bg-gradient-to-br from-brand-600 to-fuchsia-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'
                )}
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
