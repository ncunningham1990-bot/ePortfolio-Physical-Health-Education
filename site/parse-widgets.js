// Parses the interactive-task blocks that teachers write inside the markdown pages.
// Used by the website (to render them) and by scripts/build.mjs (to catch typing mistakes).
export const WIDGET_TYPES = ["quiz", "flashcards", "match", "fill"];

export function parseQuiz(src) {
  return src.trim().split(/\n\s*\n/).map((block) => {
    const q = { question: "", options: [], explain: "" };
    for (const raw of block.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("Q:")) q.question = line.slice(2).trim();
      else if (/^[-+]\s/.test(line)) q.options.push({ text: line.slice(2).trim(), correct: line[0] === "+" });
      else if (line.startsWith("?")) q.explain = line.slice(1).trim();
      else throw new Error(`quiz: unrecognised line "${line}" (use Q:, - wrong, + right, ? explanation)`);
    }
    const label = q.question || block.slice(0, 40);
    if (!q.question) throw new Error(`quiz: a question has no "Q:" line near "${label}"`);
    if (q.options.length < 2) throw new Error(`quiz: "${label}" needs at least 2 options`);
    if (q.options.filter((o) => o.correct).length !== 1) throw new Error(`quiz: "${label}" needs exactly one "+" (correct) option`);
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

export function parseMatch(src) {
  const pairs = lines(src).map((l) => {
    const i = l.indexOf(" = ");
    if (i < 1) throw new Error(`match: line needs "left = right": "${l}"`);
    return { left: l.slice(0, i).trim(), right: l.slice(i + 3).trim() };
  });
  if (pairs.length < 2) throw new Error("match: needs at least 2 pairs");
  return pairs;
}

// Each line is a sentence with answers in {braces}; {a|b} accepts either answer.
export function parseFill(src) {
  return lines(src).map((l) => {
    const parts = [];
    let last = 0;
    for (const m of l.matchAll(/\{([^}]+)\}/g)) {
      parts.push({ text: l.slice(last, m.index) });
      parts.push({ answers: m[1].split("|").map((a) => a.trim()).filter(Boolean) });
      last = m.index + m[0].length;
    }
    parts.push({ text: l.slice(last) });
    if (!parts.some((p) => p.answers)) throw new Error(`fill: no {answer} in "${l}"`);
    return parts;
  });
}

const lines = (s) => s.split("\n").map((l) => l.trim()).filter(Boolean);
export const PARSERS = { quiz: parseQuiz, flashcards: parseFlashcards, match: parseMatch, fill: parseFill };

// Finds every widget block in a markdown string and parses it (throws on a mistake).
export function checkWidgets(markdown) {
  const re = /^```(quiz|flashcards|match|fill)[ \t]*\n([\s\S]*?)^```/gm;
  let n = 0;
  for (const m of markdown.matchAll(re)) {
    n++;
    try { PARSERS[m[1]](m[2]); } catch (e) { throw new Error(`${e.message}`); }
  }
  return n;
}
