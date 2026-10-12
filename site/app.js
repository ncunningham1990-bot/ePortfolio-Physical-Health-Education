import { PARSERS, youtubeId, scoreWritten, parseClinic } from "./parse-widgets.js";
import { renderSmart, renderPlanner, renderSelfCheck } from "./tools.js";

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
const blank = () => ({ widgets: {}, lessons: {}, written: {}, clock: { best: {}, plays: 0, top: 0 }, clinic: {}, tracker: {}, tools: { smart: {}, planner: {} }, stats: { done: 0, flawless: 0, recovered: 0, written: 0, selfSaved: 0, selfChecks: 0 }, badges: {}, streak: { count: 0, last: "" }, last: "" });
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
  { id: "on-the-clock", icon: "⏱️", name: "On the Clock", desc: "Finish a round of Beat the Clock", test: () => state.clock.plays >= 1 },
  { id: "quick-thinker", icon: "⚡", name: "Quick Thinker", desc: "Score 150 or more in Beat the Clock", test: () => state.clock.top >= 150 },
  { id: "clinic-rookie", icon: "🩺", name: "Clinic Rookie", desc: "Complete a Coach's Clinic case", test: () => Object.keys(state.clinic).length >= 1 },
  { id: "head-coach", icon: "🧑‍🏫", name: "Head Coach", desc: "Earn 3 stars on 3 Coach's Clinic cases", test: () => Object.values(state.clinic).filter((c) => c.stars >= 3).length >= 3 },
  { id: "checklist-champ", icon: "☑️", name: "Checklist Champ", desc: "Tick every item on a task checklist", test: () => (manifest.tasks || []).some((t) => t.checklist && trackerCount(t) >= t.checklist) },
  { id: "goal-setter", icon: "🎯", name: "Goal Setter", desc: "Complete every part of the SMART goal builder", test: () => !!(state.tools.smart && state.tools.smart.done) },
  { id: "programme-builder", icon: "🗓️", name: "Programme Builder", desc: "Plan all 8 sessions and the interim analysis", test: () => !!(state.tools.planner && state.tools.planner.done) },
  { id: "self-checker", icon: "🔎", name: "Self-Checker", desc: "Run a self-check against a rubric", test: () => state.stats.selfChecks >= 1 },
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
  updateGameNotes();
  updateTaskNote();
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
  stopClock();
  clearInterval(dlTimer);
  const [tab = "home", a, b] = location.hash.slice(1).split("/");
  let active = "home", panel = "";
  if (tab === "unit" && manifest.units[Number(a) - 1]) active = `unit-${Number(a)}`;
  else if (tab === "tasks") active = "tasks";
  else if (tab === "bank") active = "bank";
  else if (tab === "clock" || tab === "clinic") { active = "bank"; panel = tab; }
  const show = panel || (active.startsWith("unit") ? "unit" : active);
  for (const id of ["home", "unit", "tasks", "bank", "clock", "clinic"]) $(id).hidden = id !== show;
  document.querySelectorAll("#tabs a").forEach((l) => {
    if (l.dataset.tab === active) l.setAttribute("aria-current", "page");
    else l.removeAttribute("aria-current");
  });
  if (active === "home") renderHome();
  else if (active.startsWith("unit")) {
    if (Number(b) > 0) { state.last = `#unit/${Number(a)}/${Number(b)}`; saveState(); }
    showUnit(Number(a), Number(b) || 0);
  } else if (active === "tasks") showTasks(Number(a) || 0, b || "");
  else if (panel === "clock") showClock();
  else if (panel === "clinic") showClinic(a || "");
  else if (active === "bank") showBank(a || "");
  if (active !== "bank" || panel || !a) window.scrollTo(0, 0);
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
  updateGameNotes();
  bankControls();
  renderBankList();
  if (!openId) return;
  const find = () => document.querySelector(`.bank-item[data-id="${CSS.escape(openId)}"]`);
  let d = find();
  if (!d) { bankFilter.unit = bankFilter.level = bankFilter.status = "all"; bankControls(); renderBankList(); d = find(); }
  if (d) { d.open = true; d.scrollIntoView({ block: "center" }); }
}

