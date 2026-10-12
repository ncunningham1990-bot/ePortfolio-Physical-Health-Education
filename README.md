# PE ePortfolio Hub

A website for Grade 9/10 Physical & Health Education students: topic pages, the 4 key ePortfolio tasks with a rubric, interactive activities, and a study-guide chatbot that coaches but never does the work. The chatbot answers only from the approved sources you write, and can reply in 12 languages.

## Where things live
| Folder | What it is |
|---|---|
| `site/content/topics/*.md` | One file per topic. Shown on the Topics tab **and** read by the chatbot. |
| `site/content/tasks/*.md` | The rubric (`00-`) and the 4 key tasks. Shown on the Key Tasks tab **and** read by the chatbot. |
| `knowledge/*.md` | Chatbot-only sources (misconceptions, teacher notes). Students don't see these. |
| `site/activities/` | Interactive activities (plain HTML files). Link one from a topic with `activity: activities/your-file.html` in the file's header. |
| `netlify/functions/chat.mjs` | The chatbot server code, including the rules that stop it doing students' work. |

Page header format (top of each `.md`):
```
---
title: Page title
summary: One line shown in the menu
activity: activities/optional.html
---
```
Pages appear in filename order (`01-`, `02-`, ...).

## Run it on your computer
```
npm install
npm run preview            # website only, at http://localhost:3000 (chat won't answer)
ANTHROPIC_API_KEY=sk-... npx netlify dev   # website + working chatbot
```

## Put it online (Netlify)
1. Push this repo to GitHub, then create a Netlify site from it (build settings are already in `netlify.toml`).
2. In Netlify → Site settings → Environment variables add:
   - `ANTHROPIC_API_KEY` (from console.anthropic.com), required
   - `CLASS_CODE` (a word you tell students), strongly recommended so strangers can't spend your budget
   - `CHAT_MODEL` (optional; default `claude-opus-5-5`. Set `claude-sonnet-5-5` or `claude-haiku-5-5` for lower cost)
3. Set a monthly spend limit in the Anthropic console.

## Before students use it
- Replace the placeholder topics, tasks and rubric with your real ones. The chatbot's feedback is only as good as the rubric text.
- Try to break it as a student would (ask it to write a paragraph, "just one example", rewrite my intro, in other languages) and tweak the rules in `chat.mjs` if needed.
- Check your school's policy on AI tools and student data. Conversations are sent to Anthropic's API; the site stores nothing about students.
