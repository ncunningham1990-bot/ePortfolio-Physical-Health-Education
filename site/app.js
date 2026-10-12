const LANGUAGES = {
  en: "English", es: "Español (Spanish)", fr: "Français (French)", ar: "العربية (Arabic)",
  zh: "中文 (Chinese)", hi: "हिन्दी (Hindi)", pa: "ਪੰਜਾਬੀ (Punjabi)", tl: "Tagalog (Filipino)",
  vi: "Tiếng Việt (Vietnamese)", ur: "اردو (Urdu)", so: "Soomaali (Somali)", uk: "Українська (Ukrainian)",
};
const TABS = ["home", "topics", "tasks", "assistant"];
const $ = (id) => document.getElementById(id);
const safeStore = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
};

let manifest = { topics: [], tasks: [] };
let history = [];

const md = (text) => DOMPurify.sanitize(marked.parse(text));

// ---------- routing: #topics, #topics/1, #tasks/2, #assistant ----------
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

// ---------- chat ----------
function addMsg(role, text, extra = "") {
  const div = document.createElement("div");
  div.className = `msg ${role} ${extra}`;
  if (role === "bot" && !extra) div.innerHTML = md(text); else div.textContent = text;
  $("log").appendChild(div);
  div.scrollIntoView({ block: "nearest" });
}

async function send(e) {
  e.preventDefault();
  const text = $("msg").value.trim();
  if (!text) return;
  $("msg").value = "";
  addMsg("user", text);
  history.push({ role: "user", content: text });
  $("send").disabled = true;
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: history,
        language: $("lang").value,
        task: $("task").value,
        code: $("code").value,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) $("code-wrap").hidden = false;
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    history.push({ role: "assistant", content: data.reply });
    addMsg("bot", data.reply);
  } catch (err) {
    history.pop(); // let the student resend
    $("msg").value = text;
    addMsg("bot", err.message, "err");
  } finally {
    $("send").disabled = false;
    $("msg").focus();
  }
}

async function init() {
  try {
    manifest = await (await fetch("content/manifest.json")).json();
  } catch {
    $("main").insertAdjacentHTML("afterbegin", '<p class="notice">Could not load course content. Run <code>npm run build</code>.</p>');
  }
  $("lang").innerHTML = Object.entries(LANGUAGES).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
  $("lang").value = safeStore.get("lang") || "en";
  $("lang").addEventListener("change", () => safeStore.set("lang", $("lang").value));
  const taskOpts = ["Not sure yet", ...manifest.tasks.map((t) => t.title).filter((t) => !/rubric/i.test(t))];
  $("task").innerHTML = taskOpts.map((t) => `<option>${esc(t)}</option>`).join("");
  $("chat-form").addEventListener("submit", send);
  $("msg").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) $("chat-form").requestSubmit(), e.preventDefault();
  });
  $("clear").addEventListener("click", () => { history = []; $("log").innerHTML = ""; });
  addMsg("bot", "Hi! Tell me which task you are working on and what you would like help with. I'll ask questions and give feedback, but the writing and ideas stay yours.");
  window.addEventListener("hashchange", route);
  route();
}
init();
