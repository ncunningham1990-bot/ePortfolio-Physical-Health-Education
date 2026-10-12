// Parses the interactive-task blocks that teachers write inside the markdown pages.
// Used by the website (to render them) and by scripts/build.mjs (to catch typing mistakes).
//
// Wrong answers never reveal the correct answer: students get a hint and try again.
export const WIDGET_TYPES = ["quiz", "flashcards", "match", "fill", "order", "label", "video", "audio", "written"];

const lines = (s) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const splitHint = (text) => {
  const i = text.indexOf(" | ");
  return i < 0 ? [text.trim(), ""] : [text.slice(0, i).trim(), text.slice(i + 3).trim()];
};

// Q: question
// - wrong answer | hint shown when this answer is picked
// + right answer
// H: extra hint shown after a second wrong try (point the student back to a section)
// ? message shown once the answer is right
export function parseQuiz(src) {
  return src.trim().split(/\n\s*\n/).map((block) => {
    const q = { question: "", options: [], hint: "", explain: "" };
    for (const raw of block.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("Q:")) q.question = line.slice(2).trim();
      else if (/^[-+]\s/.test(line)) {
        const [text, hint] = splitHint(line.slice(2));
        q.options.push({ text, hint, correct: line[0] === "+" });
      } else if (line.startsWith("H:")) q.hint = line.slice(2).trim();
      else if (line.startsWith("?")) q.explain = line.slice(1).trim();
      else throw new Error(`quiz: unrecognised line "${line}" (use Q:, - wrong | hint, + right, H:, ?)`);
    }
    const label = q.question || block.slice(0, 40);
    if (!q.question) throw new Error(`quiz: a question has no "Q:" line near "${label}"`);
    if (q.options.length < 2) throw new Error(`quiz: "${label}" needs at least 2 options`);
    if (q.options.filter((o) => o.correct).length !== 1) throw new Error(`quiz: "${label}" needs exactly one "+" (correct) option`);
    for (const o of q.options) {
      if (!o.correct && !o.hint) throw new Error(`quiz: wrong option "${o.text}" in "${label}" needs a hint after " | "`);
    }
    return q;
  });
}

export function parseFlashcards(src) {
  return lines(src).map((l) => {
    const i = l.indexOf("::");
    if (i < 1) throw new Error(`flashcards: line needs "term :: definition": "${l}"`);
    return { front: l.slice(0, i).trim(), back: l.slice(i + 2).trim() };
  });
}

// left = right | optional hint shown when the left item is matched wrongly
export function parseMatch(src) {
  const pairs = lines(src).map((l) => {
    const i = l.indexOf(" = ");
    if (i < 1) throw new Error(`match: line needs "left = right": "${l}"`);
    const [right, hint] = splitHint(l.slice(i + 3));
    return { left: l.slice(0, i).trim(), right, hint };
  });
  if (pairs.length < 2) throw new Error("match: needs at least 2 pairs");
  return pairs;
}

// Sentence with answers in {braces}. {a|b} accepts either. {answer::hint} adds a hint shown when wrong.
export function parseFill(src) {
  return lines(src).map((l) => {
    const parts = [];
    let last = 0;
    for (const m of l.matchAll(/\{([^}]+)\}/g)) {
      parts.push({ text: l.slice(last, m.index) });
      const [ans, ...hintParts] = m[1].split("::");
      const answers = ans.split("|").map((a) => a.trim()).filter(Boolean);
      const hint = hintParts.join("::").trim();
      if (!hint) throw new Error(`fill: blank {${ans}} in "${l}" needs a hint: {answer::hint}`);
      parts.push({ answers, hint });
      last = m.index + m[0].length;
    }
    parts.push({ text: l.slice(last) });
    if (!parts.some((p) => p.answers)) throw new Error(`fill: no {answer::hint} in "${l}"`);
    return parts;
  });
}

