import { PARSERS, youtubeId, scoreWritten } from "./parse-widgets.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) v === false || v == null ? 0 : el.setAttribute(k, v === true ? "" : v);
  for (const k of kids.flat()) el.append(k);
  return el;
};

let manifest = { units: [], tasks: [] };
let chatbot = {};

// ---------- markdown + interactive tasks ----------
marked.use({
  renderer: {
    code(code, lang) {
      if (PARSERS[lang]) return `<div class="widget" data-type="${lang}" data-src="${encodeURIComponent(code)}"></div>`;
      return false;
    },
  },
});
const md = (text) => DOMPurify.sanitize(marked.parse(text));

const TITLES = { quiz: "Quiz", flashcards: "Flashcards: click a card to flip it", match: "Matching task", fill: "Fill in the blanks", order: "Put it in order", label: "Label the diagram", video: "Video", audio: "Podcast", written: "Think deeper" };
let uid = 0;
const TRACKED = new Set(["quiz", "match", "fill", "order", "label", "written"]);
function hydrate(root, ctx = null) {
  let idx = 0, wn = 0;
  const keys = [];
  root.querySelectorAll(".widget").forEach((el) => {
    const type = el.dataset.type;
    try {
      const data = PARSERS[type](decodeURIComponent(el.dataset.src));
      el.classList.add(`widget-${type}`);
      if (type !== "video" && type !== "audio") el.append(h("h3", { class: "w-title" }, TITLES[type]));
      let key = null;
      if (TRACKED.has(type)) { key = type === "written" ? `W${wn++}` : String(idx++); keys.push(key); }
      const report = (r) => { if (ctx && key !== null) progress.widgetDone(ctx, key, r); };
      el.append(WIDGETS[type](data, `w${++uid}`, report));
    } catch (e) {
      console.error(e);
      el.append(h("p", { class: "notice" }, "This activity could not be loaded."));
    }
  });
  return keys;
}

const btn = (label, cls, onclick) => {
  const b = h("button", { type: "button", class: `btn ${cls || ""}`.trim() }, label);
  b.addEventListener("click", onclick);
  return b;
};
const hintLine = (text) => h("p", { class: "hint" }, h("strong", {}, "Hint: "), text);
const GENERIC = "Not quite. Re-read the lesson section on this idea and try a different answer.";