// ---------- game notes on the cards ----------
function updateGameNotes() {
  const best = Math.max(0, ...Object.values(state.clock.best));
  const clockNote = best ? `Your best: ${best} points` : "60 seconds. How many can you get?";
  const cases = manifest.clinic || [];
  const doneCases = cases.filter((c) => state.clinic[c.id]).length;
  const clinicNote = cases.length ? `${doneCases} of ${cases.length} cases completed` : "";
  for (const id of ["home-clock-note", "hub-clock-note"]) if ($(id)) $(id).textContent = clockNote;
  for (const id of ["home-clinic-note", "hub-clinic-note"]) if ($(id)) $(id).textContent = clinicNote;
}

// ---------- Beat the Clock ----------
const CLOCK_SECONDS = 60, CLOCK_PENALTY = 3;
const CLOCK_RANKS = [["Legend", 240], ["Captain", 160], ["Starter", 80], ["Rookie", 0]];
const clockRank = (n) => CLOCK_RANKS.find(([, min]) => n >= min)[0];
let clockPool = null, clockTimer = 0, clockKeys = null;
let clockUnit = "all";

function stopClock() {
  clearInterval(clockTimer);
  clockTimer = 0;
  if (clockKeys) { document.removeEventListener("keydown", clockKeys); clockKeys = null; }
}

async function loadClock() {
  if (clockPool) return clockPool;
  const out = [];
  await Promise.all((manifest.clock || []).map(async (f, fi) => {
    try {
      const raw = await (await fetch(f.path)).text();
      for (const m of raw.matchAll(/^```quiz[ \t]*\n([\s\S]*?)^```/gm)) out.push({ fi, qs: PARSERS.quiz(m[1]).map((q) => ({ ...q, unit: Number(f.unit) || fi + 1 })) });
    } catch (e) { console.error("clock file failed", f.path, e); }
  }));
  clockPool = out.sort((a, b) => a.fi - b.fi).flatMap((o) => o.qs);
  return clockPool;
}

async function showClock() {
  stopClock();
  const stage = $("clock-stage");
  stage.replaceChildren(h("p", { class: "lead" }, "Loading questions…"));
  const pool = await loadClock();
  if (!pool.length) { stage.replaceChildren(h("p", { class: "notice" }, "No Beat the Clock questions found. Run npm run build.")); return; }
  clockMenu(stage);
}

function clockMenu(stage) {
  stopClock();
  const units = [["all", "All units", pool_count("all")], ...manifest.units.map((u, i) => [String(i + 1), `${u.icon || ""} ${u.short || u.title}`.trim(), pool_count(String(i + 1))])];
  function pool_count(k) { return clockPool.filter((q) => k === "all" || String(q.unit) === k).length; }
  const best = (k) => state.clock.best[k] || 0;
  const group = h("div", { class: "ck-units", role: "group", "aria-label": "Choose what to be tested on" });
  const startNote = h("p", { class: "ck-best" });
  const refresh = () => {
    for (const b of group.children) b.setAttribute("aria-pressed", String(b.dataset.k === clockUnit));
    startNote.textContent = best(clockUnit) ? `Your best here: ${best(clockUnit)} points (${clockRank(best(clockUnit))})` : "No score yet. Set your first one!";
  };
  for (const [k, label, n] of units) {
    if (!n) continue;
    const b = h("button", { type: "button", class: "ck-unit", "data-k": k }, h("span", {}, label), h("small", {}, `${n} questions`));
    b.onclick = () => { clockUnit = k; refresh(); };
    group.append(b);
  }
  if (![...group.children].some((b) => b.dataset.k === clockUnit)) clockUnit = "all";
  const go = h("button", { type: "button", class: "btn lime ck-go" }, "Start the clock ⏱️");
  go.onclick = () => startClock(stage);
  stage.replaceChildren(
    h("div", { class: "ck-rules" },
      h("h2", {}, "How it works"),
      h("ul", {},
        h("li", {}, h("strong", {}, `${CLOCK_SECONDS} seconds`), " on the clock. Answer as many questions as you can."),
        h("li", {}, h("strong", {}, "Right: "), "+10 points, plus bonus points for a streak of correct answers."),
        h("li", {}, h("strong", {}, "Wrong: "), `you lose ${CLOCK_PENALTY} seconds and get a hint. Use it to try the same question again.`),
        h("li", {}, "Keyboard: press 1, 2, 3 or 4 to choose an answer."))),
    h("h2", { class: "ck-sub" }, "Choose your topic"), group, startNote, h("p", {}, go));
  refresh();
}

