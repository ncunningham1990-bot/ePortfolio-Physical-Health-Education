// Task tools shown as sub-tabs on the ePortfolio task pages:
//   SMART goal builder and Training session planner (Task 2) and the rubric self-check (Tasks 1 to 4).
// They guide students with prompts and checks. They never write the student's work for them.
import { runSelfCheck, SELF_CHECK_TASKS } from "./selfcheck.js";

const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) v === false || v == null ? 0 : el.setAttribute(k, v === true ? "" : v);
  for (const k of kids.flat()) if (k !== false && k != null) el.append(k);
  return el;
};
const words = (t) => (String(t || "").match(/\S+/g) || []).length;
const nums = (t) => (String(t || "").match(/\d+(?:\.\d+)?/g) || []).length;
const has = (t, rx) => rx.test(String(t || ""));
let uidc = 0;
const uid = (p) => `${p}${++uidc}`;

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  const ta = h("textarea", { style: "position:fixed;left:-999px" });
  ta.value = text;
  document.body.append(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch {}
  ta.remove();
  return ok;
}

function saveSoon(ctx) {
  clearTimeout(saveSoon.t);
  saveSoon.t = setTimeout(ctx.save, 400);
}

// a labelled textarea with guidance, a word count and live "add this" hints
function area({ label, guide, think, starter, rows = 3, value, hint, onInput, ctx }) {
  const id = uid("tl");
  const ta = h("textarea", { id, rows: String(rows), class: "tl-ta", "aria-describedby": id + "-h" });
  ta.value = value || "";
  const status = h("div", { class: "tl-status", id: id + "-h", "aria-live": "polite" });
  const count = h("span", { class: "tl-count" });
  const refresh = () => {
    const t = ta.value;
    count.textContent = `${words(t)} words`;
    const r = hint ? hint(t) : { ok: true, tips: [] };
    status.replaceChildren();
    if (!words(t)) status.append(h("span", { class: "tl-chip" }, "Not started"));
    else if (r.ok) status.append(h("span", { class: "tl-chip ok" }, "✓ Looks complete"));
    else status.append(h("span", { class: "tl-chip warn" }, "Keep going"), ...r.tips.map((x) => h("span", { class: "tl-tip" }, x)));
    return r.ok && words(t) > 0;
  };
  ta.addEventListener("input", () => { onInput(ta.value); const ok = refresh(); saveSoon(ctx); wrap.dispatchEvent(new CustomEvent("tl-change", { bubbles: true, detail: ok })); });
  const wrap = h("div", { class: "tl-field" },
    h("label", { for: id }, label),
    guide ? h("p", { class: "tl-guide" }, guide) : false,
    think && think.length ? h("ul", { class: "tl-think" }, think.map((x) => h("li", {}, x))) : false,
    starter ? h("p", { class: "tl-starter" }, h("strong", {}, "Sentence starter: "), starter) : false,
    ta, h("div", { class: "tl-meta" }, status, count));
  wrap.isOk = () => refresh();
  refresh();
  return wrap;
}

const ensure = (obj, key, def) => (obj[key] == null ? (obj[key] = def) : obj[key]);

