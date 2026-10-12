"""Builds docs/magicschool-knowledge-base.md from the lesson files (without quiz answers)
and docs/magicschool-eportfolio-tasks.md from the ePortfolio task pages and rubrics.
Run from the repo root:  python3 tools/make_knowledge_base.py
"""
import glob, os, re

ROOT = "site/content/topics"
HEADER = """# PHE course knowledge base (for the chatbot)

Source: the lessons on the PE ePortfolio Hub website. Quiz and activity answers are NOT included.
Upload this file to your MagicSchool chatbot (or paste sections of it) so the bot answers only from approved course content.
Re-generate it with `python3 tools/make_knowledge_base.py` after you change lessons.
"""

def parse(path):
    raw = open(path, encoding="utf8").read()
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", raw, re.S)
    meta, body = {}, raw
    if m:
        body = m.group(2)
        for line in m.group(1).split("\n"):
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
    return meta, body.strip()

def clean(body):
    body = re.sub(r"^```(quiz|flashcards|match|fill|order|label|video|audio|written)[ \t]*\n.*?^```[ \t]*\n?", "", body, flags=re.M | re.S)
    body = re.sub(r"^!\[([^\]]*)\]\([^)]*\)\s*$", lambda m: f"[Diagram: {m.group(1)}]", body, flags=re.M)
    body = re.sub(r"^\*\*Find out more.*$", "", body, flags=re.M)
    body = re.sub(r"^## Try it\s*$", "", body, flags=re.M)
    body = re.sub(r"\n{3,}", "\n\n", body)
    return body.strip()

TASKS = "site/content/tasks"
TASKS_HEADER = """# PHE ePortfolio tasks and rubrics (for the chatbot)

Source: the ePortfolio tab on the PHE ePortfolio Hub website. Upload this file to your MagicSchool chatbot so PHE e-Coach can
explain the tasks and give feedback against the real rubrics.
Re-generate it with `python3 tools/make_knowledge_base.py` after you change the task pages.
"""

def tasks_doc():
    out = [TASKS_HEADER]
    for p in sorted(glob.glob(os.path.join(TASKS, "*.md"))):
        m, b = parse(p)
        b = re.sub(r"^```audio[ \t]*\n.*?^```[ \t]*\n?", "", b, flags=re.M | re.S)
        b = re.sub(r"<details>.*?</details>\s*", "", b, flags=re.S)
        b = re.sub(r"^!\[([^\]]*)\]\([^)]*\)\s*$", lambda x: f"[Image: {x.group(1)}]", b, flags=re.M)
        b = b.replace("<br><br>", " / ").replace("<br>", " ")
        b = re.sub(r"\n{3,}", "\n\n", b).strip()
        out.append(f"\n\n# {m.get('title')}\n\n{b.replace(chr(10) + '## ', chr(10) + '## ')}\n")
    text = "\n".join(out)
    open("docs/magicschool-eportfolio-tasks.md", "w", encoding="utf8").write(text)
    print(f"docs/magicschool-eportfolio-tasks.md: {len(text.split())} words")

def main():
    out = [HEADER]
    units = sorted(d for d in os.listdir(ROOT) if os.path.isdir(os.path.join(ROOT, d)))
    for ui, u in enumerate(units, 1):
        meta, _ = parse(os.path.join(ROOT, u, "_unit.md"))
        out.append(f"\n\n# UNIT {ui}: {meta.get('title')}\n")
        for p in sorted(glob.glob(os.path.join(ROOT, u, "*.md"))):
            if p.endswith("_unit.md"):
                continue
            m, b = parse(p)
            if m.get("title", "").lower() == "unit review":
                continue
            out.append(f"\n## Lesson: {m.get('title')}\n")
            out.append(clean(b).replace("\n## ", "\n### ") + "\n")
    text = "\n".join(out)
    os.makedirs("docs", exist_ok=True)
    open("docs/magicschool-knowledge-base.md", "w", encoding="utf8").write(text)
    print(f"docs/magicschool-knowledge-base.md: {len(text.split())} words")

main()
tasks_doc()
