# PHE ePortfolio Hub

A website for Grade 9/10 Physical & Health Education students: topic pages, the 4 key ePortfolio tasks with a rubric, and interactive activities.

## Where things live
| Folder | What it is |
|---|---|
| `site/content/topics/<unit>/` | One folder per unit (each is a tab). Inside: `_unit.md` (overview) and one `.md` file per lesson. |
| `site/content/tasks/*.md` | The rubric (`00-`) and the 4 key tasks (Key Tasks tab). |
| `site/activities/` | Stand-alone interactive activities (plain HTML). Link one from a lesson with `activity: activities/your-file.html` in the file's header. |

Units: `01-health-fitness`, `02-anatomy`, `03-diet-nutrition`, `04-sports-psychology`. Lesson names follow the course handbook. Units and lessons appear in filename order (`01-`, `02-`, ...). To add a lesson, add a new numbered `.md` file to a unit folder. To add a unit, add a new folder and a `_unit.md` in it.

Header at the top of each `.md` file:
```
---
title: Page title
summary: One line shown in the menu
activity: activities/optional.html
---
```

## Interactive tasks (type these inside any lesson)
Wrong answers never show the correct answer. Students get a **hint** that explains why, then try again. Hints are required for quiz wrong-answers and fill-in blanks; the build stops with a clear message if one is missing.

**Quiz.** `Q:` question, `- wrong answer | hint for that answer`, `+ right answer`, optional `H:` extra hint (shown on the second wrong try) and `?` message shown once correct. Blank line between questions. Answers are shuffled.
````
```quiz
Q: Which muscle straightens the knee?
- Hamstrings | These bend the knee. Which muscle is on the opposite side of the thigh?
+ Quadriceps
H: Look at the table of major muscles.
```
````
**Matching:** `left = right | optional hint`. **Fill in the blanks:** `{answer::hint}` (use `{a|b::hint}` to accept two answers).
````
```match
Elbow = Hinge | Think about a door.
```
```fill
Tendons join muscle to {bone::What do tendons attach muscle to?}.
```
````
**Put in order** (steps listed in the correct order; the page shuffles them) and **label a diagram** (numbered image + answers):
````
```order
Q: Put the steps in order.
Warm up | Think about what comes first.
Main activity
Cool down
```
```label
image: images/skeleton-numbered.svg
alt: Description of the diagram
1 = Cranium | Hint
2 = Femur | Hint
```
````
**Flashcards:** `term :: definition`.

**Video placeholder or YouTube video.** Leave `url:` empty to show a "Video coming soon" box. Paste a YouTube link after `url:` to embed it.
````
```video
title: How to do the bleep test
url: https://www.youtube.com/watch?v=XXXXXXXXXXX
note: Optional text under the video
```
````
**Podcast / audio.** Upload the MP3 to `site/audio/` and add:
````
```audio
title: Name of the podcast
url: audio/my-podcast.mp3
note: Optional text under the player
```
````
Students get a player with speed buttons and a download link.

If you make a typing mistake in one of these, the build stops and the **Actions** tab shows which file and what is wrong.

### Written scenario questions ("Think deeper")

For application and critical-thinking questions, students type an answer, get automatic keyword feedback, then see the mark scheme and self-assess.

````
```written
Level: Apply
Q: A swimmer's resting heart rate is rising and she feels tired. What is happening and what would you change?
* She may be over-training :: over train* | overtrain* | too much :: Guiding prompt shown if the point is missing
* Reduce load and add rest :: reduce* | rest | recover* :: What should change in her programme?
Model: A strong example answer that earns every mark point.
```
````

- `Level:` is Apply, Analyse, Evaluate or Create. Use 2 to 8 mark points, each written as `* mark point :: keywords :: guiding prompt`.
- Keywords: `a | b` means either, `a & b` means both, `( )` groups, `word*` allows any ending. Plain words also match -s, -es, -ed, -ing.
- The build fails if the `Model:` answer does not earn every mark point, so check the keywords after editing.
- Put them at the end of a lesson under `## Think deeper`, or in the Challenge Bank.

### Challenge Bank

Files in `site/content/bank/` (front matter: `title`, `unit: 1-4`, `summary`) hold `written` questions grouped under `## Topic` headings. They appear on the Challenges tab with filters for unit, level and status.