// =====================================================================
// SMART goal builder
// =====================================================================
const SMART = {
  physical: {
    title: "Physical goal",
    intro: "One physical goal that will improve your client's performance in the Athletics event.",
    fields: {
      s: { name: "Specific", guide: "Say exactly what will improve. Use the weak physical aspects from your Task 1 analysis.",
        think: ["Which component of fitness is weak (power, speed, strength, flexibility...)?", "Which aspect of the technique or phase of the event needs work?", "How will improving it improve the event result?"],
        starter: "My client's [component or technique aspect] will improve so that...",
        hint: (t) => { const tips = []; if (words(t) < 15) tips.push("Say more: aim for at least 15 words."); if (!has(t, /power|speed|strength|flexib|endurance|agility|coordination|technique|take.?off|phase|approach|flight|landing|start|release|balance/i)) tips.push("Name the component of fitness or the phase of technique."); if (!has(t, /event|perform|jump|throw|run|sprint|race|hurdle|relay|distance|height|time|result/i)) tips.push("Say how it improves the event."); return { ok: !tips.length, tips }; } },
      m: { name: "Measurable", guide: "Use numbers: a baseline and a target, and the test or event result that measures it. Use your Task 1 averages.",
        think: ["What is the baseline score (your 3-trial average)?", "What is the target score?", "Which fitness test or event result will you measure it with?"],
        starter: "...from [baseline] to [target], measured by [test or event result].",
        hint: (t) => { const tips = []; if (nums(t) < 2) tips.push("Add both a baseline number and a target number."); if (!has(t, /from|to |increase|decrease|improve|reduce|by |measured|test/i)) tips.push("Say how it is measured and what changes."); return { ok: !tips.length, tips }; } },
      a: { name: "Achievable", guide: "Show it is challenging but obtainable for your client over the time you have.",
        think: ["Is the target realistic from the baseline?", "How do the 8 sessions and your training methods make it possible?", "How does it compare with normative data or your client's experience?"],
        starter: "This is achievable because...",
        hint: (t) => { const tips = []; if (words(t) < 12) tips.push("Explain more: at least 12 words."); if (!has(t, /baseline|currently|initial|average|test|session|week|realistic|achievable|normative|possible|because|since/i)) tips.push("Use your baseline, the sessions or normative data as evidence."); return { ok: !tips.length, tips }; } },
      r: { name: "Relevant", guide: "Link the goal to the event and to the weaknesses you found.",
        think: ["Which weakness from Task 1 does it address?", "How does it change the event result?", "Why does it matter for this client?"],
        starter: "This goal is relevant because it...",
        hint: (t) => { const tips = []; if (words(t) < 10) tips.push("Explain more: at least 10 words."); if (!has(t, /event|perform|weakness|result|improve|technique|need|athlet|because/i)) tips.push("Link it to the event and a weakness."); return { ok: !tips.length, tips }; } },
      t: { name: "Timely", guide: "Give a deadline, the number of sessions and when you will check progress.",
        think: ["What is the final date or session number?", "When is the interim re-test (after session 4)?", "How many weeks or sessions are planned?"],
        starter: "I will achieve this by [date] after [number] sessions, with a check at...",
        hint: (t) => { const tips = []; if (!has(t, /\d+\s*(?:sessions?|weeks?|days?|months?)|\bby\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*|deadline|interim|re.?test|session\s*\d/i)) tips.push("Add a deadline, a number of sessions or weeks, or a date."); if (!has(t, /interim|re.?test|check|review|halfway|half.?way|after (?:session )?(?:4|four)/i)) tips.push("Say when you will check progress."); return { ok: !tips.length, tips }; } },
    },
  },
  health: {
    title: "Health goal (psychology)",
    intro: "One health goal that focuses on psychology and will improve your client's performance. Relate it to social media use.",
    fields: {
      s: { name: "Specific", guide: "Focus on one psychological aspect and its link to social media or screen time.",
        think: ["Which aspect is weak (anxiety, confidence, motivation, arousal, stress, focus)?", "How does your client's social media or screen time connect to it?", "How will it affect performance in the event?"],
        starter: "My client will reduce/improve their [psychological aspect] by... which will help their performance because...",
        hint: (t) => { const tips = []; if (words(t) < 15) tips.push("Say more: aim for at least 15 words."); if (!has(t, /anxiety|confidence|motivation|arousal|stress|focus|concentrat|mental|resilien|emotion|mood|coping|self.?esteem|mindset|pressure|fear/i)) tips.push("Name the psychological aspect."); if (!has(t, /perform|event|competition|jump|throw|run|race/i)) tips.push("Say how it affects the event."); return { ok: !tips.length, tips }; } },
      m: { name: "Measurable", guide: "Name the measure (a questionnaire or tracked data) with a baseline and a target.",
        think: ["Which tool measures it (ACSI, CSAI-2, BSMAS, SMUIS, phone screen-time hours)?", "What is the baseline score?", "What is the target score or range?"],
        starter: "...from [baseline] to [target] on the [questionnaire or tracker].",
        hint: (t) => { const tips = []; if (nums(t) < 2) tips.push("Add both a baseline number and a target number."); if (!has(t, /acsi|csai|bsmas|smuis|who|questionnaire|survey|screen.?time|score|scale|tracker|app/i)) tips.push("Name the questionnaire or tracker."); return { ok: !tips.length, tips }; } },
      a: { name: "Achievable", guide: "Explain why the target is realistic for your client, using their baseline.",
        think: ["What does the baseline show about where they are now?", "How realistic is the change in the time available?", "Which techniques or changes will make it possible?"],
        starter: "This is achievable because my client currently... and the techniques are...",
        hint: (t) => { const tips = []; if (words(t) < 12) tips.push("Explain more: at least 12 words."); if (!has(t, /baseline|currently|initial|average|test|session|week|realistic|achievable|possible|because|since|time/i)) tips.push("Use the baseline or the time available as evidence."); return { ok: !tips.length, tips }; } },
      r: { name: "Relevant", guide: "Explain how improving it will improve performance in the event.",
        think: ["How does anxiety, confidence or focus change timing, rhythm or technique?", "How does social media or screen time affect this?", "Why does it matter for this client?"],
        starter: "This is relevant because a client who... will perform...",
        hint: (t) => { const tips = []; if (words(t) < 10) tips.push("Explain more: at least 10 words."); if (!has(t, /perform|event|technique|timing|focus|confidence|because|improve|arousal/i)) tips.push("Link it to performance in the event."); return { ok: !tips.length, tips }; } },
      t: { name: "Timely", guide: "Give a deadline, the number of sessions and when you will check progress.",
        think: ["What is the final date or session number?", "How often will the technique be practised?", "When will you re-measure?"],
        starter: "I will achieve this by [date] with [number] sessions of [minutes] each...",
        hint: (t) => { const tips = []; if (!has(t, /\d+\s*(?:sessions?|weeks?|days?|months?|minutes?)|\bby\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*|deadline|interim|re.?test|session\s*\d/i)) tips.push("Add a deadline, number of sessions or weeks, or a date."); if (!has(t, /interim|re.?test|check|review|halfway|half.?way|re.?measure|after (?:session )?(?:4|four)/i)) tips.push("Say when you will check progress."); return { ok: !tips.length, tips }; } },
    },
  },
};
const REL_HINT = (t) => { const tips = []; if (words(t) < 20) tips.push("Explain more: aim for at least 20 words."); if (!(has(t, /physical/i) && has(t, /health|psycholog|mental|anxiety|confidence/i))) tips.push("Refer to both the physical and the health goal."); if (!has(t, /overall|perform|event|improve|because|support|lead/i)) tips.push("Say how improving both leads to better overall performance."); return { ok: !tips.length, tips }; };