// Q: optional instruction line, then the steps in the CORRECT order (the page shuffles them).
// Each step may end with " | hint".
export function parseOrder(src) {
  let question = "";
  const steps = [];
  for (const l of lines(src)) {
    if (l.startsWith("Q:")) question = l.slice(2).trim();
    else { const [text, hint] = splitHint(l); steps.push({ text, hint }); }
  }
  if (steps.length < 3) throw new Error("order: needs at least 3 steps");
  return { question, steps };
}

// image: path, alt: description, then numbered answers:  1 = Name | optional hint
export function parseLabel(src) {
  const out = { image: "", alt: "", items: [] };
  for (const l of lines(src)) {
    if (l.startsWith("image:")) out.image = l.slice(6).trim();
    else if (l.startsWith("alt:")) out.alt = l.slice(4).trim();
    else {
      const m = l.match(/^(\d+)\s*=\s*(.+)$/);
      if (!m) throw new Error(`label: unrecognised line "${l}" (use "image:", "alt:" or "1 = Name | hint")`);
      const [answer, hint] = splitHint(m[2]);
      out.items.push({ n: Number(m[1]), answer, hint });
    }
  }
  if (!out.image) throw new Error('label: needs an "image:" line');
  if (out.items.length < 2) throw new Error("label: needs at least 2 numbered answers");
  return out;
}

// title: ...   url: https://www.youtube.com/watch?v=...   (leave url empty for a placeholder)
export function parseVideo(src) {
  const out = { title: "Video", url: "", note: "" };
  for (const l of lines(src)) {
    const i = l.indexOf(":");
    if (i < 1) throw new Error(`video: unrecognised line "${l}"`);
    const key = l.slice(0, i).trim();
    if (!["title", "url", "note"].includes(key)) throw new Error(`video: unknown key "${key}"`);
    out[key] = l.slice(i + 1).trim();
  }
  if (out.url && !youtubeId(out.url)) throw new Error(`video: "${out.url}" is not a YouTube link`);
  return out;
}

// title: ...   url: audio/file.mp3   note: optional text under the player
export function parseAudio(src) {
  const out = { title: "Podcast", url: "", note: "" };
  for (const l of lines(src)) {
    const i = l.indexOf(":");
    if (i < 1) throw new Error(`audio: unrecognised line "${l}"`);
    const key = l.slice(0, i).trim();
    if (!["title", "url", "note"].includes(key)) throw new Error(`audio: unknown key "${key}"`);
    out[key] = l.slice(i + 1).trim();
  }
  if (!out.url) throw new Error('audio: needs a "url:" line, for example url: audio/my-podcast.mp3');
  if (!/^(https?:\/\/|audio\/)[^\s]+\.(mp3|m4a|ogg|wav)(\?.*)?$/i.test(out.url)) throw new Error(`audio: "${out.url}" must be a file in the audio folder (audio/name.mp3) or a web link ending in .mp3, .m4a, .ogg or .wav`);
  return out;
}

export function youtubeId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : "";
}


// ---------- written (higher-order) questions ----------
// Level: Apply | Analyse | Evaluate | Create
// Q: the question (may continue on following lines)
// * what a good answer includes :: keywords | alternative & both-words | stem* :: guiding prompt shown if the point is missed
// Model: an example of a strong answer (must earn every mark point: the build checks this)
// ID: optional fixed id (otherwise made from the question text)
export const LEVELS = ["Apply", "Analyse", "Evaluate", "Create"];

const hash36 = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };

