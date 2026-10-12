// Reads the markdown files teachers edit and generates two things:
//   site/content/manifest.json         -> the list of pages the website shows
//   netlify/functions/_knowledge.json  -> the approved sources the chatbot may use
// Run with: npm run build
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const siteContent = join(root, "site", "content");
const knowledgeDir = join(root, "knowledge");

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
const knowledge = [];

for (const section of ["topics", "tasks"]) {
  for (const file of mdFiles(join(siteContent, section))) {
    const { meta, body } = parse(readFileSync(file, "utf8"));
    const path = relative(join(root, "site"), file);
    manifest[section].push({
      title: meta.title || path,
      summary: meta.summary || "",
      activity: meta.activity || "",
      path,
    });
    knowledge.push({ source: path, title: meta.title || path, text: body });
  }
}

for (const file of mdFiles(knowledgeDir)) {
  const { meta, body } = parse(readFileSync(file, "utf8"));
  const path = relative(root, file);
  knowledge.push({ source: path, title: meta.title || path, text: body });
}

writeFileSync(join(siteContent, "manifest.json"), JSON.stringify(manifest, null, 2));
writeFileSync(join(root, "netlify", "functions", "_knowledge.json"), JSON.stringify(knowledge));
console.log(
  `Built: ${manifest.topics.length} topics, ${manifest.tasks.length} task pages, ${knowledge.length} chatbot sources.`
);