export function renderSmart(el, ctx) {
  const store = ensure(ctx.state.tools, "smart", {});
  ensure(store, "physical", {}); ensure(store, "health", {});
  const meter = h("div", { class: "tl-meter" });
  const checklist = h("ul", { class: "tl-req" });
  const fields = [];
  const update = () => {
    const okOf = (goal) => Object.keys(SMART[goal].fields).filter((k) => SMART[goal].fields[k].hint(store[goal][k] || "").ok && words(store[goal][k])).length;
    const phys = okOf("physical"), hl = okOf("health");
    const social = has(Object.values(store.health).join(" "), /social media|screen.?time|phone|instagram|tiktok|snapchat|online|digital|notifications/i);
    const rel = words(store.rel) && REL_HINT(store.rel || "").ok;
    const wb = words(store.wellbeing) >= 8 && has(store.wellbeing, /social|mental|spiritual/i);
    const parts = phys + hl + (social ? 1 : 0) + (rel ? 1 : 0) + (wb ? 1 : 0);
    meter.replaceChildren(h("div", { class: "tl-bar" }, h("i", { style: `width:${(parts / 13) * 100}%` })), h("p", {}, h("strong", {}, `${parts} of 13 parts complete`), " · Fill every box until all the requirements below are ticked."));
    const req = [
      [phys === 5, "One physical goal that will improve performance in the Athletics event, written in all five SMART parts"],
      [hl === 5, "One health goal that focuses on psychology and will improve performance, written in all five SMART parts"],
      [social, "The health goal relates to social media or screen time"],
      [!!rel, "You explain the relationship between your two goals and how improving them leads to overall improvement in the event"],
      [!!wb, "Your goals grow well-being beyond the physical (social, mental and/or spiritual)"],
    ];
    checklist.replaceChildren(...req.map(([ok, t]) => h("li", { class: ok ? "done" : "" }, h("span", { "aria-hidden": "true" }, ok ? "✅" : "⬜"), h("span", {}, (ok ? "Done: " : "To do: ") + t))));
    if (parts === 13 && !store.done) { store.done = true; ctx.save(); ctx.onGoalsDone(); }
  };
  const root = h("div", { class: "tl" });
  root.addEventListener("tl-change", update);
  root.append(
    h("h2", {}, "SMART goal builder"),
    h("div", { class: "tl-callout" },
      h("p", {}, h("strong", {}, "What the Task 2 checklist asks for (Physical and health goals)")),
      h("ul", {},
        h("li", {}, "Identify challenging but obtainable goals."),
        h("li", {}, "Develop meaningful goals towards improving performance that go beyond physical development and include growth in physical and social and/or mental and/or spiritual well-being."),
        h("li", {}, h("strong", {}, "One physical goal"), " that will improve your client's performance in the Athletics event."),
        h("li", {}, h("strong", {}, "One health goal"), " that focuses on psychology and will improve performance. Relate it to social media use."),
        h("li", {}, "Set goals in ", h("strong", {}, "SMART"), " format (Specific, Measurable, Achievable, Relevant, Timely)."),
        h("li", {}, "Explain the relationship between your two goals and how improving them leads to overall improvement in your event.")),
      h("p", { class: "tl-note" }, "Write in your own words. Each box shows what to include and checks for the key parts. It does not write anything for you. Your work is saved on this device only.")),
    meter, checklist);
  for (const goal of ["physical", "health"]) {
    const g = SMART[goal];
    const sec = h("section", { class: "tl-card" }, h("h3", {}, g.title), h("p", { class: "tl-lead" }, g.intro));
    for (const [k, f] of Object.entries(g.fields)) {
      const fld = area({ label: `${f.name}`, guide: f.guide, think: f.think, starter: f.starter, rows: 3, value: store[goal][k], hint: f.hint, onInput: (v) => { store[goal][k] = v; }, ctx });
      sec.append(h("div", { class: "tl-letter" }, h("span", { class: "tl-badge" }, f.name[0]), fld));
      fields.push(fld);
    }
    root.append(sec);
  }
  root.append(
    h("section", { class: "tl-card" }, h("h3", {}, "How the two goals connect"),
      area({ label: "Relationship between your goals", guide: "Explain how improving the health goal and the physical goal work together to improve your client's overall performance in the event.", think: ["How does the health goal support the physical goal?", "What happens to the event result if both improve?"], starter: "These goals are linked because...", rows: 4, value: store.rel, hint: REL_HINT, onInput: (v) => { store.rel = v; }, ctx })),
    h("section", { class: "tl-card" }, h("h3", {}, "Growth in well-being"),
      area({ label: "Which areas of well-being will grow?", guide: "Your goals should go beyond physical development. Name the areas that will grow (social, mental and/or spiritual as well as physical) and how.", think: ["How might a calmer, more confident client feel in other parts of life?", "How will your coach-client relationship or social media habits change?"], rows: 3, value: store.wellbeing, hint: (t) => { const tips = []; if (words(t) < 8) tips.push("Explain a little more: at least 8 words."); if (!has(t, /social|mental|spiritual/i)) tips.push("Name social, mental and/or spiritual well-being."); return { ok: !tips.length, tips }; }, onInput: (v) => { store.wellbeing = v; }, ctx })));
  const out = h("div", { class: "tl-actions" });
  const msg = h("span", { class: "tl-note", role: "status" });
  const copy = h("button", { type: "button", class: "btn lime" }, "Copy my goals");
  copy.onclick = async () => {
    const line = (g) => Object.entries(SMART[g].fields).map(([k, f]) => `${f.name}: ${store[g][k] || ""}`).join("\n");
    const text = `PHYSICAL GOAL\n${line("physical")}\n\nHEALTH GOAL\n${line("health")}\n\nRELATIONSHIP BETWEEN THE GOALS\n${store.rel || ""}\n\nGROWTH IN WELL-BEING\n${store.wellbeing || ""}\n`;
    msg.textContent = (await copyText(text)) ? "Copied. Paste it into your Task 2 document and keep improving it there." : "Could not copy. Select the text in each box instead.";
  };
  out.append(copy, msg);
  root.append(out);
  el.replaceChildren(root);
  update();
}

