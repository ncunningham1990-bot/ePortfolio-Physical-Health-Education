// Progress backup, restore and migration. Pure functions (no page access) so they are easy to test.
// A backup file holds only what the app saves on the device. It never contains a name or email.

export const FORMAT = 1;      // backup file format
export const STATE_VERSION = 2; // 2 = permanent IDs instead of positions

const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const NON_WRITTEN_TRACKED = new Set(["quiz", "match", "fill", "order", "label"]);

// copy JSON-like data safely: drops odd keys, limits sizes and depth
export function clean(v, depth = 0) {
  if (depth > 7) return undefined;
  if (typeof v === "string") return v.slice(0, 20000);
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "boolean" || v === null) return v;
  if (Array.isArray(v)) return v.slice(0, 500).map((x) => clean(x, depth + 1));
  if (isObj(v)) {
    const out = {};
    for (const k of Object.keys(v).slice(0, 3000)) if (!BAD_KEYS.has(k) && k.length < 200) { const c = clean(v[k], depth + 1); if (c !== undefined) out[k] = c; }
    return out;
  }
  return undefined;
}

// ----- migration: positions (1-7) to permanent IDs -----
export function migrateState(state, manifest) {
  if ((state.v || 1) >= STATE_VERSION) return state;
  const units = (manifest && manifest.units) || [];
  const pageAt = (a, b) => units[a - 1] && units[a - 1].pages[b - 1];
  const lessons = {};
  for (const [k, val] of Object.entries(state.lessons || {})) {
    const m = k.match(/^(\d+)-(\d+)$/);
    const page = m && pageAt(+m[1], +m[2]);
    if (page && page.id) { if (val) lessons[page.id] = true; } else if (!m) lessons[k] = val;
  }
  const widgets = {};
  for (const [k, val] of Object.entries(state.widgets || {})) {
    const m = k.match(/^(\d+)-(\d+)#(W?)(\d+)$/);
    if (!m) { widgets[k] = val; continue; }
    const page = pageAt(+m[1], +m[2]);
    if (!page || !page.widgets) continue;
    const list = page.widgets.filter((w) => (m[3] ? w.t === "written" : NON_WRITTEN_TRACKED.has(w.t)));
    const w = list[+m[4]];
    if (w && val) widgets[`${page.id}#${w.id}`] = true;
  }
  return { ...state, lessons, widgets, tracker: {}, v: STATE_VERSION };
}

// ----- backup file -----
export function makeBackup(state, now = new Date()) {
  const { backup, ...data } = state; // the backup reminder settings belong to this device only
  return JSON.stringify({ app: "phe-eportfolio-hub", format: FORMAT, savedAt: now.toISOString(), data }, null, 1);
}
export const backupFileName = (now = new Date()) => `phe-hub-progress-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.json`;

// read and check a backup file's text. Returns { ok, error, data, savedAt }
export function parseBackup(text, blank) {
  if (typeof text !== "string" || text.length > 2_000_000) return { ok: false, error: "That file is too large to be a progress backup." };
  let raw;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: "That file is not a progress backup (it could not be read)." }; }
  if (!isObj(raw) || raw.app !== "phe-eportfolio-hub" || !isObj(raw.data)) return { ok: false, error: "That file was not made by this app." };
  if (typeof raw.format !== "number" || raw.format > FORMAT) return { ok: false, error: "That backup is from a newer version of the app. Update the app and try again." };
  const d = clean(raw.data) || {};
  const base = blank();
  const num = (o, keys) => Object.fromEntries(keys.map((k) => [k, Number.isFinite(o && o[k]) ? o[k] : 0]));
  const data = {
    ...base,
    v: Number.isFinite(d.v) ? d.v : 1,
    widgets: isObj(d.widgets) ? d.widgets : {}, lessons: isObj(d.lessons) ? d.lessons : {}, written: isObj(d.written) ? d.written : {},
    tracker: isObj(d.tracker) ? d.tracker : {}, tools: { smart: {}, planner: {}, ...(isObj(d.tools) ? d.tools : {}) },
    clock: { best: {}, plays: 0, top: 0, ...(isObj(d.clock) ? d.clock : {}) }, clinic: isObj(d.clinic) ? d.clinic : {},
    stats: { ...base.stats, ...num(d.stats, Object.keys(base.stats)) },
    badges: isObj(d.badges) ? d.badges : {},
    streak: { count: Number.isFinite(d.streak && d.streak.count) ? d.streak.count : 0, last: typeof (d.streak && d.streak.last) === "string" ? d.streak.last : "" },
    last: typeof d.last === "string" && /^#unit\/\d+\/\d+$/.test(d.last) ? d.last : "",
  };
  return { ok: true, data, savedAt: typeof raw.savedAt === "string" ? raw.savedAt : "" };
}

