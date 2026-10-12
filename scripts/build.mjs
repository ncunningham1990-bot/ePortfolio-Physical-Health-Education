// Reads the markdown files in site/content and generates site/content/manifest.json,
// the list of units and pages the website shows. Also checks interactive tasks for typing mistakes.
// Run with: npm run build
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { checkWidgets } from "../site/parse-widgets.js";

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
  return { title: meta.title || path, summary: meta.summary || "", activity: meta.activity || "", path };
}

const mdIn = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).sort().map((f) => join(dir, f)) : [];

const manifest = { units: [], tasks: mdIn(join(contentDir, "tasks")).map(readPage) };

const topicsDir = join(contentDir, "topics");
const unitDirs = readdirSync(topicsDir).filter((d) => statSync(join(topicsDir, d)).isDirectory()).sort();
for (const d of unitDirs) {
  const dir = join(topicsDir, d);
  const overviewFile = join(dir, "_unit.md");
  const overview = existsSync(overviewFile) ? readPage(overviewFile) : { title: d, summary: "", path: "" };
  manifest.units.push({
    title: overview.title,
    summary: overview.summary,
    overview: overview.path,
    pages: mdIn(dir).filter((f) => !f.endsWith("_unit.md")).map(readPage),
  });
}

if (errors.length) {
  console.error("\nContent problems found:\n - " + errors.join("\n - ") + "\n");
  process.exit(1);
}
writeFileSync(join(contentDir, "manifest.json"), JSON.stringify(manifest, null, 2));
const pages = manifest.units.reduce((n, u) => n + u.pages.length, 0);
console.log(`Built: ${manifest.units.length} units, ${pages} lessons, ${manifest.tasks.length} task pages, ${widgetCount} interactive tasks.`);
