// Auto-update: no need to press F5.
// Every few minutes (and when she comes back to the app) we check if a new version was published.
// If there is one, the app reloads by itself at a safe moment: when she changes screens or
// returns to the app — never in the middle of a quiz answer or the mock exam.

const CHECK_EVERY = 3 * 60 * 1000;
let pending = false;

const currentBuild = () => document.querySelector('script[type="module"][src*="/assets/index-"]')?.getAttribute('src') || null;

async function check() {
  const mine = currentBuild();
  if (!mine || pending) return;
  try {
    const html = await (await fetch(`/?v=${Date.now()}`, { cache: 'no-store' })).text();
    const live = html.match(/\/assets\/index-[^"']+\.js/)?.[0];
    if (live && !mine.endsWith(live)) pending = true;
  } catch {
    /* offline: try later */
  }
  try {
    (await navigator.serviceWorker?.getRegistration())?.update();
  } catch {
    /* ignore */
  }
}

const busy = () => /^#\/(exam\/run|quiz\/|game\/)/.test(window.location.hash);

function reloadIfSafe() {
  if (pending && !busy()) window.location.reload();
}

export function startAutoUpdate() {
  if (!import.meta.env.PROD) return;
  setTimeout(check, 20000);
  setInterval(check, CHECK_EVERY);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      reloadIfSafe();
      check();
    }
  });
  window.addEventListener('focus', check);
  // Changing screens is a good moment to switch to the new version.
  window.addEventListener('hashchange', () => setTimeout(reloadIfSafe, 50));
}