// a short description of a state, shown before restoring
export function describe(state) {
  const done = (o) => Object.values(o || {}).filter(Boolean).length;
  return { lessons: done(state.lessons), badges: Object.keys(state.badges || {}).length, activities: (state.stats && state.stats.done) || 0, ticks: Object.values(state.tracker || {}).reduce((n, t) => n + Object.keys(t || {}).length, 0) };
}

// ----- merging a backup into this device's progress -----
const dayNum = (s) => { const m = String(s).match(/^(\d+)-(\d+)-(\d+)$/); return m ? +m[1] * 10000 + +m[2] * 100 + +m[3] : 0; };
const empty = (v) => v == null || v === "" || v === false || (Array.isArray(v) && !v.length) || (isObj(v) && !Object.keys(v).length);
// device values win; the backup only fills gaps
function fill(device, incoming) {
  if (empty(device)) return incoming;
  if (isObj(device) && isObj(incoming)) {
    const out = { ...device };
    for (const k of Object.keys(incoming)) out[k] = k in device ? fill(device[k], incoming[k]) : incoming[k];
    return out;
  }
  if (Array.isArray(device) && Array.isArray(incoming) && device.some(isObj)) return device.map((x, i) => (i < incoming.length ? fill(x, incoming[i]) : x));
  return device;
}
const union = (a, b) => ({ ...a, ...Object.fromEntries(Object.entries(b || {}).filter(([, v]) => v)) });
const maxOf = (a, b) => Math.max(+a || 0, +b || 0);

export function mergeStates(device, incoming) {
  const out = { ...device };
  out.lessons = union(device.lessons, incoming.lessons);
  out.widgets = union(device.widgets, incoming.widgets);
  const tr = { ...device.tracker };
  for (const [task, items] of Object.entries(incoming.tracker || {})) tr[task] = union(tr[task] || {}, items);
  out.tracker = tr;
  const badges = { ...device.badges };
  for (const [id, t] of Object.entries(incoming.badges || {})) badges[id] = id in badges ? Math.min(badges[id], t) : t;
  out.badges = badges;
  const written = { ...device.written };
  for (const [id, w] of Object.entries(incoming.written || {})) if (!written[id] || (w && w.submitted && !written[id].submitted)) written[id] = w;
  out.written = written;
  const best = { ...device.clock.best };
  for (const [k, v] of Object.entries(incoming.clock.best || {})) best[k] = maxOf(best[k], v);
  out.clock = { best, plays: maxOf(device.clock.plays, incoming.clock.plays), top: maxOf(device.clock.top, incoming.clock.top) };
  const clinic = { ...device.clinic };
  for (const [id, c] of Object.entries(incoming.clinic || {})) clinic[id] = clinic[id] ? { stars: maxOf(clinic[id].stars, c.stars), best: maxOf(clinic[id].best, c.best), max: maxOf(clinic[id].max, c.max) } : c;
  out.clinic = clinic;
  out.stats = Object.fromEntries(Object.keys({ ...device.stats, ...incoming.stats }).map((k) => [k, maxOf(device.stats[k], incoming.stats[k])]));
  const a = device.streak || { count: 0, last: "" }, b = incoming.streak || { count: 0, last: "" };
  out.streak = dayNum(b.last) > dayNum(a.last) || (dayNum(b.last) === dayNum(a.last) && b.count > a.count) ? b : a;
  out.tools = { smart: fill(device.tools.smart, incoming.tools.smart), planner: fill(device.tools.planner, incoming.tools.planner) };
  out.last = device.last || incoming.last || "";
  return out;
}