const WIDGETS = {
  quiz(questions, id, report) {
    let everWrong = false;
    const wrap = h("div", { class: "w-quiz" });
    const score = h("p", { class: "score", "aria-live": "polite" });
    let items = [];
    const build = () => {
      wrap.replaceChildren();
      items = questions.map((q, i) => {
        const fb = h("div", { class: "fb", "aria-live": "polite" });
        const opts = shuffle(q.options).map((o, j) => {
          const input = h("input", { type: "radio", name: `${id}-${i}`, id: `${id}-${i}-${j}` });
          return { o, input, row: h("label", { for: `${id}-${i}-${j}` }, input, h("span", {}, o.text)) };
        });
        const fs = h("fieldset", {}, h("legend", {}, `${i + 1}. ${q.question}`), opts.map((x) => x.row), fb);
        wrap.append(fs);
        return { q, opts, fs, fb, tries: 0 };
      });
      score.textContent = "";
      wrap.append(score, h("div", { class: "w-row" }, btn("Check answers", "", check), btn("Start again", "ghost", build)));
    };
    const check = () => {
      let right = 0, wrong = 0;
      for (const it of items) {
        const chosen = it.opts.find((x) => x.input.checked);
        it.fb.replaceChildren();
        it.fs.classList.remove("right", "wrong");
        if (!chosen) { it.fb.append(h("p", {}, "Choose an answer.")); continue; }
        if (chosen.o.correct) {
          right++;
          it.fs.classList.add("right");
          it.fb.append(h("p", {}, "✓ Correct. " + (it.q.explain || "")));
        } else {
          wrong++;
          it.tries++;
          it.fs.classList.add("wrong");
          it.fb.append(h("p", {}, "✗ Not quite. "), hintLine(chosen.o.hint));
          if (it.tries >= 2 && it.q.hint) it.fb.append(hintLine(it.q.hint));
        }
      }
      score.textContent = `${right} of ${items.length} correct` + (wrong ? ". Read the hints, change your answers and check again." : "");
      if (wrong) everWrong = true;
      if (right === items.length) report({ flawless: !everWrong, hadWrong: everWrong });
    };
    build();
    return wrap;
  },

  flashcards(cards) {
    const grid = h("div", { class: "w-cards" });
    const render = (list) => {
      grid.replaceChildren(...list.map((c) => {
        const b = h("button", { type: "button", class: "flash", "aria-pressed": "false" }, c.front);
        b.addEventListener("click", () => {
          const flipped = b.getAttribute("aria-pressed") === "true";
          b.setAttribute("aria-pressed", String(!flipped));
          b.textContent = flipped ? c.front : c.back;
          b.classList.toggle("flipped", !flipped);
        });
        return b;
      }));
    };
    render(cards);
    return h("div", {}, grid, h("div", { class: "w-row" }, btn("Shuffle cards", "ghost", () => render(shuffle(cards)))));
  },

  match(pairs, id, report) {
    let everWrong = false;
    const rights = shuffle([...new Set(pairs.map((p) => p.right))]);
    const rows = pairs.map((p, i) => {
      const sel = h("select", { id: `${id}-${i}`, "aria-label": `Match for ${p.left}` },
        h("option", { value: "" }, "Choose..."), rights.map((r) => h("option", { value: r }, r)));
      const fb = h("div", { class: "fb", "aria-live": "polite" });
      return { p, sel, fb, tr: h("tr", {}, h("td", {}, p.left), h("td", {}, sel, fb)) };
    });
    const score = h("p", { class: "score", "aria-live": "polite" });
    const check = () => {
      let right = 0, wrong = 0;
      for (const r of rows) {
        r.fb.replaceChildren();
        r.tr.className = "";
        if (!r.sel.value) continue;
        if (r.sel.value === r.p.right) { right++; r.tr.className = "right"; r.fb.append(h("p", {}, "✓ Correct")); }
        else { wrong++; r.tr.className = "wrong"; r.fb.append(h("p", {}, "✗ " + (r.p.hint || GENERIC))); }
      }
      const empty = rows.filter((r) => !r.sel.value).length;
      score.textContent = `${right} of ${rows.length} correct` + (empty ? `. ${empty} not answered yet.` : "") + (wrong ? " Read the hints, change your choices and check again." : "");
      if (wrong) everWrong = true;
      if (right === rows.length) report({ flawless: !everWrong, hadWrong: everWrong });
    };
    const reset = () => { rows.forEach((r) => { r.sel.value = ""; r.tr.className = ""; r.fb.replaceChildren(); }); score.textContent = ""; };
    return h("div", {}, h("table", { class: "w-match" }, h("tbody", {}, rows.map((r) => r.tr))), score,
      h("div", { class: "w-row" }, btn("Check answers", "", check), btn("Start again", "ghost", reset)));
  },

  fill(lines, id, report) {
    let everWrong = false;
    const inputs = [];
    const paras = lines.map((parts) => {
      const fb = h("div", { class: "fb", "aria-live": "polite" });
      const p = h("p", { class: "w-fill" }, parts.map((part) => {
        if (!part.answers) return part.text;
        const input = h("input", { type: "text", autocomplete: "off", spellcheck: "false", "aria-label": "Blank", size: Math.max(7, part.answers[0].length + 2) });
        inputs.push({ input, part, fb });
        return input;
      }));
      return h("div", {}, p, fb);
    });
    const score = h("p", { class: "score", "aria-live": "polite" });
    const check = () => {
      let right = 0, wrong = 0;
      paras.forEach((d) => d.querySelector(".fb").replaceChildren());
      for (const x of inputs) {
        if (!x.input.value.trim()) { x.input.className = ""; continue; }
        const ok = x.part.answers.some((a) => norm(a) === norm(x.input.value));
        x.input.className = ok ? "right" : "wrong";
        if (ok) right++; else { wrong++; x.fb.append(hintLine(x.part.hint)); }
      }
      const empty = inputs.filter((x) => !x.input.value.trim()).length;
      score.textContent = `${right} of ${inputs.length} correct` + (empty ? `. ${empty} blank${empty > 1 ? "s" : ""} to fill in.` : "") + (wrong ? " Read the hints and try again." : "");
      if (wrong) everWrong = true;
      if (right === inputs.length) report({ flawless: !everWrong, hadWrong: everWrong });
    };
    const reset = () => { inputs.forEach((x) => { x.input.value = ""; x.input.className = ""; }); paras.forEach((d) => d.querySelector(".fb").replaceChildren()); score.textContent = ""; };
    return h("div", {}, paras, score, h("div", { class: "w-row" }, btn("Check answers", "", check), btn("Start again", "ghost", reset)));
  },

  order({ question, steps }, id, report) {
    let everWrong = false;
    const correct = steps.map((s, i) => ({ ...s, i }));
    let current = [];
    const list = h("ol", { class: "w-order" });
    const score = h("p", { class: "score", "aria-live": "polite" });
    const shuffled = () => { let a; do a = shuffle(correct); while (a.every((s, k) => s.i === k)); return a; };
    const render = (marks = null) => {
      list.replaceChildren(...current.map((s, k) => {
        const li = h("li", { class: marks ? (marks[k] ? "right" : "wrong") : "" });
        const up = h("button", { type: "button", class: "mv", "aria-label": `Move "${s.text}" up`, disabled: k === 0 }, "▲");
        const down = h("button", { type: "button", class: "mv", "aria-label": `Move "${s.text}" down`, disabled: k === current.length - 1 }, "▼");
        const swap = (d) => { [current[k], current[k + d]] = [current[k + d], current[k]]; render(); score.textContent = ""; };
        up.addEventListener("click", () => swap(-1));
        down.addEventListener("click", () => swap(1));
        li.append(h("span", { class: "step" }, s.text), h("span", { class: "mvs" }, up, down));
        if (marks && !marks[k]) li.append(h("div", { class: "fb" }, h("p", {}, "✗ " + (s.hint || "This step isn't in the right place yet. What has to happen before it, and what comes after?"))));
        return li;
      }));
    };
    const check = () => {
      const marks = current.map((s, k) => s.i === k);
      const n = marks.filter(Boolean).length;
      render(marks);
      score.textContent = n === current.length ? "✓ All steps are in the right order." : `${n} of ${current.length} steps are in the right place. Read the hints and move the steps that are wrong.`;
      if (n !== current.length) everWrong = true;
      else report({ flawless: !everWrong, hadWrong: everWrong });
    };
    const reset = () => { current = shuffled(); render(); score.textContent = ""; };
    current = shuffled();
    render();
    return h("div", {}, question && h("p", { class: "w-q" }, question), list, score,
      h("div", { class: "w-row" }, btn("Check order", "", check), btn("Start again", "ghost", reset)));
  },

  label({ image, alt, items }, id, report) {
    let everWrong = false;
    const terms = [...new Set(items.map((x) => x.answer))].sort((a, b) => a.localeCompare(b));
    const rows = items.map((it) => {
      const sel = h("select", { id: `${id}-${it.n}`, "aria-label": `Label ${it.n}` }, h("option", { value: "" }, "Choose..."), terms.map((t) => h("option", { value: t }, t)));
      const fb = h("div", { class: "fb", "aria-live": "polite" });
      return { it, sel, fb, tr: h("tr", {}, h("th", { scope: "row" }, String(it.n)), h("td", {}, sel, fb)) };
    });
    const score = h("p", { class: "score", "aria-live": "polite" });
    const check = () => {
      let right = 0, wrong = 0;
      for (const r of rows) {
        r.fb.replaceChildren(); r.tr.className = "";
        if (!r.sel.value) continue;
        if (r.sel.value === r.it.answer) { right++; r.tr.className = "right"; r.fb.append(h("p", {}, "✓ Correct")); }
        else { wrong++; r.tr.className = "wrong"; r.fb.append(h("p", {}, "✗ " + (r.it.hint || GENERIC))); }
      }
      const empty = rows.filter((r) => !r.sel.value).length;
      score.textContent = `${right} of ${rows.length} correct` + (empty ? `. ${empty} not labelled yet.` : "") + (wrong ? " Read the hints, change your labels and check again." : "");
      if (wrong) everWrong = true;
      if (right === rows.length) report({ flawless: !everWrong, hadWrong: everWrong });
    };
    const reset = () => { rows.forEach((r) => { r.sel.value = ""; r.tr.className = ""; r.fb.replaceChildren(); }); score.textContent = ""; };
    return h("div", { class: "w-label" },
      h("img", { src: image, alt: alt || "Diagram with numbered parts to label" }),
      h("div", {}, h("table", { class: "w-match" }, h("tbody", {}, rows.map((r) => r.tr))), score,
        h("div", { class: "w-row" }, btn("Check labels", "", check), btn("Start again", "ghost", reset))));
  },

  written(q, wid, report, onChange = () => {}) {
    const rec = () => (state.written[q.id] ||= {});
    const area = h("textarea", { id: `${wid}-ta`, rows: "7", placeholder: "Type your answer here. Write in full sentences and explain your reasoning.", "aria-label": "Your answer" });
    const count = h("small", { class: "wcount" });
    const msg = h("p", { class: "wmsg", "aria-live": "polite" });
    const result = h("div", { class: "w-result", hidden: true });
    const words = () => (area.value.trim().match(/\S+/g) || []).length;
    const updateCount = () => { count.textContent = `${words()} word${words() === 1 ? "" : "s"}`; };
    let timer;
    area.value = rec().text || "";
    updateCount();
    area.addEventListener("input", () => {
      updateCount();
      clearTimeout(timer);
      timer = setTimeout(() => { rec().text = area.value; saveState(); }, 400);
    });

    const renderResult = () => {
      const r = scoreWritten(q, area.value);
      const saved = rec();
      saved.auto = r.matched;
      saved.self = r.matched.map((m, i) => (saved.self ? !!saved.self[i] || m : m));
      const selfTotal = h("p", { class: "wscore", "aria-live": "polite" });
      const updateSelf = () => { const n = saved.self.filter(Boolean).length; selfTotal.textContent = `Your self-assessed mark: ${n} of ${q.points.length}`; };
      const msList = h("ol", { class: "w-ms" }, q.points.map((p, i) => {
        const cb = h("input", { type: "checkbox", id: `${wid}-ms${i}` });
        cb.checked = !!saved.self[i];
        cb.addEventListener("change", () => { saved.self[i] = cb.checked; updateSelf(); saveState(); onChange(); });
        return h("li", {}, h("label", { for: `${wid}-ms${i}` }, cb, h("span", {}, p.text)));
      }));
      updateSelf();
      const feedback = h("ul", { class: "w-fb" }, q.points.map((p, i) =>
        h("li", { class: r.matched[i] ? "right" : "wrong" }, r.matched[i] ? `✓ You covered: ${p.text}` : `✗ Think about: ${p.prompt}`)));
      const next = h("textarea", { rows: "2", id: `${wid}-next`, placeholder: "One thing I will do to improve my answer...", "aria-label": "My next step" });
      next.value = saved.next || "";
      next.addEventListener("input", () => { saved.next = next.value; saveState(); });
      const saveBtn = btn(saved.selfDone ? "Self-assessment saved ✓" : "Save my self-assessment", "", () => {
        saved.next = next.value;
        progress.selfSaved(q.id);
        saveBtn.textContent = "Self-assessment saved ✓";
        onChange();
      });
      result.replaceChildren(
        h("h4", {}, "1. Automatic check"),
        h("p", { class: "wscore" }, `Estimated score: ${r.count} of ${r.total} marks`),
        feedback,
        h("p", { class: "w-note" }, "This check looks for key words, so it can miss a good answer that is worded differently, and it can give credit for the right words in the wrong place. Use the mark scheme to check yourself honestly."),
        h("h4", {}, "2. Mark scheme: assess yourself"),
        h("p", {}, "Tick a mark point only if your answer made that point, in your own words. Change any ticks that the automatic check got wrong."),
        msList, selfTotal,
        h("details", { class: "w-model" }, h("summary", {}, "Show an example of a strong answer"), h("p", {}, q.model)),
        h("h4", {}, "3. Next step"),
        next,
        h("div", { class: "w-row" }, saveBtn,
          btn("Improve my answer", "ghost", () => { area.focus(); area.scrollIntoView({ block: "center" }); }),
          btn("Copy my answer", "ghost", async () => { try { await navigator.clipboard.writeText(area.value); toast("📋", "Copied", "Your answer is on the clipboard."); } catch { toast("📋", "Could not copy", "Select the text and copy it yourself."); } })));
      result.hidden = false;
      return r;
    };

    const submit = () => {
      if (words() < 10) { msg.textContent = "Write a little more first (at least 10 words), then submit."; area.focus(); return; }
      msg.textContent = "";
      const saved = rec();
      saved.text = area.value;
      saved.submitted = true;
      const r = renderResult();
      saveState();
      const first = progress.writtenSubmitted(q.id);
      if (first) report({ written: true });
      if (r.count === r.total) confetti(false);
      onChange();
      result.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    };

    const root = h("div", { class: "w-written" },
      h("div", { class: "w-wmeta" }, h("span", { class: `chip lvl lvl-${q.level.toLowerCase()}` }, q.level), h("span", { class: "chip" }, `${q.points.length} marks`)),
      h("p", { class: "w-q" }, q.question),
      area, count, msg,
      h("div", { class: "w-row" }, btn("Submit my answer", "", submit)),
      result);
    if (rec().submitted) renderResult();
    return root;
  },

  audio({ title, url, note }) {
    const player = h("audio", { controls: true, preload: "metadata", src: url });
    const speeds = [0.75, 1, 1.25, 1.5].map((r) => {
      const b = h("button", { type: "button", class: "speed", "aria-pressed": String(r === 1) }, `${r}×`);
      b.addEventListener("click", () => {
        player.playbackRate = r;
        b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      });
      return b;
    });
    return h("div", { class: "w-video w-audio" }, h("h3", { class: "w-title" }, "🎧 Podcast: " + title),
      h("div", { class: "audio-body" }, player,
        h("div", { class: "speed-row" }, h("span", {}, "Speed:"), speeds, h("a", { href: url, download: "" }, "Download")),
        note ? h("p", { class: "lead" }, note) : ""));
  },

  video({ title, url, note }) {
    const vid = youtubeId(url);
    if (vid) {
      return h("div", { class: "w-video" }, h("h3", { class: "w-title" }, "Video: " + title),
        h("div", { class: "frame" }, h("iframe", {
          src: `https://www.youtube-nocookie.com/embed/${vid}`, title, loading: "lazy", allowfullscreen: true,
          allow: "accelerometer; encrypted-media; gyroscope; picture-in-picture", referrerpolicy: "strict-origin-when-cross-origin",
        })), note && h("p", { class: "lead" }, note));
    }
    return h("div", { class: "w-video placeholder" }, h("h3", { class: "w-title" }, "Video coming soon"),
      h("p", { class: "ph" }, "▶ " + title), h("p", { class: "lead" }, note || "Your teacher will add a video here."));
  },
};