// =====================================================================
// Training session planner
// =====================================================================
const SPORT = [["S", "Specificity"], ["P", "Progression"], ["O", "Overload"], ["R", "Reversibility"], ["T", "Tedium"]];
const FIELDS = {
  warm: { label: "Warm-up", guide: "Checklist: each session should include a warm-up.", think: ["Pulse raiser (how long?)", "Mobility and dynamic stretches", "Event-specific drills to prepare for the main activity"], hint: (t) => ({ ok: words(t) >= 6 && has(t, /jog|pulse|mobility|dynamic|stretch|drill|activation|skip|warm|run|march|lunge/i), tips: ["Describe the pulse raiser, mobility work and drills with timings (at least 6 words)."] }) },
  main: { label: "Main activity(ies)", guide: "Checklist: drills and activities that practise appropriate techniques and mental well-being, with logical progression.", think: ["Which drills or exercises? Include sets, reps and rest", "Which technique problem does each one fix?", "Link to your physical goal"], hint: (t) => ({ ok: words(t) >= 10 && nums(t) >= 1 && has(t, /drill|exercise|set|rep|technique|plyo|interval|circuit|weight|run|jump|throw|squat|lunge|sprint/i), tips: ["Name the drills or exercises, add numbers (sets, reps, time) and say what they improve."] }) },
  pst: { label: "Psychological skills training", guide: "Checklist: each session should also include psychological skills training.", think: ["Which skill (breathing, imagery, self-talk, relaxation, mindfulness...)?", "Exactly how is it done, and for how long?", "How does it link to your health goal and social media or screen-time change?"], hint: (t) => ({ ok: words(t) >= 8 && has(t, /breath|imagery|visuali|self.?talk|relax|mindful|meditat|muscle|routine|focus|cue/i), tips: ["Name the skill and describe how it is done (at least 8 words)."] }) },
  cool: { label: "Cool-down", guide: "Checklist: each session should include a cool-down.", think: ["How do you bring heart rate down gradually?", "Static stretches for the muscles used (which ones, how long?)"], hint: (t) => ({ ok: words(t) >= 5 && has(t, /walk|jog|stretch|static|cool|breath|slow|foam|hold/i), tips: ["Describe how you reduce intensity and what you stretch (at least 5 words)."] }) },
  tool: { label: "Innovative tool to track performance", guide: "Checklist: use innovative tools to track performance (heart rate, duration, calories, stress levels, relaxation or meditation apps, diet tracker, sleep tracker).", hint: (t) => ({ ok: words(t) >= 4, tips: ["Name the tool and the data it records (at least 4 words)."] }) },
};
const PROG = (n) => n === 1
  ? { label: "Starting point", guide: "Explain your starting load and why it suits your client's baseline.", hint: (t) => ({ ok: words(t) >= 10 && has(t, /because|baseline|suit|start|initial|so that/i), tips: ["Explain why you chose this starting load (at least 10 words, include a reason)."] }) }
  : n <= 4
    ? { label: "Progression from the last session", guide: "Checklist: show logical progression using FITT and SPORT. What is different from last session, and why?", hint: (t) => ({ ok: words(t) >= 10 && has(t, /because|so that|increase|progress|change|add|more|less|longer|harder|gradual|overload/i), tips: ["Say what changed (FITT or SPORT) and why (at least 10 words)."] }) }
    : { label: "Adaptation after the interim results", guide: "Checklist: adaptations should be evident based on the interim results, with clear examples of changes made from sessions 1-4 to sessions 5-8.", hint: (t) => ({ ok: words(t) >= 12 && has(t, /change|adapt|instead|replac|increase|decrease|add|remov|swap|adjust|modif/i) && has(t, /because|result|interim|so that|due to/i), tips: ["Name a clear change from sessions 1-4 and give the reason from your interim results (at least 12 words)."] }) };
const INTERIM = [
  ["retest", "Re-test results", "Checklist: re-test the fitness tests and the athletic event halfway through the programme (after 4 sessions).", ["Initial, then interim result for each fitness test and the event", "Change from the initial result"], (t) => ({ ok: words(t) >= 8 && nums(t) >= 3, tips: ["Include the numbers for each re-test (at least 3 numbers)."] })],
  ["progress", "Progress towards your SMART goals", "Checklist: report on the progress towards the SMART goals.", ["Physical goal: how close is the client to the target?", "Health goal: what do the questionnaire or tracker data show?"], (t) => ({ ok: words(t) >= 15, tips: ["Report on both goals (at least 15 words)."] })],
  ["changes", "Changes needed to the training plan", "Checklist: what changes need to be made to the initial training plan?", ["Which parts of the plan will change (FITT and SPORT)?", "Why, using your interim results?"], (t) => ({ ok: words(t) >= 15 && has(t, /because|result|so that|due to/i), tips: ["Say what will change and why, with a reason (at least 15 words)."] })],
  ["goal", "Do you need to change a goal?", "Checklist: do you need to change your goal?", ["Yes or no, and the reason"], (t) => ({ ok: words(t) >= 8 && has(t, /yes|no|keep|change|adjust|same/i), tips: ["Answer yes or no and explain why (at least 8 words)."] })],
];

