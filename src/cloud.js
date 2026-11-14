// Cloud save with Supabase. The browser only calls two database functions
// (rbt_load / rbt_save) that check the name + PIN; the table itself is locked.
const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY_ = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const cloudEnabled = Boolean(URL_ && KEY_);

const LINK = 'andrea-rbt-cloud';

export function getLink() {
  try {
    return JSON.parse(localStorage.getItem(LINK) || 'null');
  } catch {
    return null;
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

async function rpc(fn, args) {
  const body = JSON.stringify(args);
  const headers = { apikey: KEY_, 'Content-Type': 'application/json' };
  if (KEY_.startsWith('eyJ')) headers.Authorization = `Bearer ${KEY_}`;
  let res;
  try {
    res = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body, keepalive: body.length < 60000 });
  } catch {
    throw new Error('offline');
  }
  if (!res.ok) {
    const text = await res.text();
    if (text.includes('wrong_pin')) throw new Error('wrong_pin');
    if (text.includes('locked')) throw new Error('locked');
    throw new Error('server');
  }
  return res.json();
}

export const normalizeProfile = (name) => name.trim().toLowerCase().replace(/\s+/g, ' ');

// Returns { data, updated_at } or null when the profile doesn't exist yet.
export const cloudLoad = (link) => rpc('rbt_load', { p_profile: link.profile, p_pin: link.pin });
export const cloudSave = (link, data) => rpc('rbt_save', { p_profile: link.profile, p_pin: link.pin, p_data: data });