function startClock(stage) {
  stopClock();
  const pool = shuffle(clockPool.filter((q) => clockUnit === "all" || String(q.unit) === clockUnit));
  if (!pool.length) return;
  let i = -1, score = 0, combo = 0, bestCombo = 0, right = 0, wrong = 0, over = false, locked = false;
  const missed = [];
  let endAt = Date.now() + CLOCK_SECONDS * 1000;
  const time = h("strong", { class: "ck-time" }, String(CLOCK_SECONDS));
  const bar = h("div", { class: "ck-bar" }, h("i"));
  const scoreEl = h("strong", {}, "0");
  const comboEl = h("strong", {}, "0");
  const qEl = h("p", { class: "ck-q" });
  const optsEl = h("div", { class: "ck-opts" });
  const hintEl = h("p", { class: "ck-hint", role: "status" });
  stage.replaceChildren(
    h("div", { class: "ck-hud" },
      h("div", { class: "ck-stat" }, h("small", {}, "Time"), time),
      h("div", { class: "ck-stat" }, h("small", {}, "Score"), scoreEl),
      h("div", { class: "ck-stat" }, h("small", {}, "Streak"), comboEl)),
    bar, qEl, optsEl, hintEl);
  const tick = () => {
    const left = Math.max(0, endAt - Date.now());
    time.textContent = String(Math.ceil(left / 1000));
    bar.firstChild.style.width = `${(left / (CLOCK_SECONDS * 1000)) * 100}%`;
    bar.classList.toggle("low", left < 10000);
    if (left <= 0) finish();
  };
  function next() {
    i++;
    const q = pool[i % pool.length];
    locked = false;
    hintEl.textContent = "";
    hintEl.className = "ck-hint";
    qEl.textContent = q.question;
    optsEl.replaceChildren(...shuffle(q.options).map((o, n) => {
      const b = h("button", { type: "button", class: "ck-opt" }, h("kbd", {}, String(n + 1)), h("span", {}, o.text));
      b.onclick = () => pick(q, o, b);
      return b;
    }));
  }
  function pick(q, o, b) {
    if (over || locked || b.disabled) return;
    if (o.correct) {
      locked = true;
      right++; combo++; bestCombo = Math.max(bestCombo, combo);
      score += 10 + Math.min(combo - 1, 5) * 2;
      scoreEl.textContent = String(score); comboEl.textContent = String(combo);
      b.classList.add("right");
      setTimeout(() => { if (!over) next(); }, 260);
    } else {
      wrong++; combo = 0; comboEl.textContent = "0";
      endAt -= CLOCK_PENALTY * 1000;
      if (!missed.includes(q.question)) missed.push(q.question);
      b.disabled = true; b.classList.add("wrong");
      hintEl.className = "ck-hint show";
      hintEl.textContent = `−${CLOCK_PENALTY} s. Hint: ${o.hint}`;
      tick();
    }
  }
  function finish() {
    if (over) return;
    over = true;
    stopClock();
    const k = clockUnit;
    const prev = state.clock.best[k] || 0;
    const pb = score > prev && score > 0;
    if (pb) state.clock.best[k] = score;
    state.clock.plays++;
    state.clock.top = Math.max(state.clock.top, score);
    bumpStreak();
    awardBadges();
    saveState();
    if (pb || score >= 160) confetti(true);
    const acc = right + wrong ? Math.round((right / (right + wrong)) * 100) : 0;
    const again = h("button", { type: "button", class: "btn lime" }, "Play again");
    again.onclick = () => startClock(stage);
    const menu = h("button", { type: "button", class: "btn ghost" }, "Change topic");
    menu.onclick = () => clockMenu(stage);
    stage.replaceChildren(
      h("div", { class: "ck-result", role: "status" },
        h("p", { class: "eyebrow" }, "Time's up!"),
        h("h2", {}, `${score} points`),
        h("p", { class: "ck-rank" }, `Rank: ${clockRank(score)}`),
        pb ? h("p", { class: "ck-pb" }, "🎉 New personal best!") : "",
        h("ul", { class: "ck-facts" },
          h("li", {}, `${right} correct`),
          h("li", {}, `${acc}% accuracy`),
          h("li", {}, `Best streak: ${bestCombo}`))),
      missed.length ? h("div", { class: "ck-missed" }, h("h3", {}, "Questions to revisit"), h("p", {}, "These tripped you up. Look them up in the lessons, then come back and beat your score."), h("ul", {}, missed.slice(0, 10).map((m) => h("li", {}, m)))) : h("p", { class: "ck-pb" }, "No mistakes at all. Impressive!"),
      h("div", { class: "w-row" }, again, menu, h("a", { class: "btn ghost", href: "#bank" }, "Back to Challenges")));
  }
  clockKeys = (e) => {
    if (over || e.ctrlKey || e.metaKey || e.altKey) return;
    const n = Number(e.key);
    if (n >= 1 && n <= optsEl.children.length) optsEl.children[n - 1].click();
  };
  document.addEventListener("keydown", clockKeys);
  next();
  tick();
  clockTimer = setInterval(tick, 100);
}