export function renderPlanner(el, ctx) {
  const store = ensure(ctx.state.tools, "planner", {});
  ensure(store, "sessions", Array.from({ length: 8 }, () => ({})));
  ensure(store, "interim", {});
  const sess = store.sessions;
  let active = 1; // 1-8, "i" interim, "s" summary
  const sessionDone = (n) => {
    const s = sess[n - 1];
    const f = (k) => FIELDS[k].hint(s[k] || "").ok && words(s[k]);
    return !!s.focus && f("warm") && f("main") && f("pst") && f("cool") && f("tool") && PROG(n).hint(s.prog || "").ok && words(s.prog)
      && ["F", "I", "T", "Ty"].every((k) => words(s.fitt && s.fitt[k])) && (s.sport || []).length >= 1;
  };
  const sessionTouched = (n) => { const s = sess[n - 1]; return !!(s.focus || s.warm || s.main || s.pst || s.cool || s.tool || s.prog || (s.sport || []).length || (s.fitt && Object.values(s.fitt).some(Boolean))); };
  const interimDone = () => INTERIM.every(([k, , , , hint]) => words(store.interim[k]) && hint(store.interim[k]).ok);
  const root = h("div", { class: "tl" });
  const tabs = h("div", { class: "tl-tabs", role: "tablist", "aria-label": "Sessions" });
  const panel = h("div", { class: "tl-panel", role: "tabpanel" });
  const buildTabs = () => {
    const mk = (id, label) => {
      const done = id === "i" ? interimDone() : id === "s" ? false : sessionDone(id);
      const touched = id === "i" ? Object.values(store.interim).some(Boolean) : id === "s" ? false : sessionTouched(id);
      const b = h("button", { type: "button", role: "tab", class: `tl-tab${done ? " done" : touched ? " part" : ""}`, "aria-selected": String(active === id), "data-id": id }, h("span", { "aria-hidden": "true" }, done ? "✓ " : ""), label);
      b.onclick = () => { active = id; show(); };
      return b;
    };
    tabs.replaceChildren(...[1, 2, 3, 4].map((n) => mk(n, `Session ${n}`)), mk("i", "Interim analysis"), ...[5, 6, 7, 8].map((n) => mk(n, `Session ${n}`)), mk("s", "Programme check"));
  };
  function sessionPanel(n) {
    const s = sess[n - 1];
    ensure(s, "fitt", {}); ensure(s, "sport", []);
    const box = h("div", {});
    const phase = n <= 4 ? "Sessions 1 to 4" : "Sessions 5 to 8 (adapted after the interim analysis)";
    box.append(h("h3", {}, `Session ${n}`), h("p", { class: "tl-lead" }, phase + ". Checklist: a structured plan based on the goals, covering both the health and the physical goals, with logical progression."));
    const focusId = uid("tl");
    const sel = h("select", { id: focusId, class: "tl-select" }, ...[["", "Choose..."], ["Physical goal", "Physical goal"], ["Health goal", "Health goal"], ["Both goals", "Both goals"]].map(([v, t]) => h("option", { value: v }, t)));
    sel.value = s.focus || "";
    sel.onchange = () => { s.focus = sel.value; ctx.save(); buildTabs(); };
    box.append(h("div", { class: "tl-field" }, h("label", { for: focusId }, "Which goal does this session focus on?"), h("p", { class: "tl-guide" }, "Checklist: both the health and the physical goals need to be planned for across your sessions."), sel));
    for (const k of ["warm", "main", "pst", "cool"]) {
      const f = FIELDS[k];
      box.append(area({ label: f.label, guide: f.guide, think: f.think, rows: 3, value: s[k], hint: (t) => { const r = f.hint(t); return { ok: r.ok, tips: r.ok ? [] : r.tips }; }, onInput: (v) => { s[k] = v; }, ctx }));
    }
    const fid = uid("tl");
    const fitt = h("div", { class: "tl-field" }, h("label", { for: fid + "F" }, "FITT for this session"), h("p", { class: "tl-guide" }, "Checklist: demonstrate logical progression using FITT and SPORT. Fill in all four."));
    const row = h("div", { class: "tl-fitt" });
    [["F", "Frequency", "e.g. 2 sessions a week"], ["I", "Intensity", "e.g. 70% of max heart rate"], ["T", "Time", "e.g. 40 minutes"], ["Ty", "Type", "e.g. plyometric circuit"]].forEach(([k, label, ph]) => {
      const inp = h("input", { id: fid + k, type: "text", class: "tl-in", placeholder: ph, "aria-label": label });
      inp.value = s.fitt[k] || "";
      inp.oninput = () => { s.fitt[k] = inp.value; saveSoon(ctx); buildTabs(); };
      row.append(h("label", { class: "tl-mini", for: fid + k }, label, inp));
    });
    fitt.append(row);
    box.append(fitt);
    const sp = h("div", { class: "tl-field" }, h("p", { class: "tl-lab" }, "Which SPORT principle(s) does this session apply?"), h("p", { class: "tl-guide" }, "Tick at least one, then explain it in the progression box below."));
    const spRow = h("div", { class: "tl-sport" });
    SPORT.forEach(([k, name]) => {
      const cb = h("input", { type: "checkbox" });
      cb.checked = s.sport.includes(k);
      cb.onchange = () => { s.sport = cb.checked ? [...new Set([...s.sport, k])] : s.sport.filter((x) => x !== k); ctx.save(); buildTabs(); };
      spRow.append(h("label", { class: "tl-chk" }, cb, h("span", {}, `${k}: ${name}`)));
    });
    sp.append(spRow);
    box.append(sp);
    const tl = FIELDS.tool;
    box.append(area({ label: tl.label, guide: tl.guide, rows: 2, value: s.tool, hint: (t) => { const r = tl.hint(t); return { ok: r.ok, tips: r.ok ? [] : r.tips }; }, onInput: (v) => { s.tool = v; }, ctx }));
    const pg = PROG(n);
    box.append(area({ label: pg.label, guide: pg.guide, rows: 3, value: s.prog, hint: (t) => { const r = pg.hint(t); return { ok: r.ok, tips: r.ok ? [] : r.tips }; }, onInput: (v) => { s.prog = v; }, ctx }));
    box.append(area({ label: "After the session: reflection summary (optional here, required in your task)", guide: "Checklist: reflect after each session on how your client is responding and how the coach-client relationship is developing. Post on Padlet, screenshot it, and summarise the client's reflection and voice-memo feedback.", think: ["What went well?", "What was difficult?", "What will you change next session?"], rows: 3, value: s.refl, hint: (t) => ({ ok: words(t) >= 10, tips: ["Summarise the client's reflection (at least 10 words)."] }), onInput: (v) => { s.refl = v; }, ctx }));
    return box;
  }
  function interimPanel() {
    const box = h("div", {}, h("h3", {}, "Interim performance analysis (after session 4)"), h("p", { class: "tl-lead" }, "Complete this before you plan sessions 5 to 8. Your results here decide what you adapt."));
    for (const [k, label, guide, think, hint] of INTERIM) box.append(area({ label, guide, think, rows: 3, value: store.interim[k], hint: (t) => { const r = hint(t); return { ok: r.ok, tips: r.ok ? [] : r.tips }; }, onInput: (v) => { store.interim[k] = v; }, ctx }));
    return box;
  }
  function summaryPanel() {
    const count = (fn, a, b) => { let c = 0; for (let n = a; n <= b; n++) if (fn(n)) c++; return c; };
    const s14 = count(sessionDone, 1, 4), s58 = count(sessionDone, 5, 8);
    const focus = new Set(sess.map((s) => s.focus).filter(Boolean));
    const both = focus.has("Both goals") || (focus.has("Physical goal") && focus.has("Health goal"));
    const pst = sess.filter((s) => words(s.pst) && FIELDS.pst.hint(s.pst).ok).length;
    const prog = sess.slice(1).filter((s, i) => words(s.prog) && PROG(i + 2).hint(s.prog).ok).length;
    const adapt = count((n) => words(sess[n - 1].prog) && PROG(n).hint(sess[n - 1].prog).ok, 5, 8);
    const refl = sess.filter((s) => words(s.refl) >= 10).length;
    const rows = [
      [s14 === 4, `Sessions 1 to 4 are fully planned (${s14} of 4)`],
      [interimDone(), "Interim analysis is complete (re-test, progress, changes, goal check)"],
      [s58 === 4, `Sessions 5 to 8 are fully planned (${s58} of 4)`],
      [adapt === 4, `Sessions 5 to 8 show clear adaptations because of your interim results (${adapt} of 4)`],
      [pst === 8, `Every session includes psychological skills training (${pst} of 8)`],
      [both, "Both the health goal and the physical goal are planned for"],
      [prog === 7, `Logical progression is explained from session 2 onwards (${prog} of 7)`],
      [refl === 8, `A reflection is summarised after every session (${refl} of 8)`],
    ];
    const done = rows.slice(0, 7).every((r) => r[0]);
    if (done && !store.done) { store.done = true; ctx.save(); ctx.onPlannerDone(); }
    const copy = h("button", { type: "button", class: "btn lime" }, "Copy my programme");
    const msg = h("span", { class: "tl-note", role: "status" });
    copy.onclick = async () => {
      const L = [];
      sess.forEach((s, i) => {
        L.push(`SESSION ${i + 1} (${s.focus || "focus not chosen"})`, `Warm-up: ${s.warm || ""}`, `Main activity: ${s.main || ""}`, `Psychological skills training: ${s.pst || ""}`, `Cool-down: ${s.cool || ""}`,
          `FITT: Frequency ${s.fitt?.F || ""}; Intensity ${s.fitt?.I || ""}; Time ${s.fitt?.T || ""}; Type ${s.fitt?.Ty || ""}`, `SPORT: ${(s.sport || []).join(", ")}`, `Innovative tool: ${s.tool || ""}`, `${PROG(i + 1).label}: ${s.prog || ""}`, `Reflection: ${s.refl || ""}`, "");
        if (i === 3) L.push("INTERIM ANALYSIS", ...INTERIM.map(([k, label]) => `${label}: ${store.interim[k] || ""}`), "");
      });
      msg.textContent = (await copyText(L.join("\n"))) ? "Copied. Paste it into your Task 2 template and change the layout to suit you." : "Could not copy.";
    };
    const clear = h("button", { type: "button", class: "btn ghost" }, "Clear the planner");
    clear.onclick = () => { if (confirm("Clear every session and the interim analysis? This cannot be undone.")) { store.sessions = Array.from({ length: 8 }, () => ({})); store.interim = {}; store.done = false; ctx.save(); renderPlanner(el, ctx); } };
    return h("div", {}, h("h3", {}, "Programme check"), h("p", { class: "tl-lead" }, "Your programme matches the Task 2 checklist when every line is ticked (reflections can be finished as you go)."),
      h("ul", { class: "tl-req" }, rows.map(([ok, t]) => h("li", { class: ok ? "done" : "" }, h("span", { "aria-hidden": "true" }, ok ? "✅" : "⬜"), h("span", {}, t)))),
      h("div", { class: "tl-actions" }, copy, clear, msg));
  }
  function show() {
    panel.replaceChildren(active === "i" ? interimPanel() : active === "s" ? summaryPanel() : sessionPanel(active));
    buildTabs();
  }
  root.addEventListener("tl-change", buildTabs);
  root.append(
    h("h2", {}, "Training session planner"),
    h("div", { class: "tl-callout" },
      h("p", {}, h("strong", {}, "What the Task 2 checklist asks for (Training programme)")),
      h("ul", {},
        h("li", {}, "Sessions 1 to 4: a structured plan based on your goals, for both the health and physical goals."),
        h("li", {}, "Every session: a warm-up, main activity(ies), a cool-down and psychological skills training."),
        h("li", {}, "Logical progression using FITT and SPORT, with drills that practise techniques and mental well-being."),
        h("li", {}, "Innovative tools to track performance."),
        h("li", {}, "After 4 sessions: re-test, report on progress towards your goals and decide on changes (interim analysis)."),
        h("li", {}, "Sessions 5 to 8: clear adaptations based on the interim results, with a reflection after every session.")),
      h("p", { class: "tl-note" }, "Write in your own words. The planner prompts you and checks you have included each part. It does not write your plan. Your work is saved on this device only.")),
    tabs, panel);
  el.replaceChildren(root);
  show();
}

