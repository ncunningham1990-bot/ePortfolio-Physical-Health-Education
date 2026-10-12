// Reads the markdown files in site/content and generates site/content/manifest.json,
// the list of units and pages the website shows. Also checks interactive tasks for typing mistakes.
// Run with: npm run build
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { checkWidgets, parseClinic, checkClock } from "../site/parse-widgets.js";

const root = new URL("..", import.meta.url).pathname;
const siteDir = join(root, "site");
const contentDir = join(siteDir, "content");

function parse(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta = {};
  let body = raw;
  if (m) {
    body = m[2];
    for (const line of m[1].split("\n")) {
      const i = line.indexOf(":");
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return { meta, body: body.trim() };
}

const errors = [];
let widgetCount = 0;

function readPage(file) {
  const { meta, body } = parse(readFileSync(file, "utf8"));
  const path = relative(siteDir, file);
  try {
    widgetCount += checkWidgets(body);
  } catch (e) {
    errors.push(`${path}: ${e.message}`);
  }
  return { title: meta.title || path, summary: meta.summary || "", activity: meta.activity || "", icon: meta.icon || "", short: meta.short || "", path };
}

const mdIn = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).sort().map((f) => join(dir, f)) : [];

// counts the top-level checklist items on a task page (the tickable tracker items)
function checklistCount(file) {
  const body = parse(readFileSync(file, "utf8")).body;
  const m = body.match(/^## Checklist[^\n]*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m);
  return m ? (m[1].match(/^(?:\d+\.|[-*])\s/gm) || []).length : 0;
}
const taskPages = mdIn(join(contentDir, "tasks")).map((f) => ({ ...readPage(f), checklist: checklistCount(f) }));
const manifest = { units: [], tasks: taskPages, bank: [], clock: [], clinic: [] };

for (const f of mdIn(join(contentDir, "bank"))) {
  const { meta } = parse(readFileSync(f, "utf8"));
  manifest.bank.push({ ...readPage(f), unit: Number(meta.unit) || 0 });
}

let clockQs = 0;
for (const f of mdIn(join(contentDir, "clock"))) {
  const { meta, body } = parse(readFileSync(f, "utf8"));
  const path = relative(siteDir, f);
  try {
    const n = checkClock(body);
    clockQs += n;
    manifest.clock.push({ title: meta.title || path, unit: Number(meta.unit) || 0, path, questions: n });
  } catch (e) { errors.push(`${path}: ${e.message}`); }
}

for (const f of mdIn(join(contentDir, "clinic"))) {
  const { meta, body } = parse(readFileSync(f, "utf8"));
  const path = relative(siteDir, f);
  try {
    const c = parseClinic(body);
    manifest.clinic.push({ id: path.split("/").pop().replace(/\.md$/, ""), title: meta.title || path, unit: Number(meta.unit) || 0, icon: meta.icon || "🩺", summary: meta.summary || "", path, scenes: c.scenes.length });
  } catch (e) { errors.push(`${path}: ${e.message}`); }
}

const topicsDir = join(contentDir, "topics");
const unitDirs = readdirSync(topicsDir).filter((d) => statSync(join(topicsDir, d)).isDirectory()).sort();
for (const d of unitDirs) {
  const dir = join(topicsDir, d);
  const overviewFile = join(dir, "_unit.md");
  const overview = existsSync(overviewFile) ? readPage(overviewFile) : { title: d, summary: "", path: "" };
  manifest.units.push({
    title: overview.title,
    summary: overview.summary,
    icon: overview.icon,
    short: overview.short,
    overview: overview.path,
    pages: mdIn(dir).filter((f) => !f.endsWith("_unit.md")).map(readPage),
  });
}

// deadlines: site/content/deadlines.json maps a task file name to a list of { label, date: "YYYY-MM-DD" }
const dlFile = join(contentDir, "deadlines.json");
if (existsSync(dlFile)) {
  try {
    const dl = JSON.parse(readFileSync(dlFile, "utf8"));
    const names = manifest.tasks.map((t) => t.path.split("/").pop());
    for (const [file, list] of Object.entries(dl)) {
      if (!names.includes(file)) errors.push(`content/deadlines.json: "${file}" is not a task file in content/tasks`);
      for (const d of list) {
        if (!d.label || !/^\d{4}-\d{2}-\d{2}$/.test(d.date || "") || Number.isNaN(Date.parse(d.date))) errors.push(`content/deadlines.json: "${file}" has a deadline that needs a label and a date like 2026-02-03`);
      }
    }
  } catch (e) { errors.push(`content/deadlines.json: ${e.message}`); }
}

if (errors.length) {
  console.error("\nContent problems found:\n - " + errors.join("\n - ") + "\n");
  process.exit(1);
}
writeFileSync(join(contentDir, "manifest.json"), JSON.stringify(manifest, null, 2));
const pages = manifest.units.reduce((n, u) => n + u.pages.length, 0);
console.log(`Built: ${manifest.units.length} units, ${pages} lessons, ${manifest.tasks.length} task pages, ${manifest.bank.length} challenge-bank files, ${clockQs} Beat the Clock questions, ${manifest.clinic.length} Coach's Clinic cases, ${widgetCount} interactive tasks.`);
