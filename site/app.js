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
function hydrate(root) {
  root.querySelectorAll(".widget").forEach((el) => {
    const type = el.dataset.type;
    try {
      const data = PARSERS[type](decodeURIComponent(el.dataset.src));
      el.classList.add(`widget-${type}`);
      if (type !== "video") el.append(h("h3", { class: "w-title" }, TITLES[type]));
      el.append(WIDGETS[type](data, `w${++uid}`));
    } catch (e) {
      el.append(h("p", { class: "notice" }, "This activity could not be loaded."));
    }
  });
}

const btn = (label, cls, onclick) => {
  const b = h("button", { type: "button", class: `btn ${cls || ""}`.trim() }, label);
  b.addEventListener("click", onclick);
  return b;
};
const hintLine = (text) => h("p", { class: "hint" }, h("strong", {}, "Hint: "), text);
const GENERIC = "Not quite. Re-read the lesson section on this idea and try a different answer.";

const WIDGETS = {
  quiz(questions, id) {
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

  match(pairs, id) {
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
    };
    const reset = () => { rows.forEach((r) => { r.sel.value = ""; r.tr.className = ""; r.fb.replaceChildren(); }); score.textContent = ""; };
    return h("div", {}, h("table", { class: "w-match" }, h("tbody", {}, rows.map((r) => r.tr))), score,
      h("div", { class: "w-row" }, btn("Check answers", "", check), btn("Start again", "ghost", reset)));
  },

  fill(lines, id) {
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
    };
    const reset = () => { inputs.forEach((x) => { x.input.value = ""; x.input.className = ""; }); paras.forEach((d) => d.querySelector(".fb").replaceChildren()); score.textContent = ""; };
    return h("div", {}, paras, score, h("div", { class: "w-row" }, btn("Check answers", "", check), btn("Start again", "ghost", reset)));
  },

  order({ question, steps }) {
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
    };
    const reset = () => { current = shuffled(); render(); score.textContent = ""; };
    current = shuffled();
    render();
    return h("div", {}, question && h("p", { class: "w-q" }, question), list, score,
      h("div", { class: "w-row" }, btn("Check order", "", check), btn("Start again", "ghost", reset)));
  },

  label({ image, alt, items }, id) {
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

// ---------- navigation ----------
// Routes: #home   #unit/1/0 (unit 1, page 0 = overview)   #tasks/2
function buildNav() {
  const links = [["home", "#home", "Home"],
    ...manifest.units.map((u, i) => [`unit-${i + 1}`, `#unit/${i + 1}/0`, `${i + 1} · ${u.title}`]),
    ["tasks", "#tasks/0", "ePortfolio"]];
  $("tabs").innerHTML = links.map(([k, href, label]) => `<a href="${href}" data-tab="${k}">${esc(label)}</a>`).join("");
  $("unit-cards").innerHTML = manifest.units.map((u, i) =>
    `<a class="card" href="#unit/${i + 1}/0"><span class="num">Unit ${i + 1}</span><h2>${esc(u.title)}</h2><p>${esc(u.summary)}</p></a>`).join("");
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
  if (active.startsWith("unit")) showUnit(Number(a), Number(b) || 0);
  else if (active === "tasks") showTasks(Number(a) || 0);
  window.scrollTo(0, 0);
  document.title = "PE ePortfolio Hub";
}

function showUnit(n, p) {
  const unit = manifest.units[n - 1];
  const items = [{ title: "Unit overview", summary: unit.summary, path: unit.overview }, ...unit.pages];
  $("unit-title").textContent = `Unit ${n}: ${unit.title}`;
  $("unit-list").innerHTML = items.map((it, i) =>
    `<li><a href="#unit/${n}/${i}" ${i === p ? 'aria-current="true"' : ""}>${i ? `<span class="lnum">${n}.${i}</span> ` : ""}${esc(it.title)}<small>${esc(it.summary)}</small></a></li>`).join("");
  loadDoc(items[p] || items[0], $("unit-doc"), (i) => `#unit/${n}/${i}`, items, items[p] ? p : 0);
}

function showTasks(i) {
  const items = manifest.tasks;
  $("tasks-list").innerHTML = items.map((it, n) =>
    `<li><a href="#tasks/${n}" ${n === i ? 'aria-current="true"' : ""}>${esc(it.title)}<small>${esc(it.summary)}</small></a></li>`).join("");
  loadDoc(items[i] || items[0], $("tasks-doc"), (n) => `#tasks/${n}`, items, items[i] ? i : 0);
}

async function loadDoc(item, doc, hrefFor, items, index) {
  if (!item) { doc.innerHTML = "<p>Nothing here yet.</p>"; return; }
  try {
    const res = await fetch(item.path);
    if (!res.ok) throw new Error(res.status);
    const body = (await res.text()).replace(/^---\n[\s\S]*?\n---\n?/, "");
    doc.innerHTML = md(`# ${item.title}\n\n` + body);
    if (item.activity) {
      const a = h("p", {}, h("a", { class: "btn", href: item.activity, target: "_blank", rel: "noopener" }, "Open the interactive activity"));
      doc.querySelector("h1").after(a);
    }
    hydrate(doc);
    const prev = items[index - 1], next = items[index + 1];
    doc.append(h("nav", { class: "pager", "aria-label": "Previous and next" },
      prev ? h("a", { class: "btn ghost", href: hrefFor(index - 1) }, `← ${prev.title}`) : h("span"),
      next ? h("a", { class: "btn", href: hrefFor(index + 1) }, `${next.title} →`) : h("span")));
  } catch {
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
  window.addEventListener("hashchange", route);
  route();
}
init();
