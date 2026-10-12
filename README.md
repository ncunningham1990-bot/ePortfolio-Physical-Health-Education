# PE ePortfolio Hub

A website for Grade 9/10 Physical & Health Education students: topic pages, the 4 key ePortfolio tasks with a rubric, and interactive activities.

## Where things live
| Folder | What it is |
|---|---|
| `site/content/topics/<unit>/` | One folder per unit (each is a tab). Inside: `_unit.md` (overview) and one `.md` file per lesson. |
| `site/content/tasks/*.md` | The rubric (`00-`) and the 4 key tasks (Key Tasks tab). |
| `site/activities/` | Stand-alone interactive activities (plain HTML). Link one from a lesson with `activity: activities/your-file.html` in the file's header. |

Units: `01-health-fitness`, `02-anatomy`, `03-diet-nutrition`, `04-sports-psychology`. Units and lessons appear in filename order (`01-`, `02-`, ...). To add a lesson, add a new numbered `.md` file to a unit folder. To add a unit, add a new folder and a `_unit.md` in it.

Header at the top of each `.md` file:
```
---
title: Page title
summary: One line shown in the menu
activity: activities/optional.html
---
```

## Interactive tasks (type these inside any lesson)
**Quiz** (multiple choice). `Q:` question, `-` wrong answer, `+` right answer, `?` optional explanation. Blank line between questions. Answers are shuffled for students.
````
```quiz
Q: Which muscle straightens the knee?
- Hamstrings
+ Quadriceps
? Quadriceps extend the knee.
```
````
**Flashcards** (click to flip): `term :: definition`
````
```flashcards
Flexibility :: The range of movement at a joint
```
````
**Matching**: `left = right` (the right-hand choices are shuffled)
````
```match
Elbow = Hinge
Shoulder = Ball and socket
```
````
**Fill in the blanks**: put answers in `{braces}`; use `{a|b}` to accept two answers
````
```fill
Tendons join muscle to {bone}.
```
````
If you make a typing mistake in one of these, the build stops and the **Actions** tab shows which file and what is wrong.

## Preview on your computer
```
npm install
npm run preview
```

## Publish with GitHub Pages
1. Merge your work into the `main` branch.
2. On GitHub: Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. The site goes live at `https://<your-username>.github.io/<repo-name>/` and updates every time you change `main`.