// ---------- progress, badges, toasts ----------
const STORE_KEY = "pe-hub-progress-v1";
const blank = () => ({ widgets: {}, lessons: {}, written: {}, stats: { done: 0, flawless: 0, recovered: 0, written: 0, selfSaved: 0 }, badges: {}, streak: { count: 0, last: "" }, last: "" });
let state = blank();
try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const o = JSON.parse(raw); state = { ...blank(), ...o, stats: { ...blank().stats, ...(o.stats || {}) } }; } } catch {}
const saveState = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} };

const lessonCount = () => manifest.units.reduce((n, u) => n + u.pages.length, 0);
const doneCount = () => manifest.units.reduce((n, u, i) => n + u.pages.filter((_, k) => state.lessons[`${i + 1}-${k + 1}`]).length, 0);
const unitDone = (i) => manifest.units[i].pages.length > 0 && manifest.units[i].pages.every((_, k) => state.lessons[`${i + 1}-${k + 1}`]);
const dayStr = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const currentStreak = () => {
  const { count, last } = state.streak;
  return last === dayStr(new Date()) || last === dayStr(new Date(Date.now() - 864e5)) ? count : 0;
};
function bumpStreak() {
  const t = dayStr(new Date());
  if (state.streak.last === t) return;
  state.streak.count = state.streak.last === dayStr(new Date(Date.now() - 864e5)) ? state.streak.count + 1 : 1;
  state.streak.last = t;
}