export function parseWritten(src) {
  const out = { id: "", level: "Apply", question: "", points: [], model: "" };
  let field = null;
  for (const raw of src.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    let m;
    if ((m = line.match(/^Level:\s*(.+)$/i))) {
      const lv = LEVELS.find((l) => l.toLowerCase() === m[1].trim().toLowerCase());
      if (!lv) throw new Error(`written: Level must be one of ${LEVELS.join(", ")} (got "${m[1].trim()}")`);
      out.level = lv; field = null;
    } else if ((m = line.match(/^ID:\s*([\w-]+)$/i))) { out.id = m[1]; field = null; }
    else if (/^Q:/.test(line)) { out.question = line.slice(2).trim(); field = "question"; }
    else if (/^Model:/i.test(line)) { out.model = line.slice(6).trim(); field = "model"; }
    else if (line.startsWith("* ")) {
      const parts = line.slice(2).split(" :: ").map((x) => x.trim());
      if (parts.length !== 3 || parts.some((x) => !x)) throw new Error(`written: a mark point needs "* what to include :: keywords :: prompt": "${line.slice(0, 70)}"`);
      let expr;
      try { expr = parseExpr(parts[1]); } catch (e) { throw new Error(`written: keywords for "${parts[0]}": ${e.message}`); }
      out.points.push({ text: parts[0], keywords: parts[1], expr, prompt: parts[2] });
      field = null;
    } else if (field) out[field] += " " + line;
    else throw new Error(`written: unrecognised line "${line.slice(0, 60)}"`);
  }
  const label = out.question.slice(0, 50);
  if (!out.question) throw new Error('written: needs a "Q:" line');
  if (out.points.length < 2 || out.points.length > 8) throw new Error(`written: "${label}" needs 2 to 8 mark points (has ${out.points.length})`);
  if (!out.model) throw new Error(`written: "${label}" needs a "Model:" answer`);
  if (!out.id) out.id = "q" + hash36(out.question);
  return out;
}

// Keywords: a | b = either, a & b = both, ( ) group, word* = any ending. "&" binds tighter than "|".
function parseExpr(str) {
  let i = 0;
  const ws = () => { while (str[i] === " ") i++; };
  const atom = () => {
    ws();
    if (str[i] === "(") { i++; const e = or(); ws(); if (str[i] !== ")") throw new Error("missing )"); i++; return e; }
    const start = i;
    while (i < str.length && !"|&()".includes(str[i])) i++;
    const t = str.slice(start, i).trim();
    if (!t) throw new Error("an empty keyword (check the | & and brackets)");
    return { term: t };
  };
  const and = () => { const parts = [atom()]; ws(); while (str[i] === "&") { i++; parts.push(atom()); ws(); } return parts.length === 1 ? parts[0] : { and: parts }; };
  const or = () => { const parts = [and()]; ws(); while (str[i] === "|") { i++; parts.push(and()); ws(); } return parts.length === 1 ? parts[0] : { or: parts }; };
  const e = or(); ws();
  if (i < str.length) throw new Error("unexpected ) ");
  return e;
}
const evalExpr = (e, t) => (e.term ? termRegex(e.term).test(t) : e.and ? e.and.every((x) => evalExpr(x, t)) : e.or.some((x) => evalExpr(x, t)));

const normText = (s) => s.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[-\u2013\u2014_/]/g, " ").replace(/\s+/g, " ");
const escRe = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const reCache = new Map();
function termRegex(term) {
  if (!reCache.has(term)) {
    const words = normText(term).trim().split(" ").filter(Boolean).map((w) => (w.endsWith("*") ? escRe(w.slice(0, -1)) + "\\w*" : escRe(w) + "(?:s|es|ed|ing|d)?"));
    reCache.set(term, new RegExp("(?:^|\\W)" + words.join("\\W+") + "(?=$|\\W)", "i"));
  }
  return reCache.get(term);
}

// Which mark points does the answer earn? (keyword matching, so it is an estimate)
export function scoreWritten(q, text) {
  const t = normText(text);
  const matched = q.points.map((p) => evalExpr(p.expr, t));
  return { matched, count: matched.filter(Boolean).length, total: q.points.length, words: (text.trim().match(/\S+/g) || []).length };
}

