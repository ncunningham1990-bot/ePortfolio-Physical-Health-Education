// Parses the interactive-task blocks that teachers write inside the markdown pages.
// Used by the website (to render them) and by scripts/build.mjs (to catch typing mistakes).
//
// Wrong answers never reveal the correct answer: students get a hint and try again.
export const WIDGET_TYPES = ["quiz", "flashcards", "match", "fill", "order", "label", "video"];

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

export function youtubeId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : "";
}

export const PARSERS = { quiz: parseQuiz, flashcards: parseFlashcards, match: parseMatch, fill: parseFill, order: parseOrder, label: parseLabel, video: parseVideo };

// Finds every widget block in a markdown string and parses it (throws on a mistake).
export function checkWidgets(markdown) {
  const re = new RegExp("^```(" + WIDGET_TYPES.join("|") + ")[ \\t]*\\n([\\s\\S]*?)^```", "gm");
  let n = 0;
  for (const m of markdown.matchAll(re)) {
    n++;
    PARSERS[m[1]](m[2]);
  }
  return n;
}
