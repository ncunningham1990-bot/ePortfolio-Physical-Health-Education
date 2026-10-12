const TABS = ["home", "topics", "tasks"];
const $ = (id) => document.getElementById(id);

let manifest = { topics: [], tasks: [] };

const md = (text) => DOMPurify.sanitize(marked.parse(text));

// ---------- routing: #topics, #topics/1, #tasks/2 ----------
function route() {
  const [tab = "home", idx = "0"] = location.hash.slice(1).split("/");
  const active = TABS.includes(tab) ? tab : "home";
  for (const t of TABS) $(t).hidden = t !== active;
  document.querySelectorAll("#tabs a").forEach((a) => {
    if (a.dataset.tab === active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (active === "topics" || active === "tasks") showPage(active, Number(idx) || 0);
  window.scrollTo(0, 0);
}

async function showPage(section, i) {
  const items = manifest[section];
  const list = $(`${section}-list`);
  list.innerHTML = items
    .map((it, n) => `<li><a href="#${section}/${n}" ${n === i ? 'aria-current="true"' : ""}>${esc(it.title)}<small>${esc(it.summary)}</small></a></li>`)
    .join("");
  const doc = $(`${section}-doc`);
  const item = items[i];
  if (!item) { doc.innerHTML = "<p>Nothing here yet.</p>"; return; }
  try {
    const res = await fetch("content/" + item.path.replace(/^content\//, ""));
    const raw = await res.text();
    const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, "");
    const act = item.activity
      ? `<p><a class="btn" href="${esc(item.activity)}" target="_blank" rel="noopener">Open the interactive activity</a></p>` : "";
    doc.innerHTML = md(`# ${item.title}\n\n` + body).replace(/(<\/h1>)/, "$1" + act);
  } catch {
    doc.innerHTML = "<p>Could not load this page. Check your connection and try again.</p>";
  }
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function init() {
  try {
    manifest = await (await fetch("content/manifest.json")).json();
  } catch {
    $("main").insertAdjacentHTML("afterbegin", '<p class="notice">Could not load course content. Run <code>npm run build</code>.</p>');
  }
  window.addEventListener("hashchange", route);
  route();
}
init();