// ---- Coach's Clinic cases (a story told in scenes; not a lesson widget) ----
// Patient: who the case is about      Intro: story set-up
// Scene: what has happened and what you must decide     Data: chip | chip | chip
// + best choice | what happens next     ~ partly right | what to improve     - wrong choice | hint (they try again)
// Debrief: wrap-up shown at the end
export function parseClinic(src) {
  const out = { patient: "", intro: "", scenes: [], debrief: "" };
  let field = null, scene = null;
  for (const raw of src.split("\n")) {
    const line = raw.trim();
    if (!line) { field = null; continue; }
    const kw = line.match(/^(Patient|Intro|Scene|Data|Debrief):\s*(.*)$/);
    const opt = line.match(/^([+~-])\s+(.*)$/);
    if (kw) {
      const [, k, v] = kw;
      if (k === "Patient") { out.patient = v; field = null; }
      else if (k === "Intro") { out.intro = v; field = "intro"; }
      else if (k === "Debrief") { out.debrief = v; field = "debrief"; }
      else if (k === "Scene") { scene = { text: v, data: [], options: [] }; out.scenes.push(scene); field = "scene"; }
      else if (k === "Data") {
        if (!scene) throw new Error(`clinic: "Data:" must come after a "Scene:"`);
        scene.data = v.split("|").map((x) => x.trim()).filter(Boolean);
        field = null;
      }
    } else if (opt) {
      if (!scene) throw new Error(`clinic: choice "${line.slice(0, 40)}" appears before any "Scene:"`);
      const [text, fb] = splitHint(opt[2]);
      if (!fb) throw new Error(`clinic: choice "${text}" needs feedback after " | "`);
      scene.options.push({ text, feedback: fb, kind: opt[1] === "+" ? "best" : opt[1] === "~" ? "partial" : "wrong" });
      field = null;
    } else if (field === "intro") out.intro += " " + line;
    else if (field === "debrief") out.debrief += " " + line;
    else if (field === "scene") scene.text += " " + line;
    else throw new Error(`clinic: unrecognised line "${line.slice(0, 50)}"`);
  }
  if (!out.patient) throw new Error('clinic: needs a "Patient:" line');
  if (!out.intro) throw new Error('clinic: needs an "Intro:" line');
  if (!out.debrief) throw new Error('clinic: needs a "Debrief:" line');
  if (out.scenes.length < 3 || out.scenes.length > 7) throw new Error(`clinic: needs 3 to 7 scenes (found ${out.scenes.length})`);
  out.scenes.forEach((sc, i) => {
    const label = `scene ${i + 1}`;
    if (!sc.text) throw new Error(`clinic: ${label} has no text`);
    if (sc.options.length < 3 || sc.options.length > 5) throw new Error(`clinic: ${label} needs 3 to 5 choices`);
    if (sc.options.filter((o) => o.kind === "best").length !== 1) throw new Error(`clinic: ${label} needs exactly one "+" (best) choice`);
    if (!sc.options.some((o) => o.kind === "wrong")) throw new Error(`clinic: ${label} needs at least one "-" (wrong) choice`);
  });
  return out;
}

// Checks a Beat the Clock question file: every question must be quick to read (3 to 5 options).
export function checkClock(markdown) {
  const qs = [];
  for (const m of markdown.matchAll(/^```quiz[ \t]*\n([\s\S]*?)^```/gm)) qs.push(...parseQuiz(m[1]));
  for (const q of qs) if (q.options.length < 3 || q.options.length > 5) throw new Error(`clock: "${q.question}" needs 3 to 5 options`);
  if (!qs.length) throw new Error("clock: no quiz block found");
  return qs.length;
}

export const PARSERS = { quiz: parseQuiz, flashcards: parseFlashcards, match: parseMatch, fill: parseFill, order: parseOrder, label: parseLabel, video: parseVideo, audio: parseAudio, written: parseWritten };

// Finds every widget block in a markdown string and parses it (throws on a mistake).
export function checkWidgets(markdown) {
  const re = new RegExp("^```(" + WIDGET_TYPES.join("|") + ")[ \\t]*\\n([\\s\\S]*?)^```", "gm");
  let n = 0;
  for (const m of markdown.matchAll(re)) {
    n++;
    const parsed = PARSERS[m[1]](m[2]);
    if (m[1] === "written") {
      const r = scoreWritten(parsed, parsed.model);
      const miss = parsed.points.find((_, i) => !r.matched[i]);
      if (miss) throw new Error(`written: the Model answer for "${parsed.question.slice(0, 50)}" does not earn the mark point "${miss.text}". Add the words the model answer uses to that point's keywords.`);
    }
  }
  return n;
}
