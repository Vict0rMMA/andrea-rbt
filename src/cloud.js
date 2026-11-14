// Cloud save with Firebase (Auth + Firestore), using the REST APIs so the app stays light.
// The app is for one person (Andrea), so it signs in automatically to her account:
// open the app on any device and it continues where she left off. Nothing to fill in.
// Firestore rules only let that account read and write its own document.
//
// Test mode: open the site with ?test=1 and nothing is saved to Andrea's cloud.
const FB = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCDR15iUMYpraAxUmC-kQ3SdSWI0Ylt1Oo',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'andrea-rbt-2026',
};
export const testMode = typeof window !== 'undefined' && /[?&]test(=|&|$)/.test(window.location.search);
export const cloudEnabled = Boolean(FB.apiKey && FB.projectId) && !testMode;

const LINK = 'andrea-rbt-cloud';
const ANDREA = { profile: 'andrea', pin: 'andrea-2026-elefante' };

export function getLink() {
  if (!cloudEnabled) return null;
  try {
    return JSON.parse(localStorage.getItem(LINK) || 'null') || ANDREA;
  } catch {
    return ANDREA;
  }
}

export function setLink(link) {
  try {
    if (link) localStorage.setItem(LINK, JSON.stringify(link));
    else localStorage.removeItem(LINK);
  } catch {
    /* private mode: link lasts for this visit only */
  }
}

export const normalizeProfile = (name) => name.trim().toLowerCase().replace(/\s+/g, ' ');
const emailFor = (profile) => `${profile.normalize('NFD').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'student'}@andrea-rbt.app`;
const passwordFor = (pin) => `rbt-${pin}-mia`; // Firebase needs 6+ characters; the PIN can be 4.

async function call(url, opts) {
  let res;
  try {
    res = await fetch(url, opts);
  } catch {
    throw new Error('offline');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error?.message || '';
    const err = new Error(/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD/.test(msg) ? 'wrong_pin' : /TOO_MANY_ATTEMPTS/.test(msg) ? 'locked' : /EMAIL_NOT_FOUND/.test(msg) ? 'not_found' : /EMAIL_EXISTS/.test(msg) ? 'exists' : res.status === 404 ? 'missing' : 'server');
    err.status = res.status;
    throw err;
  }
  return body;
}

const auth = (path, payload) =>
  call(`https://identitytoolkit.googleapis.com/v1/${path}?key=${FB.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, returnSecureToken: true }),
  });

// Signs in (or creates the account the first time). Returns a session to keep in the link.
async function session(link) {
  if (link.idToken && link.expires > Date.now() + 60000) return link;
  if (link.refreshToken) {
    try {
      const r = await call(`https://securetoken.googleapis.com/v1/token?key=${FB.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(link.refreshToken)}`,
      });
      return save({ ...link, idToken: r.id_token, refreshToken: r.refresh_token, uid: r.user_id, expires: Date.now() + Number(r.expires_in) * 1000 });
    } catch (e) {
      if (e.message === 'offline') throw e;
    }
  }
  const creds = { email: emailFor(link.profile), password: passwordFor(link.pin) };
  let r;
  try {
    r = await auth('accounts:signInWithPassword', creds);
  } catch (e) {
    // First time with this name: create the account.
    if (e.message === 'wrong_pin' || e.message === 'not_found') {
      try {
        r = await auth('accounts:signUp', creds);
      } catch (e2) {
        throw new Error(e2.message === 'exists' ? 'wrong_pin' : e2.message);
      }
    } else throw e;
  }
  return save({ ...link, idToken: r.idToken, refreshToken: r.refreshToken, uid: r.localId, expires: Date.now() + Number(r.expiresIn) * 1000 });
}

function save(link) {
  setLink(link);
  return link;
}

const docUrl = (uid) => `https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents/progress/${uid}`;

// Returns { data, updated_at } or null when there is no save yet.
export async function cloudLoad(link) {
  const s = await session(link);
  try {
    const doc = await call(docUrl(s.uid), { headers: { Authorization: `Bearer ${s.idToken}` } });
    const raw = doc.fields?.data?.stringValue;
    return raw ? { data: JSON.parse(raw), updated_at: doc.updateTime } : null;
  } catch (e) {
    if (e.message === 'missing') return null;
    throw e;
  }
}

export async function cloudSave(link, data) {
  const s = await session(getLink() || link);
  const body = JSON.stringify({
    fields: {
      data: { stringValue: JSON.stringify(data) },
      updatedAt: { integerValue: String(data.updatedAt || Date.now()) },
      name: { stringValue: link.profile },
    },
  });
  await call(docUrl(s.uid), { method: 'PATCH', headers: { Authorization: `Bearer ${s.idToken}`, 'Content-Type': 'application/json' }, body, keepalive: body.length < 60000 });
  return true;
}
