import { PARSERS, youtubeId } from "./parse-widgets.js";

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

const TITLES = { quiz: "Quiz", flashcards: "Flashcards: click a card to flip it", match: "Matching task", fill: "Fill in the blanks", order: "Put it in order", label: "Label the diagram", video: "Video" };
let uid = 0;
const TRACKED = new Set(["quiz", "match", "fill", "order", "label"]);
function hydrate(root, ctx = null) {
  let idx = 0;
  root.querySelectorAll(".widget").forEach((el) => {
    const type = el.dataset.type;
    try {
      const data = PARSERS[type](decodeURIComponent(el.dataset.src));
      el.classList.add(`widget-${type}`);
      if (type !== "video") el.append(h("h3", { class: "w-title" }, TITLES[type]));
      const mine = TRACKED.has(type) ? idx++ : -1;
      const report = (r) => { if (ctx && mine >= 0) progress.widgetDone(ctx, mine, r); };
      el.append(WIDGETS[type](data, `w${++uid}`, report));
    } catch (e) {
      el.append(h("p", { class: "notice" }, "This activity could not be loaded."));
    }
  });
  return idx;
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
const blank = () => ({ widgets: {}, lessons: {}, stats: { done: 0, flawless: 0, recovered: 0 }, badges: {}, streak: { count: 0, last: "" }, last: "" });
let state = blank();
try { const raw = localStorage.getItem(STORE_KEY); if (raw) state = { ...blank(), ...JSON.parse(raw) }; } catch {}
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

const progress = {
  widgetDone(ctx, idx, r) {
    const key = `${ctx.lessonKey}#${idx}`;
    if (state.widgets[key]) return;
    state.widgets[key] = true;
    state.stats.done++;
    if (r.flawless) state.stats.flawless++; else if (r.hadWrong) state.stats.recovered++;
    bumpStreak();
    const allDone = Array.from({ length: ctx.total }, (_, i) => state.widgets[`${ctx.lessonKey}#${i}`]).every(Boolean);
    const lessonJustDone = allDone && !state.lessons[ctx.lessonKey];
    if (lessonJustDone) {
      state.lessons[ctx.lessonKey] = true;
      toast("🎉", "Lesson complete!", "Great work. Keep the streak going.");
      confetti(true);
    } else {
      toast(r.flawless ? "🎯" : "✅", r.flawless ? "Perfect first time!" : "Activity complete!", `${ctx.doneWidgets()} of ${ctx.total} activities done in this lesson`);
      confetti(false);
    }
    awardBadges();
    saveState();
    ctx.refresh();
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
    ["tasks", "#tasks/0", "ePortfolio"]];
  $("tabs").innerHTML = links.map(([k, href, label]) => `<a href="${href}" data-tab="${k}">${esc(label)}</a>`).join("");
}

function route() {
  const [tab = "home", a, b] = location.hash.slice(1).split("/");
  let active = "home";
  if (tab === "unit" && manifest.units[Number(a) - 1]) active = `unit-${Number(a)}`;
  else if (tab === "tasks") active = "tasks";
  for (const id of ["home", "unit", "tasks"]) $(id).hidden = id !== (active.startsWith("unit") ? "unit" : active);
  document.querySelectorAll("#tabs a").forEach((l) => {
    if (l.dataset.tab === active) l.setAttribute("aria-current", "page");
    else l.removeAttribute("aria-current");
  });
  if (active === "home") renderHome();
  else if (active.startsWith("unit")) {
    if (Number(b) > 0) { state.last = `#unit/${Number(a)}/${Number(b)}`; saveState(); }
    showUnit(Number(a), Number(b) || 0);
  } else if (active === "tasks") showTasks(Number(a) || 0);
  window.scrollTo(0, 0);
  document.title = "PE ePortfolio Hub";
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

function showTasks(i) {
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
        lessonKey, total: 0,
        doneWidgets: () => Array.from({ length: ctx.total }, (_, i) => state.widgets[`${lessonKey}#${i}`]).filter(Boolean).length,
        refresh: () => {
          const done = !!state.lessons[lessonKey];
          status.className = `chip status${done ? " done" : ""}`;
          status.textContent = done ? "✓ Complete" : `${ctx.doneWidgets()} of ${ctx.total} activities`;
          if (toggle) toggle.textContent = done ? "Mark as not complete" : "Mark lesson as complete";
          if (msg) msg.textContent = done ? "You have completed this lesson. 🎉" : "Finish all the activities to complete this lesson automatically.";
          renderUnitList();
        },
      };
      ctx.total = hydrate(doc, ctx);
    } else hydrate(doc);
    let toggle = null, msg = null;
    if (ctx && ctx.total) {
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
  buildNav();
  $("reset-progress").addEventListener("click", () => {
    if (confirm("Reset all your progress, streak and badges on this device? This cannot be undone.")) { state = blank(); saveState(); renderHome(); }
  });
  window.addEventListener("hashchange", route);
  route();
}
init();