// ---------- Coach's Clinic ----------
const clinicCache = {};
async function loadCase(c) {
  if (!clinicCache[c.id]) {
    const raw = (await (await fetch(c.path)).text()).replace(/^---\n[\s\S]*?\n---\n?/, "");
    clinicCache[c.id] = { ...c, ...parseClinic(raw) };
  }
  return clinicCache[c.id];
}
const starText = (n) => "★".repeat(n) + "☆".repeat(3 - n);

async function showClinic(id) {
  const stage = $("clinic-stage");
  const cases = manifest.clinic || [];
  const meta = cases.find((c) => c.id === id);
  if (!meta) { clinicList(stage, cases); return; }
  stage.replaceChildren(h("p", { class: "lead" }, "Loading case…"));
  try { playCase(stage, await loadCase(meta)); }
  catch (e) { console.error(e); stage.replaceChildren(h("p", { class: "notice" }, "Could not load this case.")); }
}

function clinicList(stage, cases) {
  if (!cases.length) { stage.replaceChildren(h("p", { class: "notice" }, "No cases found. Run npm run build.")); return; }
  const unitName = (n) => (manifest.units[n - 1] ? manifest.units[n - 1].short || manifest.units[n - 1].title : "");
  stage.replaceChildren(h("div", { class: "cards" }, cases.map((c) => {
    const st = state.clinic[c.id];
    return h("a", { class: "card clinic-card", href: `#clinic/${c.id}` },
      h("span", { class: "u-icon", "aria-hidden": "true" }, c.icon),
      h("span", { class: "num" }, unitName(c.unit)),
      h("h3", {}, c.title),
      h("p", {}, c.summary),
      h("small", {}, st ? `${starText(st.stars)} · best ${st.best} of ${st.max}` : `${c.scenes} scenes · not started`));
  })));
}

