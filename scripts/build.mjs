// Reads the markdown files in site/content and generates site/content/manifest.json,
// the list of pages the website shows.
// Run with: npm run build
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const siteContent = join(root, "site", "content");

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

function mdFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => join(dir, f));
}

const manifest = { topics: [], tasks: [] };

for (const section of ["topics", "tasks"]) {
  for (const file of mdFiles(join(siteContent, section))) {
    const { meta } = parse(readFileSync(file, "utf8"));
    const path = relative(join(root, "site"), file);
    manifest[section].push({
      title: meta.title || path,
      summary: meta.summary || "",
      activity: meta.activity || "",
      path,
    });
  }
}


writeFileSync(join(siteContent, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Built: ${manifest.topics.length} topics, ${manifest.tasks.length} task pages.`);
