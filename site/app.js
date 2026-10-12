import { PARSERS } from "./parse-widgets.js";

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

let uid = 0;
function hydrate(root) {
  root.querySelectorAll(".widget").forEach((el) => {
    const type = el.dataset.type;
    try {
      const data = PARSERS[type](decodeURIComponent(el.dataset.src));
      const id = `w${++uid}`;
      const label = { quiz: "Quiz", flashcards: "Flashcards: click a card to flip it", match: "Matching task", fill: "Fill in the blanks" }[type];
      el.append(h("h3", { class: "w-title" }, label), WIDGETS[type](data, id));
    } catch (e) {
      el.append(h("p", { class: "notice" }, "This activity could not be loaded."));
    }
  });
}

const controls = (check, reveal, reset) =>
  h("div", { class: "w-row" },
    check && h("button", { type: "button", class: "btn" }, "Check answers"),
    reveal && h("button", { type: "button", class: "btn ghost" }, "Show answers"),
    reset && h("button", { type: "button", class: "btn ghost" }, "Try again"));

function wireControls(root, { check, reveal, reset }) {
  const [c, r, t] = root.querySelectorAll(".w-row button");
  c.addEventListener("click", check);
  r.addEventListener("click", reveal);
  t.addEventListener("click", reset);
}

const WIDGETS = {
  quiz(questions, id) {
    const wrap = h("div", { class: "w-quiz" });
    let items = [];
    const build = () => {
      items = [];
      wrap.querySelectorAll("fieldset").forEach((f) => f.remove());
      questions.forEach((q, i) => {
        const fb = h("p", { class: "fb", "aria-live": "polite" });
        const opts = shuffle(q.options).map((o, j) => {
          const input = h("input", { type: "radio", name: `${id}-${i}`, id: `${id}-${i}-${j}` });
          return { o, input, row: h("label", { for: `${id}-${i}-${j}` }, input, h("span", {}, o.text)) };
        });
        const fs = h("fieldset", {}, h("legend", {}, `${i + 1}. ${q.question}`), opts.map((x) => x.row), fb);
        wrap.insertBefore(fs, score);
        items.push({ q, opts, fs, fb });
      });
      score.textContent = "";
    };
    const score = h("p", { class: "score", "aria-live": "polite" });
    wrap.append(score);
    build();
    const controlsRow = controls(true, true, true);
    wrap.append(controlsRow);
    wireControls(controlsRow, {
      check() {
        let right = 0;
        for (const it of items) {
          const chosen = it.opts.find((x) => x.input.checked);
          it.fs.classList.remove("right", "wrong");
          if (!chosen) { it.fb.textContent = "Choose an answer."; continue; }
          const ok = chosen.o.correct;
          if (ok) right++;
          it.fs.classList.add(ok ? "right" : "wrong");
          it.fb.textContent = (ok ? "Correct. " : "Not quite. ") + (it.q.explain || "");
        }
        score.textContent = `Score: ${right} / ${items.length}`;
      },
      reveal() {
        for (const it of items) {
          it.opts.forEach((x) => (x.input.checked = x.o.correct));
          it.fs.classList.add("right");
          it.fs.classList.remove("wrong");
          it.fb.textContent = it.q.explain || "";
        }
        score.textContent = "";
      },
      reset: build,
    });
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
    const sh = h("button", { type: "button", class: "btn ghost" }, "Shuffle cards");
    sh.addEventListener("click", () => render(shuffle(cards)));
    return h("div", {}, grid, h("div", { class: "w-row" }, sh));
  },

  match(pairs, id) {
    const rights = shuffle([...new Set(pairs.map((p) => p.right))]);
    const rows = pairs.map((p, i) => {
      const sel = h("select", { id: `${id}-${i}`, "aria-label": `Match for ${p.left}` },
        h("option", { value: "" }, "Choose..."), rights.map((r) => h("option", { value: r }, r)));
      const mark = h("span", { class: "mark", "aria-live": "polite" });
      return { p, sel, mark, tr: h("tr", {}, h("td", {}, p.left), h("td", {}, sel, mark)) };
    });
    const table = h("table", { class: "w-match" }, h("tbody", {}, rows.map((r) => r.tr)));
    const score = h("p", { class: "score", "aria-live": "polite" });
    const row = controls(true, true, true);
    wireControls(row, {
      check() {
        let right = 0;
        for (const r of rows) {
          const ok = r.sel.value === r.p.right;
          if (ok) right++;
          r.tr.className = !r.sel.value ? "" : ok ? "right" : "wrong";
          r.mark.textContent = !r.sel.value ? "" : ok ? " ✓" : " ✗";
        }
        score.textContent = `Score: ${right} / ${rows.length}`;
      },
      reveal() { rows.forEach((r) => { r.sel.value = r.p.right; r.tr.className = "right"; r.mark.textContent = " ✓"; }); score.textContent = ""; },
      reset() { rows.forEach((r) => { r.sel.value = ""; r.tr.className = ""; r.mark.textContent = ""; }); score.textContent = ""; },
    });
    return h("div", {}, table, score, row);
  },

  fill(lines, id) {
    const inputs = [];
    const paras = lines.map((parts) =>
      h("p", { class: "w-fill" }, parts.map((part) => {
        if (!part.answers) return part.text;
        const input = h("input", { type: "text", autocomplete: "off", spellcheck: "false", "aria-label": "Blank", size: Math.max(6, part.answers[0].length + 2) });
        inputs.push({ input, answers: part.answers });
        return input;
      })));
    const score = h("p", { class: "score", "aria-live": "polite" });
    const row = controls(true, true, true);
    wireControls(row, {
      check() {
        let right = 0;
        for (const x of inputs) {
          const ok = x.answers.some((a) => norm(a) === norm(x.input.value));
          if (ok) right++;
          x.input.className = !x.input.value ? "" : ok ? "right" : "wrong";
        }
        score.textContent = `Score: ${right} / ${inputs.length}`;
      },
      reveal() { inputs.forEach((x) => { x.input.value = x.answers[0]; x.input.className = "right"; }); score.textContent = ""; },
      reset() { inputs.forEach((x) => { x.input.value = ""; x.input.className = ""; }); score.textContent = ""; },
    });
    return h("div", {}, paras, score, row);
  },
};

// ---------- navigation ----------
// Routes: #home   #unit/1/0 (unit 1, page 0 = overview)   #tasks/2
function buildNav() {
  const links = [["home", "#home", "Home"],
    ...manifest.units.map((u, i) => [`unit-${i + 1}`, `#unit/${i + 1}/0`, `${i + 1} · ${u.title}`]),
    ["tasks", "#tasks/0", "Key Tasks"]];
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