// =====================================================================
// Rubric self-check
// =====================================================================
const drafts = {}; // pasted text stays in memory only, never saved or sent anywhere
const lastRun = {};
const CANT_CHECK = {
  1: ["Written work is 5 pages maximum, with all text 10pt or larger.", "Tables, graphs, screenshots and annotated images are included and legible.", "Unit words (global context, key concept, related concepts, statement of inquiry) are in bold or a different colour.", "A separate bibliography is submitted using Harvard referencing."],
  2: ["Written work is 5 pages maximum in font size 10 to 12.", "Photos or video links of your client are included.", "Unit words are in bold and italics where they link to the concepts and contexts.", "Screenshots of Padlet reflections and innovative apps are included.", "You used the Task 2 template, changing the layout to suit you."],
  3: ["The video is 3 minutes or less, in MP4 format, with no music.", "The video is annotated with audio and has title slides for each section.", "You show the performance from several camera angles, at full speed and in slow motion.", "Your performance itself shows complex skills and sophisticated technique."],
  4: ["Written work is 5 pages maximum, in paragraphs under sub-headings.", "Key concept, related concepts, global context and statement of inquiry are in bold.", "Tables and screenshots comparing initial, interim and final performance are included.", "Harvard referencing and a bibliography are included."],
};
const DEPTH_TEXT = {
  reasoning: ["Mostly describing. Add reasons so the reader sees why: because, this means, as a result.", "Some reasons are given. Add more wherever you state a result, a choice or a judgement.", "You explain reasons often. Keep checking that each judgement has a reason."],
  evaluating: ["Little weighing up. Compare strengths and limitations and use words like however, although and compared with.", "Some weighing up. Do it for your main findings, not just a few.", "You weigh things up well."],
  terminology: ["Few PHE terms. Replace everyday words with the correct terms (for example flexion, antagonist, overload, arousal).", "Some PHE terms. Use them more consistently, especially in analysis.", "You use PHE terminology often."],
};
const DEPTH_HOW = {
  reasoning: ["Pick three results or choices you describe.", "After each one add a because, this means or as a result, and finish the thought.", "Check the reason links to evidence (a number, a theory or a principle of training)."],
  evaluating: ["Choose your two most important findings.", "For each, state a strength and a limitation, or compare it with something (a baseline, normative data, a model performer).", "End with a judgement: how much does it matter, and why?"],
  terminology: ["Underline everyday phrases like bend, straighten, tired or fast in your draft.", "Look up the PHE term in your lessons and swap it in.", "Use each term correctly and explain it the first time."],
};

