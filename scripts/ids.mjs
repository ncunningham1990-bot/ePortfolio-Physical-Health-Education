// Permanent IDs for activities, challenge-bank questions and checklist items.
//
// Student progress is saved against these IDs, so editing wording, adding items or moving them
// around does not reset anyone's progress. The IDs are remembered in site/content/ids.json (commit it).
//
// reconcile(previous, blocks, newId) gives every current block an ID:
//   1. a block whose text is unchanged keeps its ID,
//   2. an edited block keeps the ID of the most similar block that went missing,
//   3. a brand-new block gets a new ID. Deleted blocks simply drop out.

const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
export const fingerprint = (s) => {
  let h = 5381;
  const t = norm(s);
  for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
  return h.toString(36);
};
const words = (s) => new Set(norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2));
export function similarity(a, b) {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let both = 0;
  for (const w of A) if (B.has(w)) both++;
  return both / (A.size + B.size - both);
}

// previous: [{ id, fp, t, text }]   blocks: [{ text, t, legacyId? }]   newId: () => string
export function reconcile(previous, blocks, newId) {
  const result = new Array(blocks.length).fill(null);
  const used = new Set();
  // 1. unchanged text keeps its ID
  blocks.forEach((b, i) => {
    const fp = fingerprint(b.text);
    const j = previous.findIndex((p, k) => !used.has(k) && p.fp === fp && p.t === b.t);
    if (j >= 0) { used.add(j); result[i] = previous[j].id; }
  });
  // 2. edited text keeps the ID of the most similar missing block of the same type
  const pairs = [];
  blocks.forEach((b, i) => {
    if (result[i]) return;
    previous.forEach((p, k) => { if (!used.has(k) && p.t === b.t) { const s = similarity(b.text, p.text || ""); if (s >= 0.4) pairs.push({ i, k, s }); } });
  });
  pairs.sort((x, y) => y.s - x.s);
  for (const { i, k } of pairs) {
    if (result[i] || used.has(k)) continue;
    used.add(k);
    result[i] = previous[k].id;
  }
  // 3. new blocks get new IDs (written questions start from the ID they already had, so saved answers stay linked)
  const taken = new Set([...result.filter(Boolean), ...previous.map((p) => p.id)]);
  blocks.forEach((b, i) => {
    if (result[i]) return;
    result[i] = b.legacyId && !taken.has(b.legacyId) ? b.legacyId : newId();
    taken.add(result[i]);
  });
  return result.map((id, i) => ({ id, fp: fingerprint(blocks[i].text), t: blocks[i].t, text: blocks[i].text.slice(0, 240) }));
}