const badgeDefs = () => [
  { id: "first-steps", icon: "🚀", name: "First Steps", desc: "Complete your first activity", test: () => state.stats.done >= 1 },
  { id: "lesson-learned", icon: "✅", name: "Lesson Learned", desc: "Complete a whole lesson", test: () => doneCount() >= 1 },
  { id: "flawless", icon: "🎯", name: "Flawless", desc: "Get a perfect score on an activity first time", test: () => state.stats.flawless >= 1 },
  { id: "never-give-up", icon: "💪", name: "Never Give Up", desc: "Use the hints to fix your mistakes and finish an activity", test: () => state.stats.recovered >= 1 },
  { id: "on-a-roll", icon: "🔥", name: "On a Roll", desc: "Complete activities on 3 days in a row", test: () => state.streak.count >= 3 },
  { id: "ten-up", icon: "⭐", name: "Ten Up", desc: "Complete 10 activities", test: () => state.stats.done >= 10 },
  { id: "fifty-club", icon: "🌟", name: "Fifty Club", desc: "Complete 50 activities", test: () => state.stats.done >= 50 },
  ...manifest.units.map((u, i) => ({ id: `unit-${i + 1}`, icon: u.icon || "🏅", name: `${u.title} Champion`, desc: `Complete every lesson in Unit ${i + 1}`, test: () => unitDone(i) })),
  { id: "critical-thinker", icon: "🧩", name: "Critical Thinker", desc: "Complete 3 Think deeper or Challenge Bank questions", test: () => state.stats.written >= 3 },
  { id: "honest-marker", icon: "📝", name: "Honest Marker", desc: "Save 3 self-assessments using the mark scheme", test: () => state.stats.selfSaved >= 3 },
  { id: "challenge-champion", icon: "🥇", name: "Challenge Champion", desc: "Complete 10 Think deeper or Challenge Bank questions", test: () => state.stats.written >= 10 },
  { id: "halfway", icon: "🏁", name: "Halfway There", desc: "Complete half of all the lessons", test: () => lessonCount() > 0 && doneCount() >= Math.ceil(lessonCount() / 2) },
  { id: "course-champion", icon: "🏆", name: "Course Champion", desc: "Complete every lesson", test: () => lessonCount() > 0 && doneCount() >= lessonCount() },
];

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
function confetti(big = false) {
  if (reduceMotion) return;
  const colors = ["#22c55e", "#16a34a", "#facc15", "#ffffff", "#f87171", "#38bdf8"];
  const layer = h("div", { class: "confetti", "aria-hidden": "true" });
  for (let i = 0; i < (big ? 90 : 26); i++) {
    const p = h("i");
    p.style.left = `${50 + (Math.random() - 0.5) * (big ? 80 : 28)}%`;
    p.style.background = colors[i % colors.length];
    layer.append(p);
    p.animate([{ transform: "translate(0,0) rotate(0deg)", opacity: 1 },
      { transform: `translate(${(Math.random() - 0.5) * 640}px, ${280 + Math.random() * 420}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }],
      { duration: 1300 + Math.random() * 900, easing: "cubic-bezier(.2,.7,.3,1)" });
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 2500);
}
function toast(icon, title, text) {
  const t = h("div", { class: "toast" }, h("span", { class: "t-icon", "aria-hidden": "true" }, icon), h("div", {}, h("strong", {}, title), h("small", {}, text)));
  const box = $("toasts");
  box.append(t);
  while (box.children.length > 3) box.firstElementChild.remove();
  setTimeout(() => t.remove(), 4200);
}
function awardBadges() {
  let n = 0;
  for (const d of badgeDefs()) {
    if (!state.badges[d.id] && d.test()) {
      state.badges[d.id] = Date.now();
      setTimeout(() => { toast(d.icon, `Badge unlocked: ${d.name}`, d.desc); confetti(true); }, 1200 + 1500 * n++);
    }
  }
}

const lessonKeysDone = (ctx) => ctx.keys.filter((k) => state.widgets[`${ctx.lessonKey}#${k}`]).length;
const progress = {
  widgetDone(ctx, key, r) {
    const wkey = `${ctx.lessonKey}#${key}`;
    if (state.widgets[wkey]) return;
    state.widgets[wkey] = true;
    if (!r.written) {
      state.stats.done++;
      if (r.flawless) state.stats.flawless++; else if (r.hadWrong) state.stats.recovered++;
      bumpStreak();
    }
    const allDone = lessonKeysDone(ctx) === ctx.keys.length;
    const lessonJustDone = allDone && !state.lessons[ctx.lessonKey];
    if (lessonJustDone) {
      state.lessons[ctx.lessonKey] = true;
      toast("🎉", "Lesson complete!", "Great work. Keep the streak going.");
      confetti(true);
    } else if (!r.written) {
      toast(r.flawless ? "🎯" : "✅", r.flawless ? "Perfect first time!" : "Activity complete!", `${lessonKeysDone(ctx)} of ${ctx.keys.length} activities done in this lesson`);
      confetti(false);
    }
    awardBadges();
    saveState();
    ctx.refresh();
  },
  writtenSubmitted(id) {
    const w = state.written[id];
    if (w.counted) return false;
    w.counted = true;
    state.stats.written++;
    state.stats.done++;
    bumpStreak();
    toast("✍️", "Answer submitted", "Now use the mark scheme to assess yourself.");
    awardBadges();
    saveState();
    return true;
  },
  selfSaved(id) {
    const w = state.written[id];
    if (!w.selfDone) {
      w.selfDone = true;
      state.stats.selfSaved++;
      toast("📝", "Self-assessment saved", "Honest marking is how you improve.");
      awardBadges();
    }
    saveState();
  },
  toggleLesson(ctx) {
    state.lessons[ctx.lessonKey] = !state.lessons[ctx.lessonKey];
    if (state.lessons[ctx.lessonKey]) { toast("✅", "Lesson marked complete", "Nice one."); awardBadges(); }
    saveState();
    ctx.refresh();
  },
};

// ---------- home dashboard ----------
function renderHome() {
  const total = lessonCount(), done = doneCount();
  const pct = total ? Math.round((done / total) * 100) : 0;
  $("ring-fill").style.strokeDashoffset = String(276.46 * (1 - pct / 100));
  $("ring-text").textContent = `${pct}%`;
  $("stat-lessons").textContent = `${done} of ${total}`;
  $("stat-streak").textContent = String(currentStreak());
  $("stat-tasks").textContent = String(state.stats.done);
  const defs = badgeDefs();
  const earned = defs.filter((d) => state.badges[d.id]).length;
  $("stat-badges").textContent = String(earned);
  $("stat-badges-of").textContent = `of ${defs.length}`;
  $("badge-grid").innerHTML = defs.map((d) => `<li class="badge ${state.badges[d.id] ? "on" : ""}"><span class="b-icon" aria-hidden="true">${d.icon}</span><strong>${esc(d.name)}</strong><small>${state.badges[d.id] ? "" : '<span class="sr">Locked. </span>'}${esc(d.desc)}</small></li>`).join("");
  $("unit-cards").innerHTML = manifest.units.map((u, i) => {
    const dn = u.pages.filter((_, k) => state.lessons[`${i + 1}-${k + 1}`]).length;
    const pc = u.pages.length ? Math.round((dn / u.pages.length) * 100) : 0;
    return `<a class="card" href="#unit/${i + 1}/0"><span class="num">Unit ${i + 1}</span><span class="u-icon" aria-hidden="true">${u.icon || "📘"}</span><h3>${esc(u.title)}</h3><p>${esc(u.summary)}</p><div class="bar" role="progressbar" aria-valuenow="${pc}" aria-valuemin="0" aria-valuemax="100" aria-label="Unit ${i + 1} progress"><span style="width:${pc}%"></span></div><small>${dn} of ${u.pages.length} lessons complete</small></a>`;
  }).join("");
  // challenge bank card
  const doneQ = bankItems.filter((q) => state.written[q.id]?.submitted).length;
  const left = bankItems.filter((q) => !state.written[q.id]?.submitted);
  const pick = (left.length ? left : bankItems)[Math.floor(Math.random() * (left.length || bankItems.length))];
  $("bank-progress").textContent = bankItems.length ? `${doneQ} of ${bankItems.length} challenges done` : "";
  $("bank-random").href = pick ? `#bank/${pick.id}` : "#bank";
  // continue button
  const m = (state.last || "").match(/^#unit\/(\d+)\/(\d+)$/);
  const cont = $("hero-continue");
  if (m && manifest.units[m[1] - 1]?.pages[m[2] - 1]) {
    cont.hidden = false; cont.href = state.last;
    cont.textContent = `Continue: ${manifest.units[m[1] - 1].pages[m[2] - 1].title}`;
    $("hero-start").textContent = "Start from the beginning";
  } else { cont.hidden = true; $("hero-start").textContent = "Start learning"; }
}

// ---------- navigation ----------
// Routes: #home   #unit/1/0 (unit 1, page 0 = overview)   #tasks/2
function buildNav() {
  const links = [["home", "#home", "Home"],
    ...manifest.units.map((u, i) => [`unit-${i + 1}`, `#unit/${i + 1}/0`, u.short || u.title]),
    ["bank", "#bank", "Challenges"],
    ["tasks", "#tasks/0", "ePortfolio"]];
  $("tabs").innerHTML = links.map(([k, href, label]) => `<a href="${href}" data-tab="${k}">${esc(label)}</a>`).join("");
}

function route() {
  const [tab = "home", a, b] = location.hash.slice(1).split("/");
  let active = "home";
  if (tab === "unit" && manifest.units[Number(a) - 1]) active = `unit-${Number(a)}`;
  else if (tab === "tasks") active = "tasks";
  else if (tab === "bank") active = "bank";
  for (const id of ["home", "unit", "tasks", "bank"]) $(id).hidden = id !== (active.startsWith("unit") ? "unit" : active);
  document.querySelectorAll("#tabs a").forEach((l) => {
    if (l.dataset.tab === active) l.setAttribute("aria-current", "page");
    else l.removeAttribute("aria-current");
  });
  if (active === "home") renderHome();
  else if (active.startsWith("unit")) {
    if (Number(b) > 0) { state.last = `#unit/${Number(a)}/${Number(b)}`; saveState(); }
    showUnit(Number(a), Number(b) || 0);
  } else if (active === "tasks") showTasks(Number(a) || 0);
  else if (active === "bank") showBank(a || "");
  if (active !== "bank" || !a) window.scrollTo(0, 0);
  document.title = "PHE ePortfolio Hub";
}

let shownUnit = { n: 0, p: 0 };
function renderUnitList() {
  const { n, p } = shownUnit;
  const unit = manifest.units[n - 1];
  const items = [{ title: "Unit overview", summary: unit.summary }, ...unit.pages];
  const dn = unit.pages.filter((_, k) => state.lessons[`${n}-${k + 1}`]).length;
  const pc = unit.pages.length ? Math.round((dn / unit.pages.length) * 100) : 0;
  $("unit-title").textContent = `${unit.icon || ""} Unit ${n}: ${unit.title}`.trim();
  $("unit-bar").firstElementChild.style.width = `${pc}%`;
  $("unit-bar").setAttribute("aria-valuenow", String(pc));
  $("unit-count").textContent = `${dn} of ${unit.pages.length} lessons complete`;
  $("unit-list").innerHTML = items.map((it, i) => {
    const done = i > 0 && state.lessons[`${n}-${i}`];
    return `<li><a href="#unit/${n}/${i}" ${i === p ? 'aria-current="true"' : ""}>${i ? `<span class="tick ${done ? "on" : ""}" aria-hidden="true"></span><span class="lnum">${n}.${i}</span>` : ""}<span>${esc(it.title)}${done ? '<span class="sr"> (complete)</span>' : ""}</span><small>${esc(it.summary)}</small></a></li>`;
  }).join("");
}

function showUnit(n, p) {
  const unit = manifest.units[n - 1];
  const items = [{ title: "Unit overview", summary: unit.summary, path: unit.overview }, ...unit.pages];
  const page = items[p] ? p : 0;
  shownUnit = { n, p: page };
  renderUnitList();
  loadDoc(items[page], $("unit-doc"), (i) => `#unit/${n}/${i}`, items, page, page > 0 ? { n, p: page, unit } : null);
}

// ---------- challenge bank ----------
let bankItems = [];
const bankFilter = { unit: "all", level: "all", status: "all" };

async function loadBank() {
  const out = [];
  await Promise.all((manifest.bank || []).map(async (f, fi) => {
    try {
      const raw = (await (await fetch(f.path)).text()).replace(/^---\n[\s\S]*?\n---\n?/, "");
      let topic = "";
      const items = [];
      for (const m of raw.matchAll(/^## (.+)$|^```written[ \t]*\n([\s\S]*?)^```/gm)) {
        if (m[1]) topic = m[1].trim();
        else items.push({ ...PARSERS.written(m[2]), unit: Number(f.unit) || fi + 1, topic });
      }
      out.push({ fi, items });
    } catch (e) { console.error("bank file failed", f.path, e); }
  }));
  bankItems = out.sort((a, b) => a.fi - b.fi).flatMap((o) => o.items);
}

const bankStatus = (q) => {
  const w = state.written[q.id];
  if (!w?.submitted) return { text: "Not started", cls: "" };
  const n = (w.self || []).filter(Boolean).length;
  return { text: `Done · ${n}/${q.points.length}`, cls: "done" };
};

function renderBankList() {
  const list = $("bank-list");
  const items = bankItems.filter((q) =>
    (bankFilter.unit === "all" || String(q.unit) === bankFilter.unit) &&
    (bankFilter.level === "all" || q.level === bankFilter.level) &&
    (bankFilter.status === "all" || (bankFilter.status === "done") === !!state.written[q.id]?.submitted));
  const done = bankItems.filter((q) => state.written[q.id]?.submitted).length;
  $("bank-summary").textContent = `${items.length} question${items.length === 1 ? "" : "s"} shown · ${done} of ${bankItems.length} completed`;
  list.replaceChildren(...items.map((q) => {
    const unit = manifest.units[q.unit - 1] || {};
    const st = h("span", { class: "b-status" });
    const refresh = () => { const s2 = bankStatus(q); st.textContent = s2.text; st.className = `b-status ${s2.cls}`; };
    refresh();
    const d = h("details", { class: "bank-item", "data-id": q.id },
      h("summary", {},
        h("span", { class: "b-unit", title: `Unit ${q.unit}: ${unit.title || ""}` }, unit.icon || "📘"),
        h("span", { class: "b-main" },
          h("span", { class: "b-meta" }, h("span", { class: `chip lvl lvl-${q.level.toLowerCase()}` }, q.level), h("span", { class: "b-topic" }, q.topic || ""), h("span", { class: "b-marks" }, `${q.points.length} marks`)),
          h("span", { class: "b-q" }, q.question)),
        st));
    let built = false;
    d.addEventListener("toggle", () => {
      if (d.open && !built) { built = true; d.append(h("div", { class: "bank-body" }, WIDGETS.written(q, `b${++uid}`, () => {}, refresh))); }
    });
    return d;
  }));
  if (!items.length) list.append(h("p", { class: "notice" }, "No questions match these filters."));
}

function bankControls() {
  const sel = (id, opts, cur, key) => {
    const el = $(id);
    el.innerHTML = opts.map(([v, l]) => `<option value="${esc(v)}" ${v === cur ? "selected" : ""}>${esc(l)}</option>`).join("");
    el.onchange = () => { bankFilter[key] = el.value; renderBankList(); };
  };
  sel("bank-unit", [["all", "All units"], ...manifest.units.map((u, i) => [String(i + 1), `${u.icon || ""} ${u.short || u.title}`])], bankFilter.unit, "unit");
  sel("bank-level", [["all", "All levels"], ["Apply", "Apply"], ["Analyse", "Analyse"], ["Evaluate", "Evaluate"], ["Create", "Create"]], bankFilter.level, "level");
  sel("bank-status", [["all", "All"], ["todo", "Not started"], ["done", "Completed"]], bankFilter.status, "status");
}

function showBank(openId) {
  bankControls();
  renderBankList();
  if (!openId) return;
  const find = () => document.querySelector(`.bank-item[data-id="${CSS.escape(openId)}"]`);
  let d = find();
  if (!d) { bankFilter.unit = bankFilter.level = bankFilter.status = "all"; bankControls(); renderBankList(); d = find(); }
  if (d) { d.open = true; d.scrollIntoView({ block: "center" }); }
}

function renderChatCard() {
  const card = $("chat-card");
  let url = "";
  try { const u = new URL(chatbot.url || ""); if (u.protocol === "https:" || u.protocol === "http:") url = u.href; } catch {}
  const title = chatbot.title || "Study Guide Chat";
  const logo = chatbot.image && /^[\w./-]+$/.test(chatbot.image)
    ? h("img", { class: "chat-logo", src: chatbot.image, alt: `${title} logo`, width: "112", height: "112" })
    : h("span", { class: "chat-icon", "aria-hidden": "true" }, "💬");
  card.replaceChildren(
    logo,
    h("div", { class: "chat-text" },
      h("h2", { id: "chat-title" }, title),
      h("p", {}, chatbot.description || "Ask questions and get guidance on your ePortfolio."),
      chatbot.joinNote ? h("p", { class: "join-note" }, "🔑 " + chatbot.joinNote) : "",
      chatbot.privacy ? h("small", {}, chatbot.privacy) : ""),
    url
      ? h("a", { class: "btn lime", href: url, target: "_blank", rel: "noopener noreferrer" }, `Open ${title} ↗`)
      : h("span", { class: "chip soon" }, "Coming soon"));
}

function showTasks(i) {
  renderChatCard();
  const items = manifest.tasks;
  $("tasks-list").innerHTML = items.map((it, n) =>
    `<li><a href="#tasks/${n}" ${n === i ? 'aria-current="true"' : ""}><span>${esc(it.title)}</span><small>${esc(it.summary)}</small></a></li>`).join("");
  loadDoc(items[i] || items[0], $("tasks-doc"), (n) => `#tasks/${n}`, items, items[i] ? i : 0, null);
}

async function loadDoc(item, doc, hrefFor, items, index, track) {
  if (!item) { doc.innerHTML = "<p>Nothing here yet.</p>"; return; }
  try {
    const res = await fetch(item.path);
    if (!res.ok) throw new Error(res.status);
    const body = (await res.text()).replace(/^---\n[\s\S]*?\n---\n?/, "");
    doc.innerHTML = md(`# ${item.title}\n\n` + body);
    doc.querySelectorAll("img").forEach((im) => { im.loading = "lazy"; });
    if (item.activity) {
      const a = h("p", {}, h("a", { class: "btn", href: item.activity, target: "_blank", rel: "noopener" }, "Open the interactive activity"));
      doc.querySelector("h1").after(a);
    }
    let ctx = null;
    if (track) {
      const lessonKey = `${track.n}-${track.p}`;
      const status = h("span", { class: "chip status" });
      doc.querySelector("h1").before(h("div", { class: "crumbs" }, h("span", { class: "chip" }, `Unit ${track.n} · ${track.unit.title}`), status));
      ctx = {
        lessonKey, keys: [],
        doneWidgets: () => lessonKeysDone(ctx),
        refresh: () => {
          const done = !!state.lessons[lessonKey];
          status.className = `chip status${done ? " done" : ""}`;
          status.textContent = done ? "✓ Complete" : `${ctx.doneWidgets()} of ${ctx.keys.length} activities`;
          if (toggle) toggle.textContent = done ? "Mark as not complete" : "Mark lesson as complete";
          if (msg) msg.textContent = done ? "You have completed this lesson. 🎉" : "Finish all the activities to complete this lesson automatically.";
          renderUnitList();
        },
      };
      ctx.keys = hydrate(doc, ctx);
    } else hydrate(doc);
    let toggle = null, msg = null;
    if (ctx && ctx.keys.length) {
      toggle = btn("Mark lesson as complete", "ghost", () => progress.toggleLesson(ctx));
      msg = h("p", {});
      doc.append(h("div", { class: "complete-row" }, msg, toggle));
      ctx.refresh();
    }
    const prev = items[index - 1], next = items[index + 1];
    doc.append(h("nav", { class: "pager", "aria-label": "Previous and next" },
      prev ? h("a", { class: "btn ghost", href: hrefFor(index - 1) }, `← ${prev.title}`) : h("span"),
      next ? h("a", { class: "btn", href: hrefFor(index + 1) }, `${next.title} →`) : h("span")));
  } catch (e) {
    console.error(e);
    doc.innerHTML = "<p>Could not load this page. Check your connection and try again.</p>";
  }
}

async function init() {
  try {
    manifest = await (await fetch("content/manifest.json")).json();
  } catch {
    $("main").insertAdjacentHTML("afterbegin", '<p class="notice">Could not load course content. Run <code>npm run build</code>.</p>');
  }
  try { chatbot = await (await fetch("content/chatbot.json")).json(); } catch {}
  await loadBank();
  buildNav();
  $("reset-progress").addEventListener("click", () => {
    if (confirm("Reset all your progress, streak and badges on this device? This cannot be undone.")) { state = blank(); saveState(); renderHome(); }
  });
  window.addEventListener("hashchange", route);
  route();
}
init();