export function renderSelfCheck(el, taskNumber, ctx) {
  const info = SELF_CHECK_TASKS[taskNumber];
  const ta = h("textarea", { class: "tl-ta tl-big", rows: "12", id: "sc-" + taskNumber, "aria-label": "Paste your work here", placeholder: taskNumber === 3 ? "Paste your video script or voice-over notes here..." : "Paste your writing here (one section or the whole task)..." });
  ta.value = drafts[taskNumber] || "";
  const count = h("span", { class: "tl-count" });
  const out = h("div", { class: "tl-out", "aria-live": "polite" });
  const upd = () => { drafts[taskNumber] = ta.value; count.textContent = `${words(ta.value)} words`; };
  ta.addEventListener("input", upd);
  const go = h("button", { type: "button", class: "btn lime" }, "Check my work");
  const clr = h("button", { type: "button", class: "btn ghost" }, "Clear");
  clr.onclick = () => { ta.value = ""; upd(); out.replaceChildren(); };
  go.onclick = () => {
    const text = ta.value.trim();
    out.replaceChildren();
    if (words(text) < 40) { out.append(h("p", { class: "tl-warnbox" }, "Paste at least a paragraph or two (about 80 words or more) so there is enough to check.")); return; }
    const r = runSelfCheck(taskNumber, text);
    ctx.onSelfCheck(taskNumber);
    out.append(resultView(r, lastRun[taskNumber]));
    lastRun[taskNumber] = { cov: r.coverage, band: r.bandName };
    out.firstChild.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  el.replaceChildren(h("div", { class: "tl" },
    h("h2", {}, `Self-check against the rubric: ${info.criterion}`),
    h("div", { class: "tl-callout" },
      h("p", {}, h("strong", {}, "How it works")),
      h("ol", {},
        h("li", {}, taskNumber === 3 ? "Paste your video script or voice-over notes into the box." : "Paste a section of your draft, or the whole task, into the box."),
        h("li", {}, "Press Check my work. You get an estimate of the rubric band, your strengths, and what to improve with steps for how to do it."),
        h("li", {}, "Improve your work in your own document, then paste it again to see what changed.")),
      h("p", { class: "tl-note" }, "This tool never writes or rewrites your work. It looks for key words and ideas, so it can miss a good point written differently, and it is only an estimate. Your teacher marks your real work. What you paste stays in this browser tab: it is not saved or sent anywhere."),
      info.note ? h("p", { class: "tl-note" }, info.note) : false),
    h("label", { for: "sc-" + taskNumber, class: "tl-lab" }, "Your work"), ta, h("div", { class: "tl-meta" }, h("span", {}), count),
    h("div", { class: "tl-actions" }, go, clr), out));
  upd();
}

function resultView(r, prev) {
  const box = h("div", { class: "tl-result" });
  const strong = r.results.filter((x) => x.level === 2);
  const partial = r.results.filter((x) => x.level === 1);
  const missing = r.results.filter((x) => x.level === 0);
  const pct = Math.round(r.coverage * 100);
  const bandLabel = r.bandName.replace("-", " to ");
  box.append(h("div", { class: "tl-sum" },
    h("div", { class: "tl-band" }, h("small", {}, "Estimated rubric band"), h("strong", {}, bandLabel), h("span", {}, "out of 8")),
    h("div", { class: "tl-sumtext" },
      h("p", {}, h("strong", {}, `${r.criterion}.`), ` Based on ${r.stats.words} words, you covered ${strong.length} of ${r.results.length} checklist areas fully and ${partial.length} partly (${pct}%).`),
      prev ? h("p", { class: "tl-prev" }, `Last check: ${prev.band.replace("-", " to ")} (${Math.round(prev.cov * 100)}% coverage). Now: ${bandLabel} (${pct}%).`) : false,
      h("p", { class: "tl-note" }, "This is an estimate from the words found, not your mark."))));
  if (r.short) box.append(h("p", { class: "tl-warnbox" }, `You have pasted ${r.stats.words} words. A full submission is usually longer (about ${r.minWords}+ words), so areas you have not pasted will show as missing. Paste more of your work for a complete check.`));
  // depth
  const lvl = ["Developing", "Good", "Strong"];
  box.append(h("h3", {}, "How deeply you are writing"),
    h("div", { class: "tl-depth" }, [["reasoning", "Explaining why"], ["evaluating", "Weighing up and evaluating"], ["terminology", `PHE terminology (${r.stats.terms} different terms)`]].map(([k, t]) =>
      h("div", { class: `tl-d d${r.depth[k]}` }, h("strong", {}, t), h("span", { class: "tl-chip" }, lvl[r.depth[k]]), h("p", {}, DEPTH_TEXT[k][r.depth[k]])))));
  // strengths
  box.append(h("h3", {}, "What is working well"));
  if (strong.length) box.append(h("ul", { class: "tl-list good" }, strong.map((x) => h("li", {}, h("strong", {}, x.check.label + ". "), x.check.ok, x.found && x.found.length ? h("span", { class: "tl-found" }, ` Found: ${x.found.slice(0, 5).join(", ")}.`) : false))));
  else box.append(h("p", {}, "Nothing is fully covered yet. Start with the first improvement below."));
  const depthGaps = ["reasoning", "evaluating", "terminology"].filter((k) => r.depth[k] < 2 && !r.tooShort);
  // improvements
  box.append(h("h3", {}, "What to improve and how"));
  const card = (x, status) => h("details", { class: `tl-imp ${status}`, open: status === "missing" ? true : false },
    h("summary", {}, h("span", { class: `tl-chip ${status === "missing" ? "warn" : "mid"}` }, status === "missing" ? "Missing" : "Partly there"), h("strong", {}, x.check.label), h("small", {}, x.check.area)),
    h("p", {}, h("strong", {}, "What I noticed: "), status === "partial" && x.found && x.found.length ? `You mention ${x.found.slice(0, 4).join(", ")}, but ${x.check.what.charAt(0).toLowerCase() + x.check.what.slice(1)}` : x.check.what),
    h("p", {}, h("strong", {}, "Why it matters: "), `This is part of the checklist (${x.check.ref}) and the ${r.criterion} rubric.`),
    h("p", {}, h("strong", {}, "How to improve it:")), h("ol", {}, x.check.how.map((s) => h("li", {}, s))));
  const gaps = [...missing.map((x) => card(x, "missing")), ...partial.map((x) => card(x, "partial"))];
  if (gaps.length) box.append(...gaps); else box.append(h("p", {}, "Every checklist area is covered. Now focus on depth below."));
  if (depthGaps.length) box.append(...depthGaps.map((k) => h("details", { class: "tl-imp partial" },
    h("summary", {}, h("span", { class: "tl-chip mid" }, "Depth"), h("strong", {}, { reasoning: "Explaining why", evaluating: "Weighing up and evaluating", terminology: "PHE terminology" }[k]), h("small", {}, "Moves your work up the rubric bands")),
    h("p", {}, DEPTH_TEXT[k][r.depth[k]]), h("p", {}, h("strong", {}, "How to improve it:")), h("ol", {}, DEPTH_HOW[k].map((s) => h("li", {}, s))))));
  // next band
  box.append(h("h3", {}, "To reach the next band"), h("p", { class: "tl-next" }, r.next + (r.capped ? " Your coverage is strong, but explaining reasons and using PHE terms consistently will lift your estimate to the top band." : "")));
  box.append(h("h3", {}, "Things this tool cannot check"), h("p", {}, "Check these yourself before you submit:"), h("ul", {}, (CANT_CHECK[r.task] || []).map((t) => h("li", {}, t))));
  return box;
}
