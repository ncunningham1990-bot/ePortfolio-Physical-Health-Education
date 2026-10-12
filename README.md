# PE ePortfolio Hub

A website for Grade 9/10 Physical & Health Education students: topic pages, the 4 key ePortfolio tasks with a rubric, and interactive activities.

## Where things live
| Folder | What it is |
|---|---|
| `site/content/topics/*.md` | One file per topic (Topics tab). |
| `site/content/tasks/*.md` | The rubric (`00-`) and the 4 key tasks (Key Tasks tab). |
| `site/activities/` | Interactive activities (plain HTML). Link one from a topic with `activity: activities/your-file.html` in the file's header. |

Header at the top of each `.md` file:
```
---
title: Page title
summary: One line shown in the menu
activity: activities/optional.html
---
```
Pages appear in filename order (`01-`, `02-`, ...).

## Preview on your computer
```
npm install
npm run preview
```

## Publish with GitHub Pages
1. Merge your work into the `main` branch.
2. On GitHub: Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. The site goes live at `https://<your-username>.github.io/<repo-name>/` and updates every time you change `main`.