### Beat the Clock and Coach's Clinic

Both live under the **Challenges** tab.

**Beat the Clock** reads quiz blocks from `site/content/clock/*.md` (front matter: `title`, `unit: 1-4`). Use the normal `quiz` format with 3 to 5 options and a hint on every wrong option. Avoid true/false questions, because a hint on one wrong answer would give away the other.

**Coach's Clinic** has one case per file in `site/content/clinic/*.md` (front matter: `title`, `unit`, `icon`, `summary`). The body looks like this:

```
Patient: Maya, 15, club swimmer
Intro: The story set-up.

Scene: What has happened and what must the student decide?
Data: Resting heart rate: 58 to 68 bpm | Sleep: 6 hours
+ The best choice | What happens next (shown after a good choice)
~ A partly right choice | What to improve (student may accept it or rethink)
- A wrong choice | A hint (the student tries again)

Debrief: Wrap-up shown at the end.
```

Each case needs 3 to 7 scenes, each with exactly one `+`, at least one `-` and 3 to 5 choices in total. Points: 2 for the best choice first time, 1 after a slip. Stars: 3 for 90% or more, 2 for 60% or more, otherwise 1. `npm run build` checks the format and tells you which file and rule failed.

### ePortfolio tab: tracker, deadlines and task tools

- **Checklist tracker:** every top-level item under `## Checklist` on a task page gets a tick box. Ticks are saved in the student's browser. Add or edit checklist items in the task's markdown file and the tracker updates itself.
- **Deadline countdown:** edit `site/content/deadlines.json`. Each task file name has a list of `{ "label": "Draft", "date": "2026-02-03" }`. The countdown runs to the end of that day on the student's device clock. Update the dates and years each time you run the course. `npm run build` checks the file.
- **SMART goal builder and Session planner** (Task 2 sub-tabs) and the **Self-check** (all four tasks) live in `site/tools.js`. Their prompts quote the Task 2 checklist.
- **Self-check rules** are in `site/selfcheck.js`. Each check lists key words to look for, a strength message, and the steps shown when it is missing. If you change a checklist or rubric, update the matching checks. The tool only looks for key words and gives written feedback with no grade or band, never rewrites work, and does not save or send what students paste.

## Images and diagrams
Pictures go in `site/images/` and are shown with `![Description](images/name.svg)`. The diagrams in this repo (skeleton, joints, graphs, test protocols...) are generated by the Python scripts in `tools/images/`. To change one, edit the script and run `python3 tools/images/build_all.py`, or replace the file in `site/images/` with your own picture.

## Look and feel, progress and badges
- **Theme:** "Athletic Pro". Colours and fonts are at the top of `site/style.css`. Headings use Montserrat and body text uses Inter; both font files are bundled in `site/vendor/fonts`, so no internet access to Google is needed.
- **Unit tab details:** in each unit's `_unit.md` header you can set `icon:` (an emoji shown on the unit card and badge) and `short:` (a shorter name for the top menu).
- **Progress and badges:** saved in the student's own browser (no login, nothing is sent anywhere). A lesson completes when every quiz, matching, fill-in, ordering and labelling activity in it is finished correctly. Badges are defined in `badgeDefs()` in `site/app.js`.

## PHE e-Coach chatbot (MagicSchool)
The chatbot lives in MagicSchool, not on this site, so you can monitor it from your MagicSchool account.
- `docs/magicschool-chatbot-instructions.md`: set-up steps, the instructions to paste into MagicSchool, a test checklist and a monitoring checklist.
- `docs/magicschool-knowledge-base.md`: all lesson content without quiz answers, to upload as the bot's knowledge. Regenerate it with `python3 tools/make_knowledge_base.py`.
- `docs/magicschool-eportfolio-tasks.md`: the four task pages and rubrics, for the bot to give feedback against. Created by the same command.
- `site/content/chatbot.json`: paste the MagicSchool room link after `"url":` and the **ePortfolio** tab shows the e-Coach card with an "Open PHE e-Coach" button. While `url` is empty it shows "Coming soon".

## Preview on your computer
```
npm install
npm run preview
```

## Publish with GitHub Pages
1. Merge your work into the `main` branch.
2. On GitHub: Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. The site goes live at `https://<your-username>.github.io/<repo-name>/` and updates every time you change `main`.