function playCase(stage, c) {
  let si = 0, points = 0;
  const max = c.scenes.length * 2;
  const unitName = manifest.units[c.unit - 1] ? manifest.units[c.unit - 1].short || manifest.units[c.unit - 1].title : "";
  const head = h("div", { class: "cl-patient" },
    h("span", { class: "cl-avatar", "aria-hidden": "true" }, c.icon),
    h("div", {}, h("p", { class: "eyebrow" }, `Case file · ${unitName}`), h("h2", {}, c.title), h("p", { class: "cl-who" }, c.patient), h("p", {}, c.intro)));
  const body = h("div", { class: "cl-body" });
  stage.replaceChildren(h("a", { class: "back", href: "#clinic" }, "← All cases"), head, body);

  function scene() {
    const sc = c.scenes[si];
    let hadWrong = false, usedPartial = false, done = false;
    const fb = h("div", { class: "cl-fb", role: "status" });
    const opts = h("div", { class: "cl-opts" });
    const nextRow = h("div", { class: "w-row" });
    const pips = h("div", { class: "cl-pips", "aria-hidden": "true" }, c.scenes.map((_, n) => h("i", { class: n < si ? "done" : n === si ? "now" : "" })));
    body.replaceChildren(h("section", { class: "cl-scene" },
      h("p", { class: "cl-step" }, `Scene ${si + 1} of ${c.scenes.length}`), pips,
      h("p", { class: "cl-text" }, sc.text),
      sc.data.length ? h("ul", { class: "cl-data", "aria-label": "Case data" }, sc.data.map((d) => h("li", {}, d))) : "",
      h("p", { class: "cl-ask" }, "What do you do?"), opts, fb, nextRow));
    const goNext = (label) => {
      const b = h("button", { type: "button", class: "btn lime" }, label);
      b.onclick = () => { si++; si < c.scenes.length ? scene() : finish(); body.scrollIntoView({ block: "start" }); };
      return b;
    };
    shuffle(sc.options).forEach((o) => {
      const b = h("button", { type: "button", class: "cl-opt" }, o.text);
      b.onclick = () => {
        if (done || b.disabled) return;
        b.disabled = true;
        nextRow.replaceChildren();
        if (o.kind === "wrong") {
          hadWrong = true;
          b.classList.add("wrong");
          fb.className = "cl-fb bad";
          fb.textContent = `Not quite. ${o.feedback}`;
          return;
        }
        if (o.kind === "partial") {
          usedPartial = true;
          b.classList.add("partial");
          fb.className = "cl-fb ok";
          fb.textContent = `Almost. ${o.feedback}`;
          const retry = h("button", { type: "button", class: "btn ghost" }, "Rethink this choice");
          retry.onclick = () => { fb.textContent = ""; fb.className = "cl-fb"; nextRow.replaceChildren(); };
          const move = goNext(si + 1 < c.scenes.length ? "Accept and continue" : "Finish the case");
          move.addEventListener("click", () => { points += 1; }, { capture: true });
          nextRow.append(move, retry);
          return;
        }
        done = true;
        points += hadWrong || usedPartial ? 1 : 2;
        for (const x of opts.children) x.disabled = true;
        b.classList.add("right");
        fb.className = "cl-fb good";
        fb.textContent = `Good call. ${o.feedback}`;
        nextRow.append(goNext(si + 1 < c.scenes.length ? "Next scene →" : "Finish the case"));
        nextRow.firstChild.focus();
      };
      opts.append(b);
    });
  }

  function finish() {
    const pct = points / max;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    const prev = state.clinic[c.id];
    state.clinic[c.id] = { stars: Math.max(stars, prev ? prev.stars : 0), best: Math.max(points, prev ? prev.best : 0), max };
    if (!prev) bumpStreak();
    awardBadges();
    saveState();
    if (stars === 3) confetti(true); else confetti(false);
    const idx = manifest.clinic.findIndex((x) => x.id === c.id);
    const nextMeta = manifest.clinic[idx + 1];
    const again = h("button", { type: "button", class: "btn ghost" }, "Replay this case");
    again.onclick = () => { si = 0; points = 0; scene(); window.scrollTo(0, 0); };
    body.replaceChildren(h("section", { class: "cl-scene cl-final", role: "status" },
      h("p", { class: "eyebrow" }, "Case closed"),
      h("p", { class: "cl-stars", "aria-label": `${stars} out of 3 stars` }, starText(stars)),
      h("h3", {}, `${points} of ${max} points`),
      stars < 3 ? h("p", { class: "cl-hint" }, "Replay to improve your stars. First-time best choices earn the most points.") : "",
      h("div", { class: "cl-debrief" }, h("h4", {}, "Coach's debrief"), h("p", {}, c.debrief)),
      h("div", { class: "w-row" }, nextMeta ? h("a", { class: "btn lime", href: `#clinic/${nextMeta.id}` }, "Next case →") : "", again, h("a", { class: "btn ghost", href: "#clinic" }, "All cases"))));
  }
  scene();
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

// ---------- ePortfolio tasks: tracker, deadlines and sub-tabs ----------
let deadlines = {};
let dlTimer = 0;
let tasksToken = 0;
const taskKey = (item) => item.path.split("/").pop();
const taskNumber = (item) => Number((item.path.match(/\/0?(\d)-task-/) || [])[1]) || 0;
const hash36 = (str) => { let x = 5381; for (let i = 0; i < str.length; i++) x = ((x * 33) ^ str.charCodeAt(i)) >>> 0; return x.toString(36); };
const trackerSet = (item) => state.tracker[taskKey(item)] || (state.tracker[taskKey(item)] = {});
const trackerCount = (item) => Math.min(Object.keys(state.tracker[taskKey(item)] || {}).length, item.checklist || 0);

const parseDay = (str) => { const [y, m, d] = str.split("-").map(Number); return new Date(y, m - 1, d, 23, 59, 59); };
const fmtDay = (d) => d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
function countdownText(ms) {
  const d = Math.floor(ms / 864e5), hr = Math.floor((ms % 864e5) / 36e5), mn = Math.floor((ms % 36e5) / 6e4);
  if (d >= 2) return `${d} days ${hr} h`;
  if (d === 1) return `1 day ${hr} h`;
  if (hr >= 1) return `${hr} h ${mn} min`;
  return `${Math.max(mn, 1)} min`;
}
function nextDeadline() {
  const now = Date.now();
  const all = [];
  for (const t of manifest.tasks || []) for (const d of deadlines[taskKey(t)] || []) all.push({ task: t, label: d.label, date: parseDay(d.date) });
  return all.filter((x) => x.date.getTime() > now).sort((a, b) => a.date - b.date)[0] || null;
}
function updateTaskNote() {
  const el = $("home-tasks-note");
  if (!el) return;
  const n = nextDeadline();
  el.textContent = n ? `Next: ${n.task.title.split(":")[0]} ${n.label.toLowerCase()} in ${countdownText(n.date - Date.now())}` : "";
}

function deadlineStrip(item) {
  const list = deadlines[taskKey(item)];
  if (!list || !list.length) return null;
  const cards = list.map((d) => {
    const date = parseDay(d.date);
    const card = h("div", { class: "dl-card" }, h("small", {}, d.label), h("strong", {}, fmtDay(date)), h("span", { class: "dl-count" }));
    card.date = date;
    return card;
  });
  const strip = h("div", { class: "dl-strip", role: "group", "aria-label": "Submission deadlines" }, ...cards);
  const tick = () => {
    const now = Date.now();
    const next = cards.find((c) => c.date.getTime() > now);
    for (const c of cards) {
      const ms = c.date.getTime() - now;
      const out = c.querySelector(".dl-count");
      if (ms <= 0) { c.className = "dl-card passed"; out.textContent = "Deadline passed"; }
      else { c.className = `dl-card${c === next ? " next" : ""}${ms < 3 * 864e5 ? " soon" : ""}`; out.textContent = `${countdownText(ms)} left`; }
    }
  };
  tick();
  clearInterval(dlTimer);
  dlTimer = setInterval(() => { if (!strip.isConnected) { clearInterval(dlTimer); return; } tick(); }, 30000);
  return h("div", {}, strip, h("p", { class: "dl-note" }, "Deadlines are the end of the day shown, on your device's clock."));
}

function enhanceTask(doc, item) {
  const dl = deadlineStrip(item);
  const h1 = doc.querySelector("h1");
  if (dl && h1) h1.after(dl);
  const head = [...doc.querySelectorAll("h2")].find((e) => /^checklist/i.test(e.textContent));
  if (!head) return;
  const lis = [];
  const groups = [];
  let cur = null;
  for (let el = head.nextElementSibling; el && el.tagName !== "H2"; el = el.nextElementSibling) {
    if (el.tagName === "H3") { cur = { el, items: [] }; groups.push(cur); }
    else if (el.tagName === "UL" || el.tagName === "OL") {
      el.classList.add("trk-list");
      for (const li of el.children) if (li.tagName === "LI") { lis.push(li); if (cur) cur.items.push(li); }
    }
  }
  if (!lis.length) return;
  const set = trackerSet(item);
  const keys = new Set();
  const entries = lis.map((li) => {
    const c = li.cloneNode(true);
    c.querySelectorAll("ul,ol").forEach((n) => n.remove());
    const text = c.textContent.replace(/\s+/g, " ").trim();
    const key = hash36(text.toLowerCase().slice(0, 120));
    keys.add(key);
    const cb = h("input", { type: "checkbox", class: "trk-box", "aria-label": `Included in my work: ${text.slice(0, 90)}` });
    cb.checked = !!set[key];
    li.classList.add("trk");
    li.prepend(cb);
    li.classList.toggle("done", cb.checked);
    cb.onchange = () => {
      if (cb.checked) set[key] = 1; else delete set[key];
      li.classList.toggle("done", cb.checked);
      update(true);
    };
    return { li, cb, key };
  });
  for (const k of Object.keys(set)) if (!keys.has(k)) delete set[k];
  const bar = h("div", { class: "trk-bar" }, h("i"));
  const count = h("strong", { class: "trk-num", "aria-live": "polite" });
  const reset = h("button", { type: "button", class: "link-btn" }, "Clear all ticks");
  head.after(h("div", { class: "trk-head" },
    h("p", { class: "trk-title" }, "✅ Your checklist tracker"),
    h("p", {}, "Tick the box beside each item when you have included it in your work. Your ticks are saved on this device only."),
    bar, h("p", { class: "trk-line" }, count, " ", reset)));
  const counts = groups.map((g) => { const sp = h("span", { class: "trk-count" }); g.el.append(sp); return sp; });
  let wasComplete = lis.length > 0 && entries.every((e) => e.cb.checked);
  function update(user) {
    const done = entries.filter((e) => e.cb.checked).length;
    bar.firstChild.style.width = `${(done / entries.length) * 100}%`;
    count.textContent = `${done} of ${entries.length} included`;
    groups.forEach((g, n) => { const d = g.items.filter((li) => li.querySelector(".trk-box").checked).length; counts[n].textContent = `${d}/${g.items.length}`; counts[n].classList.toggle("full", d === g.items.length); });
    const complete = done === entries.length;
    if (user && complete && !wasComplete) { toast("🏁", "Checklist complete!", "Every item is included. Now use the self-check to polish your work."); confetti(true); }
    wasComplete = complete;
    if (user) { awardBadges(); renderTasksSide(); }
    saveState();
  }
  reset.onclick = () => { if (confirm("Clear all ticks for this task?")) { for (const e of entries) { e.cb.checked = false; e.li.classList.remove("done"); delete set[e.key]; } update(true); } };
  update(false);
}

function renderTasksSide(i = Number((location.hash.slice(1).split("/")[1])) || 0) {
  $("tasks-list").innerHTML = manifest.tasks.map((it, n) => {
    const mini = it.checklist ? `<small class="trk-mini">${trackerCount(it)} of ${it.checklist} checklist items ticked</small>` : "";
    return `<li><a href="#tasks/${n}" ${n === i ? 'aria-current="true"' : ""}><span>${esc(it.title)}</span><small>${esc(it.summary)}</small>${mini}</a></li>`;
  }).join("");
}

const toolCtx = {
  get state() { return state; },
  save: () => saveState(),
  onGoalsDone: () => { toast("🎯", "SMART goals complete!", "Every part is filled in. Copy them into your Task 2 document."); confetti(true); awardBadges(); saveState(); },
  onPlannerDone: () => { toast("🗓️", "Programme planned!", "Sessions, interim analysis and adaptations are all in place."); confetti(true); awardBadges(); saveState(); },
  onSelfCheck: () => { state.stats.selfChecks++; bumpStreak(); awardBadges(); saveState(); toast("🔎", "Self-check done", "Use the steps to improve your draft, then check again."); },
};

async function showTasks(i, sub = "") {
  renderChatCard();
  const items = manifest.tasks;
  renderTasksSide(items[i] ? i : 0);
  const idx = items[i] ? i : 0;
  const item = items[idx];
  const num = item ? taskNumber(item) : 0;
  const tabs = !num ? [] : num === 2
    ? [["", "Instructions & tracker"], ["smart", "SMART goal builder"], ["planner", "Session planner"], ["check", "Self-check"]]
    : [["", "Instructions & tracker"], ["check", "Self-check"]];
  const key = tabs.some(([k]) => k === sub) ? sub : "";
  const nav = tabs.length ? h("nav", { class: "subtabs", "aria-label": "Task sections" }, tabs.map(([k, label]) => h("a", { href: `#tasks/${idx}${k ? "/" + k : ""}`, "aria-current": k === key ? "page" : false }, label))) : null;
  const doc = $("tasks-doc");
  const token = ++tasksToken;
  if (!key) {
    await loadDoc(item, doc, (n) => `#tasks/${n}`, items, idx, null);
    if (token !== tasksToken) return;
    if (num) enhanceTask(doc, item);
    if (nav) doc.prepend(nav);
    return;
  }
  const host = h("div", { class: "tl-host" });
  doc.replaceChildren(h("h1", {}, item.title), nav, host);
  if (key === "smart") renderSmart(host, toolCtx);
  else if (key === "planner") renderPlanner(host, toolCtx);
  else renderSelfCheck(host, num, toolCtx);
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
  try { deadlines = await (await fetch("content/deadlines.json")).json(); } catch {}
  await loadBank();
  buildNav();
  $("reset-progress").addEventListener("click", () => {
    if (confirm("Reset all your progress, streak, badges, checklist ticks and saved goals and planner on this device? This cannot be undone.")) { state = blank(); saveState(); renderHome(); }
  });
  window.addEventListener("hashchange", route);
  route();
}
init();
