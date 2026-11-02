// Rubric self-check engine. It looks for evidence of what each task checklist and rubric ask for,
// then gives feedback: what is working, what is missing, and how to improve it. It never rewrites the student's work.
// It works by finding key words, so it is a prompt to re-read your work, not a mark.

const termRx = (t) => new RegExp("(?:^|[^a-z0-9])(?:" + t + ")", "i");
const label = (t) => t.split("|")[0].replace(/\\b|\\\\|\(\?:|[()?]|\.\?/g, " ").replace(/\\/g, "").replace(/\s+/g, " ").trim();

// distinct terms found (each term is a regex fragment)
export function findTerms(text, terms) {
  return terms.filter((t) => termRx(t).test(text)).map(label);
}

const PHE_TERMS = ["flexion", "extension", "plantar", "dorsiflexion", "abduction", "adduction", "rotation", "quadriceps", "hamstring", "gastrocnemius", "gluteal", "hip flexor", "deltoid", "biceps", "triceps", "abdominal", "agonist", "antagonist", "concentric", "eccentric", "isometric", "fast twitch", "slow twitch", "aerobic", "anaerobic", "vo2", "cardiovascular", "endurance", "power", "agility", "coordination", "flexibility", "strength", "balance", "reaction time", "body composition", "fitt", "overload", "progressi", "specificity", "reversibility", "tedium", "plyometric", "interval", "circuit", "fartlek", "warm.?up", "cool.?down", "heart rate", "karvonen", "arousal", "anxiety", "somatic", "cognitive", "inverted.?u", "motivation", "intrinsic", "extrinsic", "self.?talk", "imagery", "visuali", "mindfulness", "relaxation", "smart", "baseline", "normative", "bmi", "bmr", "macronutrient", "carbohydrate", "protein", "hydration", "recovery", "over.?training", "centre of mass|center of mass", "angular", "momentum", "kinetic", "joint", "range of movement", "muscle fibre|muscle fiber", "technique", "biomechanic", "stride", "tendon", "ligament", "cartilage", "skeletal"];

const REASONING = /\b(because|therefore|as a result|this means|which means|so that|due to|leads? to|led to|resulting in|results in|this shows|this suggests|this indicates|this is why|in order to|consequently)\b/gi;
const EVALUATIVE = /\b(however|although|whereas|on the other hand|limitation|limited|strength|weakness|justif|evaluat|most effective|less effective|compared (?:to|with)|in contrast|despite|unlike|but)\b/gi;
const CITE = /\([^()]*?\b(?:19|20)\d{2}[a-z]?\)|\[\d+\]/g;

export function textStats(text) {
  const words = (text.match(/\S+/g) || []).length;
  const per100 = (n) => (words ? (n / words) * 100 : 0);
  const reasoning = (text.match(REASONING) || []).length;
  const evaluative = (text.match(EVALUATIVE) || []).length;
  return {
    words,
    numbers: (text.match(/\d+(?:\.\d+)?/g) || []).length,
    cites: (text.match(CITE) || []).length,
    biblio: /bibliograph|reference list|references\b/i.test(text),
    reasoning, evaluative, terms: findTerms(text, PHE_TERMS).length,
    reasoningRate: per100(reasoning),
    evaluativeRate: per100(evaluative),
  };
}

// depth levels 0 to 2 (needs enough writing to judge)
export function depth(s) {
  if (s.words < 150) return { reasoning: 0, evaluating: 0, terminology: 0 };
  return {
    reasoning: s.reasoningRate >= 0.35 ? 2 : s.reasoningRate >= 0.15 ? 1 : 0,
    evaluating: s.evaluativeRate >= 0.8 ? 2 : s.evaluativeRate >= 0.3 ? 1 : 0,
    terminology: s.terms >= 14 ? 2 : s.terms >= 6 ? 1 : 0,
  };
}

// ----- check builders -----
// distinct-term check: full when `min` different terms are found, partial when at least one is
const T = (id, area, ref, label, terms, min, ok, what, how) => ({ id, area, ref, label, terms, min, ok, what, how });
// custom check: fn(text, stats) returns { level: 0|1|2, found: [] }
const F = (id, area, ref, label, fn, ok, what, how) => ({ id, area, ref, label, fn, ok, what, how });
const both = (text, a, b) => termRx(a).test(text) && termRx(b).test(text);
const cites = (text, s) => ({ level: s.cites >= 3 ? 2 : s.cites >= 1 ? 1 : 0, found: s.cites ? [`${s.cites} in-text citation${s.cites === 1 ? "" : "s"}`] : [] });
const CITE_CHECK = F("cite", "Citation", "Citation section", "Harvard referencing", cites,
  "You place citations next to the information you have researched.",
  "There is little or no sign of Harvard in-text citations like (Author, 2024).",
  ["Find each fact, statistic or idea you took from a book, website or AI tool.", "Put a citation next to it in this style: (Author, year).", "Add a bibliography as the task asks, and make sure every citation appears in it."]);

// ----- Task 1: one check per item on the Task 1 checklist template -----
const lvl = (c) => (c.every(Boolean) ? 2 : c.some(Boolean) ? 1 : 0);
const hit = (t, rx) => rx.test(t);
const CITED = /\(\s*[A-Za-z][^()]*?(?:19|20)\d{2}[a-z]?\s*\)/;
const CONCEPTS = [
  ["Global context: Fairness and development", "global context", "fairness and development"],
  ["Key concept: Relationships", "key concept", "relationships"],
  ["Related concept: Environment", "related concept", "environment"],
];
// the part of the text that talks about one unit concept (up to the next concept or 1,500 characters)
function conceptScope(text, phrase) {
  const start = text.search(new RegExp(phrase, "i"));
  if (start < 0) return "";
  const others = ["global context", "key concept", "related concept", "statement of inquiry"].filter((x) => x !== phrase);
  let end = Math.min(text.length, start + 1500);
  for (const o of others) { const i = text.slice(start + phrase.length).search(new RegExp(o, "i")); if (i >= 0) end = Math.min(end, start + phrase.length + i); }
  return text.slice(start, end);
}
const SEC = {
  concept: "Conceptual understanding",
  profile: "Health analysis: Client profile, interview and PAR-Q",
  measures: "Health analysis: Measurements of health and well-being",
  theory: "Health analysis: Links to theory",
  overall: "Health analysis: Overall health",
  sport: "Physical analysis: Chosen sport",
  fitness: "Physical analysis: Fitness analysis",
  technique: "Physical analysis: Technique analysis",
  next: "Relevant solutions and next steps",
  submit: "Before you submit",
};
// item(id, section, checklist wording, test(text, stats) => 0|1|2, steps for how to improve)
const item = (id, section, label, test, how) => ({ id, area: section, ref: section, label, fn: (t, s) => ({ level: test(t, s), found: [] }), ok: `This is covered: ${label}.`, what: `I could not find clear evidence of this: ${label}.`, how });
function conceptItems(scoped) {
  const scopeOf = (phrase) => (t) => (scoped ? conceptScope(t, phrase) : t);
  const soiScope = scopeOf("statement of inquiry");
  return [
  ...CONCEPTS.flatMap(([name, phrase]) => {
    const sc = scopeOf(phrase);
    const short = name.split(":")[0];
    return [
      item(`c-${phrase}-def`, SEC.concept, `${name}: defined in your own words, with a source`, (t) => { const x = sc(t); return !x ? 0 : lvl([hit(x, /\b(is|means|refers to|defined as|can be defined|involves)\b/i), hit(x, CITED)]); },
        [`Write the ${short.toLowerCase()} out by name and say what it means in your own words.`, "Add a source next to it using Harvard in-text style, for example (Author, year)."]),
      item(`c-${phrase}-apply`, SEC.concept, `${name}: applied to your client and their athletics event`, (t) => { const x = sc(t); return !x ? 0 : lvl([hit(x, /\b(client|athlete)\b/i), hit(x, /\b(event|athletics|sprint|jump|throw|race|hurdle|relay|running|run)\b/i)]); },
        [`Say how the ${short.toLowerCase()} shows up in your client's athletics event.`, "Name your client and the event in the same paragraph so the link is clear."]),
      item(`c-${phrase}-coach`, SEC.concept, `${name}: how it shapes your coaching focus`, (t) => { const x = sc(t); return !x ? 0 : lvl([hit(x, /\bcoach/i), hit(x, /\b(focus|shape|shapes|priorit|will|plan|because|so that)\b/i)]); },
        ["Finish with the 'so what': say what you will focus on as the coach because of this idea.", "Use the word because to join the idea to your coaching decision."]),
    ].map((c) => ({ ...c, scope: scoped ? sc : undefined }));
  }),
  ...[
    item("soi-client", SEC.concept, "Statement of inquiry: explains the statement for your client and event", (t) => { const x = soiScope(t); return !x ? 0 : lvl([hit(x, /\bclient\b/i), hit(x, /\b(event|athletics)\b/i)]); },
    ["Copy the statement of inquiry into your work, then explain it in your own words for your client and their event."]),
  item("soi-together", SEC.concept, "Statement of inquiry: pulls the three concepts together", (t) => { const x = soiScope(t); if (!x) return 0; const n = [/fair/i, /relationship/i, /environment/i].filter((r) => r.test(x)).length; return n >= 3 ? 2 : n >= 2 ? 1 : 0; },
    ["Show how fairness and development, relationships and environment connect to each other in one paragraph.", "Say which one matters most for your client and why."]),
  item("soi-coach", SEC.concept, "Statement of inquiry: says what this means for your coaching and client", (t) => { const x = soiScope(t); return !x ? 0 : lvl([hit(x, /\bcoach/i), hit(x, /\bclient\b/i)]); },
    ["End the section by saying what this means for how you will coach and for what your client will gain."])
  ].map((c) => ({ ...c, scope: scoped ? soiScope : undefined })),
  ];
}

const TASK1_CHECKS = [
  ...conceptItems(true),

  item("p-interview", SEC.profile, "Summary of interview answers about health, well-being and fitness", (t) => lvl([hit(t, /interview/i), hit(t, /\b(said|told|reported|stated|explained|answered|answers?|responses?)\b/i)]),
    ["Summarise what your client told you in the interview about health, well-being and fitness.", "Do not paste the whole interview. Pick the answers that matter and say why."]),
  item("p-parq", SEC.profile, "Summary of PAR-Q responses and what it showed", (t) => lvl([hit(t, /par.?q/i), hit(t, /\b(showed|shows|indicated|responses?|answered|no risk|cleared|safe)\b/i)]),
    ["Say that you completed the PAR-Q.", "Explain what it showed about whether your client is ready to train."]),
  item("p-body", SEC.profile, "Age, height, weight and BMI", (t) => { const n = [/\bage\b|years?[ -]old|aged/i, /height|\btall\b|\d\s?cm\b/i, /weigh|\d\s?kg\b/i, /\bbmi\b/i].filter((r) => r.test(t)).length; return n >= 4 ? 2 : n >= 2 ? 1 : 0; },
    ["Give your client's age, height, weight and BMI with units.", "Say what the BMI tells you, and what it does not."]),
  item("p-injury", SEC.profile, "Previous injury, illness or recent surgery", (t) => (hit(t, /injur|illness|surgery|medical history|no previous|operation/i) ? 2 : 0),
    ["State any previous injury, illness or recent surgery, or say clearly that there is none.", "Explain whether it affects their training."]),
  item("p-diet", SEC.profile, "Diet, calorie and water intake", (t) => { const n = [/diet|meal|nutrition|eat/i, /calorie|kcal/i, /water|hydrat|fluid/i].filter((r) => r.test(t)).length; return n >= 3 ? 2 : n >= 1 ? 1 : 0; },
    ["Describe your client's usual diet, daily calorie intake and water intake.", "Say how these compare with what an athlete in their event needs."]),
  item("p-sleep", SEC.profile, "Sleep and recovery days", (t) => lvl([hit(t, /sleep/i), hit(t, /recover|rest day/i)]),
    ["Give their average hours of sleep and how many recovery or rest days they have each week.", "Explain what this means for their training."]),
  item("p-activity", SEC.profile, "Activity level and steps per day", (t) => lvl([hit(t, /steps?\b/i), hit(t, /activity level|active|exercise|training (?:per|a) week|sessions? (?:per|a) week/i)]),
    ["State their usual activity level and the average steps per day.", "Say how this fits with their training."]),

  item("m-test", SEC.measures, "Each test named, with why you chose it", (t) => lvl([hit(t, /acsi|csai|who.?5|well.?being (?:index|scale)|smuis|bsmas|questionnaire|survey|inventory|scale|interview|observation/i), hit(t, /\b(because|chose|chosen|purpose|used to|in order to|to measure)\b/i)]),
    ["Name each test, survey or scale you used (for example a questionnaire, interview or observation).", "Say why you chose it, using because."]),
  item("m-scale", SEC.measures, "The scoring scale or mark scheme", (t) => lvl([hit(t, /\bscor(?:e|ed|es|ing)\b|mark scheme|\bscale\b/i), hit(t, /\d+\s*(?:-|–|to)\s*\d+|out of \d+/i)]),
    ["Give the scoring scale for each test, for example the range of scores and what each range means."]),
  item("m-meaning", SEC.measures, "What the results mean for your client", (t) => lvl([hit(t, /\bresults?\b|\bscore/i), hit(t, /\b(this (?:shows|suggests|means|indicates)|which means|suggests|indicates|means that)\b/i), hit(t, /\bclient\b/i)]),
    ["After each result, add a sentence starting 'This shows...' or 'This means...' that links it to your client."]),
  item("t-named", SEC.theory, "Theory named correctly (for example the Inverted U, motivation, anxiety, arousal, confidence, stress)", (t) => { const n = findTerms(t, ["inverted.?u", "motivation", "anxiety", "arousal", "confidence", "stress", "self.?efficacy", "intrinsic", "extrinsic", "somatic", "cognitive"]).length; return n >= 3 ? 2 : n >= 1 ? 1 : 0; },
    ["Name the theories you are using from your lessons and research, for example the Inverted U, motivation, anxiety, arousal, confidence or stress.", "Explain each one briefly in your own words."]),
  item("t-nutrition", SEC.theory, "Nutrition, sleep and recovery explained", (t) => { const n = [/nutri|protein|carbohydrate|diet/i, /sleep/i, /recover/i].filter((r) => r.test(t)).length; return n >= 3 ? 2 : n >= 1 ? 1 : 0; },
    ["Explain how nutrition, sleep and recovery each affect your client's performance, using what you learned in lessons."]),
  item("t-linked", SEC.theory, "Theory linked to your client's results", (t) => lvl([hit(t, /inverted.?u|motivation|anxiety|arousal|confidence|stress/i), hit(t, /\bclient\b/i), hit(t, /\b(result|score|shows?|suggests?)\b/i)]),
    ["Choose two findings and link each to a theory: finding, then theory, then what it means for your client."]),
  item("o-sw", SEC.overall, "Strengths and weaknesses in health and well-being", (t) => lvl([hit(t, /strength/i), hit(t, /weakness|limitation/i)]),
    ["State at least two strengths and two weaknesses in your client's health and well-being, with evidence for each."]),
  item("o-relate", SEC.overall, "How health relates to physical performance", (t) => lvl([hit(t, /health|well.?being/i), hit(t, /\b(affect|impact|influence|limit|improve|relate)\w*\b/i), hit(t, /performance/i)]),
    ["Evaluate how each health point could help or limit your client's performance in their event."]),

  item("s-event", SEC.sport, "What the event involves (technique, phases and strategies)", (t) => { const n = findTerms(t, ["phase", "stage", "approach", "take.?off", "flight", "landing", "start", "drive", "release", "technique", "strateg"]).length; return n >= 4 ? 2 : n >= 2 ? 1 : 0; },
    ["Explain what the event involves and break it into phases or stages.", "Describe the technique and the strategies used in each phase."]),
  item("s-records", SEC.sport, "World records (factual information)", (t) => lvl([hit(t, /world record|record holder|national record|school record/i), hit(t, /\d/)]),
    ["Add the world record for your client's event as a fact, with the number and a source."]),
  item("f-trials", SEC.fitness, "3 trials for each test and the average of each fitness test", (t) => lvl([hit(t, /trial\s*1|trial\s*2|trial\s*3|3 trials|three trials/i), hit(t, /average|mean/i)]),
    ["Record 3 trials for every fitness test and calculate each average, in the fitness table."]),
  item("f-event", SEC.fitness, "3 trials for each test and the average of their athletic event initial performance", (t) => lvl([hit(t, /initial|baseline/i), hit(t, /performance|event/i), hit(t, /trial|average|mean/i)]),
    ["Add 3 trials and the average for your client's initial performance in the event itself."]),
  item("f-meaning", SEC.fitness, "What the results show about your client's current level and what needs improved", (t) => lvl([hit(t, /current level|currently/i), hit(t, /need\w* (?:to )?improv|improve|weak|develop/i)]),
    ["Say what the results show about your client's current level.", "Name what needs to be improved and which result shows it."]),
  item("te-position", SEC.technique, "Body position", (t) => (hit(t, /body position|posture|lean|alignment|body angle/i) ? 2 : 0),
    ["Describe your client's body position in each phase and compare it with the perfect model."]),
  item("te-angles", SEC.technique, "Angles of joints (knee, hip, shoulder, elbow, ankle)", (t) => { const n = findTerms(t, ["knee", "hip", "shoulder", "elbow", "ankle"]).length; return hit(t, /angle/i) && n >= 2 ? 2 : hit(t, /angle/i) || n >= 1 ? 1 : 0; },
    ["Measure and state the joint angles (knee, hip, shoulder, elbow, ankle) for each phase, in degrees.", "Compare them with the perfect model."]),
  item("te-flight", SEC.technique, "Release angle (throwing), flight (jumping or throwing), stride length and number (running)", (t) => (hit(t, /release angle|flight|stride length|stride number|stride|trajectory/i) ? 2 : 0),
    ["Include the measure that fits your event: release angle (throwing), flight (jumping or throwing) or stride length and number (running)."]),
  item("te-speed", SEC.technique, "Speed/time and baseline score (for example time, distance or height)", (t) => lvl([hit(t, /baseline|initial|speed|time|distance|height/i), hit(t, /\d+(?:\.\d+)?\s*(?:m|cm|s|sec|seconds|m\/s)\b/i)]),
    ["State your client's baseline score for the event with units (time, distance or height).", "Add the speed or time if your event uses it."]),
  item("te-principles", SEC.technique, "Principles such as balance, force, power, flow, fluency and coordination", (t) => { const n = findTerms(t, ["balance", "force", "power", "flow", "fluency", "coordination"]).length; return n >= 3 ? 2 : n >= 1 ? 1 : 0; },
    ["Apply principles such as balance, force, power, flow, fluency and coordination to each phase and explain how well your client uses them."]),
  item("te-screens", SEC.technique, "Strengths and weaknesses explained next to each screenshot", (t) => lvl([hit(t, /strength/i), hit(t, /weakness/i), hit(t, /screenshot|figure|image|photo|picture/i)]),
    ["Next to each screenshot, explain one strength and one weakness you can see.", "Compare with the perfect model in the same phase."]),
  item("te-model", SEC.technique, "Screenshots of your client and a 'perfect model' compared for each phase", (t) => lvl([hit(t, /perfect model|olympic|world champion|elite|professional/i), hit(t, /compar|differ|whereas|unlike|in contrast/i)]),
    ["Choose an elite performer (for example an Olympian or world champion) and compare matching phases side by side."]),
  item("te-app", SEC.technique, "Lines or angles drawn with an app (for example Kinovea, Hudl or Coach's Eye)", (t) => (hit(t, /kinovea|hudl|coach.?s eye|kinemaster|annotat|drew|drawn|app\b/i) ? 2 : 0),
    ["Draw lines and angles on your screenshots with an app such as Kinovea, Hudl or Coach's Eye, and name the app."]),
  item("te-terms", SEC.technique, "PHE terminology (for example muscle names, flexion, extension)", (t, s) => (s.terms >= 8 ? 2 : s.terms >= 3 ? 1 : 0),
    ["Swap everyday words for PHE terms: for example flexion, extension, quadriceps, hamstrings, balance, force.", "Use each term correctly and explain it the first time."]),

  item("n-areas", SEC.next, "Specific areas/phases/components/skills/wellbeing elements that need improved, backed up by your results", (t) => lvl([hit(t, /need\w* (?:to )?(?:improv|work|develop)|improve|develop|weak/i), hit(t, /phase|component|skill|well.?being|technique/i), hit(t, /\d/)]),
    ["List the specific phases, components, skills or well-being elements that need to improve.", "Back each one with a result from your tables."]),
  item("n-links", SEC.next, "Link to relationships, environment, development and communication", (t) => { const n = findTerms(t, ["relationship", "environment", "development|develop", "communicat"]).length; return n >= 4 ? 2 : n >= 2 ? 1 : 0; },
    ["Explain how the coach-client relationship, the environment and communication will affect your client's performance and lead to development."]),
  item("n-help", SEC.next, "Explain how you will help your client improve and reach their goals (name specific training methods and exercises)", (t) => { const n = findTerms(t, ["interval", "circuit", "plyometric", "weights|resistance", "fartlek", "drill", "exercise", "training method", "squat|lunge|sprint"]).length; return n >= 3 ? 2 : n >= 1 ? 1 : 0; },
    ["Name the specific training methods and exercises you will use.", "Link each one to something that needs to improve."]),
  item("n-why", SEC.next, "How these will lead to improvement and why these solutions suit your client", (t) => lvl([hit(t, /\b(will lead|lead to|improve|so that|result in)\b/i), hit(t, /\b(suit|suits|because|appropriate|best for)\b/i), hit(t, /\bclient\b/i)]),
    ["For each solution say how it will lead to improvement.", "Say why it suits your client, using because."]),
  item("n-observe", SEC.next, "How you will observe progress (for example video analysis, questionnaires, feedback meetings, regular re-testing)", (t) => { const n = findTerms(t, ["video analysis", "questionnaire", "feedback", "meeting", "re.?test", "observ"]).length; return n >= 2 ? 2 : n >= 1 ? 1 : 0; },
    ["Say how you will observe progress, for example video analysis, questionnaires, feedback meetings and regular re-testing."]),

  item("cite", SEC.submit, "Referenced sources, and Harvard citations next to the work they support", (t, s) => (s.cites >= 4 ? 2 : s.cites >= 1 ? 1 : 0),
    ["Find each fact, statistic or idea you took from a book, website or AI tool.", "Put an in-text citation next to it, for example (Author, year), and keep the full source for your final bibliography."]),
  item("sub-terms", SEC.submit, "Words linking to the unit concepts, global context and statement of inquiry", (t) => { const n = ["global context", "key concept", "related concept", "statement of inquiry"].filter((p) => new RegExp(p, "i").test(t)).length; return n >= 4 ? 2 : n >= 2 ? 1 : 0; },
    ["Use the words key concept, related concept, global context and statement of inquiry when you link back to them throughout your work."]),
  item("sub-detail", SEC.submit, "Information is detailed and in paragraph form", (t, s) => (s.words >= 600 ? 2 : s.words >= 250 ? 1 : 0),
    ["Explain each point in full sentences and paragraphs rather than lists or short notes.", "Give the reason for each point, using because."]),
  item("sub-prompts", SEC.submit, "All grey prompts and tick-lists are deleted", (t) => (hit(t, /use the same four steps for each concept|introduce your client and explain what the interview|say what you used \(for example surveys|show your client's results for each test in the table|record and analyse your client's initial performance technique|say what your client needs to work on and explain the solutions|☐/i) ? 0 : 2),
    ["I found template prompt wording or tick boxes in the text you pasted. Delete all the grey prompts and tick-lists before you submit."]),
];

// What the Task 1 student example does for each checklist item (shown as "In the student example").
// The example was written for a previous unit theme, so these lines describe how it is written, not what it says.
const TASK1_EX = {
  "c-def": "Each concept opens with what the idea means in sport, then backs it up with cited research, for example a named study with its sample size or a percentage.",
  "c-apply": "Each concept is applied to athletes and their training world (coaches, teammates, facilities, online platforms) with examples. Go one step further than the example and name your client and event.",
  "soi-client": "The statement of inquiry is written out, then explained in detail with examples and a cited source.",
  "p-interview": "The example summarises what the client reported about her routine, diet and screen time instead of pasting the interview, and picks out the answers that matter.",
  "p-body": "Age, height, weight and BMI are given with units, weight is compared with the average for her age (with a source), and the BMI classification is explained.",
  "p-injury": "A history of leg cramps is noted, and the example says how it will change the training plan.",
  "p-diet": "Daily calories and water intake are given, and the example explains what each means for energy and hydration.",
  "p-sleep": "Average sleep is taken from a wearable app, compared with the recommended amount for her age (with a source), and linked to muscle repair.",
  "p-activity": "Average daily steps and training sessions per week are given, and the steps are compared with the recommended amount.",
  "m-test": "Each test is set out in a table with its relevance (why it was used), the mark scheme, the client's result and an analysis.",
  "m-scale": "The mark scheme column gives the score ranges for low, moderate and high.",
  "m-meaning": "The analysis column says what the score means for the athlete in competition and what the coach will do about it.",
  "s-event": "The example gives the event's history, then breaks it into four phases (approach, take-off, flight, landing), explaining the technique in each with sources.",
  "s-records": "The women's world record is stated as a fact with the date, the result and a source.",
  "f-trials": "The fitness table shows three results for every test, the average, the purpose of the test and a normative score.",
  "f-meaning": "The analysis column compares each average with a normative range and says whether the client is at an excellent, good or average level.",
  "te-angles": "The analysis names joint angles in degrees and compares them, for example a knee angle of 148 degrees for the client against 155 degrees for the professional.",
  "te-screens": "In every phase, the analysis explains what the professional does well, what the client does differently, and what effect that has on performance.",
  "te-model": "A table compares the client with a professional high jumper in each phase, with pictures of both and an analysis.",
  "te-app": "The example names the app used to measure the angles and says what it let the coach do.",
  "te-terms": "The analysis uses PHE terms throughout, such as hip extension, plantar flexion, dorsiflexion and spinal flexion.",
  "n-help": "Each training method (for example plyometric training) and psychological skill (for example visualisation and mindfulness) is explained and justified for the client.",
  "cite": "Citations sit beside the facts they support, in brackets with the author and year, throughout the work.",
};
for (const c of TASK1_CHECKS) {
  const key = c.id.startsWith("c-") ? c.id.replace(/^c-.*-(def|apply)$/, "c-$1") : c.id;
  if (TASK1_EX[key]) c.ex = TASK1_EX[key];
}

// ----- Task 1 rubric strands (wording follows the Criterion A rubric on the Task 1 page) -----
// The rubric moves from a list, to a brief account, to distinguishing features, to a detailed account that justifies.
// Feedback uses the rubric's own wording to guide students. It never gives a band or grade.
const TASK1_STRANDS = [
  { id: "ability", name: "Your client's current ability in the desired skill", asks: "a detailed account that justifies your determination of your client's current ability in the desired skill, based on their initial physical performance.",
    next: "State your client's current ability using your trial averages and the comparison with normative data, then justify it: say why those numbers show that level." },
  { id: "phys-sw", name: "Physical strengths and weaknesses", asks: "a detailed account that justifies your determination of your client's strengths and weaknesses in their physical performance.",
    next: "Name specific strengths and weaknesses from your technique analysis, and give the evidence for each (a measurement, an angle or a screenshot) and why it matters." },
  { id: "execution", name: "Features of correct skill execution", asks: "a detailed account that justifies your determination of the features of correct skill execution.",
    next: "Describe what correct execution looks like in each phase using the perfect model, then explain how your client's technique matches or differs." },
  { id: "wellbeing", name: "Current health and well-being", asks: "a detailed account that justifies your determination of your client's current well-being, from their initial health assessment.",
    next: "Pull your interview, PAR-Q, profile and test results together into a clear judgement of your client's well-being, and explain the evidence behind it." },
  { id: "health-sw", name: "Strengths and weaknesses in health and well-being", asks: "a detailed account that justifies your determination of your client's strengths and weaknesses in health and well-being.",
    next: "State the strengths and weaknesses in health and well-being and link each to a result or answer, saying why it matters." },
  { id: "relationship", name: "How health relates to physical performance", asks: "a detailed account that justifies how your client's well-being relates to their physical performance.",
    next: "For each health finding, explain how it could help or limit performance in the event, using theory to support the link." },
  { id: "solutions", name: "Investigating the issues and developing relevant solutions", asks: "use of your knowledge from lessons to investigate in depth the issues highlighted by your client, and development of relevant solutions.",
    next: "Link each issue to theory, then name specific, relevant solutions (training methods and exercises) and explain why they suit your client." },
  { id: "terms", name: "Subject-specific terminology", asks: "consistent use of most or all of the relevant subject-specific terminology.", terms: true,
    next: "Replace everyday words with PHE terms throughout your analysis (muscle names, joint movements, fitness components, theory) and explain each term the first time you use it." },
];
const TASK1_STRAND_MAP = {
  ability: ["f-trials", "f-event", "f-meaning", "te-speed", "s-records"],
  "phys-sw": ["te-screens", "te-model", "te-principles", "te-angles", "f-meaning"],
  execution: ["s-event", "te-position", "te-flight", "te-model", "te-angles", "te-terms"],
  wellbeing: ["p-interview", "p-parq", "p-body", "p-injury", "p-diet", "p-sleep", "p-activity", "m-test", "m-scale", "m-meaning"],
  "health-sw": ["o-sw", "m-meaning", "t-linked"],
  relationship: ["o-relate", "t-linked", "t-named", "t-nutrition", "n-links"],
  solutions: ["t-named", "t-nutrition", "t-linked", "n-areas", "n-links", "n-help", "n-why", "n-observe"],
};
for (const c of TASK1_CHECKS) c.strands = Object.keys(TASK1_STRAND_MAP).filter((k) => TASK1_STRAND_MAP[k].includes(c.id));

// ----- Task 1: feedback on one section at a time -----
// Students often paste just one part of their work. The tool works out which checklist section it is (or uses the
// section they choose), then checks only that section's items and the rubric strands that section feeds.
const sectionOnlyCheck = (id, area, label, fn, how) => ({ id, area, ref: area, label, fn: (t, s) => ({ level: fn(t, s), found: [] }), ok: `This is covered: ${label}.`, what: `I could not find clear evidence of this: ${label}.`, how });
const CONCEPT_SECTION_CHECKS = conceptItems(false); // when a section is chosen, the whole paste is about that concept
const SEC_DETAIL = sectionOnlyCheck("sec-detail", "Before you submit", "Information is detailed and in paragraph form", (t, s) => (s.words >= 120 ? 2 : s.words >= 50 ? 1 : 0),
  ["Explain each point in full sentences and paragraphs rather than lists or short notes.", "Give the reason for each point, using because."]);
const byId = Object.fromEntries(TASK1_CHECKS.map((c) => [c.id, c]));
const conceptById = Object.fromEntries(CONCEPT_SECTION_CHECKS.map((c) => [c.id, c]));
const pick = (...ids) => ids.map((id) => conceptById[id] || byId[id]);
const SECTION_DEFS = [
  { id: "global-context", group: "Conceptual understanding", label: "Global context: Fairness and development", checks: ["c-global context-def", "c-global context-apply", "c-global context-coach"], detect: [[/global context/i, 6], [/fairness and development/i, 5], [/\bfairness\b/i, 2], [/\bglobal\b/i, 1]] },
  { id: "key-concept", group: "Conceptual understanding", label: "Key concept: Relationships", checks: ["c-key concept-def", "c-key concept-apply", "c-key concept-coach"], detect: [[/key concept/i, 6], [/\brelationships?\b/i, 1]] },
  { id: "related-concept", group: "Conceptual understanding", label: "Related concept: Environment", checks: ["c-related concept-def", "c-related concept-apply", "c-related concept-coach"], detect: [[/related concept/i, 6], [/\benvironments?\b/i, 1]] },
  { id: "statement-of-inquiry", group: "Conceptual understanding", label: "Statement of inquiry", checks: ["soi-client", "soi-together", "soi-coach"], detect: [[/statement of inquiry/i, 6], [/fair and equal relationships/i, 5]] },
  { id: "profile", group: "Health analysis", label: "Client profile, interview and PAR-Q", checks: ["p-interview", "p-parq", "p-body", "p-injury", "p-diet", "p-sleep", "p-activity"], detect: [[/par.?q/i, 3], [/interview/i, 2], [/\bbmi\b/i, 3], [/\bheight\b/i, 1], [/\bweight\b/i, 1], [/years? old|\baged?\b/i, 1], [/sleep/i, 1], [/\bsteps?\b/i, 1], [/calorie|kcal/i, 2], [/water intake|hydrat/i, 1], [/injur|surgery|illness/i, 1], [/client profile/i, 3]] },
  { id: "measures", group: "Health analysis", label: "Measurements of health and well-being", checks: ["m-test", "m-scale", "m-meaning", "cite"], detect: [[/acsi|csai|smuis|bsmas|who.?5/i, 4], [/questionnaire|survey|inventory/i, 2], [/mark scheme|scoring scale|\bscale\b/i, 2], [/\bscore[sd]?\b/i, 1], [/test and purpose/i, 3], [/measurements?/i, 2]] },
  { id: "theory", group: "Health analysis", label: "Links to theory", checks: ["t-named", "t-nutrition", "t-linked", "cite"], detect: [[/inverted.?u/i, 4], [/\b(motivation|arousal|anxiety|confidence|stress)\b/i, 1.5], [/theory|theories/i, 2], [/nutrition|protein|carbohydrate/i, 1], [/recovery/i, 1]] },
  { id: "overall-health", group: "Health analysis", label: "Overall health analysis and evaluation", checks: ["o-sw", "o-relate", "cite"], detect: [[/overall health|overall (?:well.?being|fitness)/i, 4], [/strengths? and weaknesses?/i, 2], [/health (?:and|&) well.?being/i, 1], [/relates? to (?:physical )?performance|affects? (?:her|his|their) performance/i, 2]] },
  { id: "sport", group: "Physical analysis", label: "Chosen sport", checks: ["s-event", "s-records", "cite"], detect: [[/world record/i, 4], [/the (?:athletics )?event involves|chosen (?:sport|event)|history of/i, 3], [/\bphases?\b/i, 1], [/approach|take.?off|flight|landing|\bstart\b/i, 1]] },
  { id: "fitness", group: "Physical analysis", label: "Fitness analysis", checks: ["f-trials", "f-event", "f-meaning"], detect: [[/\btrials?\b/i, 2], [/\baverage\b/i, 1], [/fitness tests?/i, 3], [/sit.?and.?reach|vertical jump|standing (?:long )?jump|30 ?m|sprint|bleep/i, 2], [/normative/i, 2], [/components? of fitness/i, 2]] },
  { id: "technique", group: "Physical analysis", label: "Technique analysis", checks: ["te-position", "te-angles", "te-flight", "te-speed", "te-principles", "te-screens", "te-model", "te-app", "te-terms"], detect: [[/perfect model/i, 5], [/screenshot/i, 2], [/\bangles?\b/i, 2], [/kinovea|hudl|coach.?s eye|angle meter/i, 3], [/body position|posture/i, 2], [/flexion|extension|plantar|dorsi/i, 2], [/stride|release angle|flight phase/i, 1], [/technique/i, 1]] },
  { id: "solutions", group: "Relevant solutions and next steps", label: "Relevant solutions and next steps", checks: ["n-areas", "n-links", "n-help", "n-why", "n-observe"], detect: [[/training methods?|plyometric|interval|circuit|fartlek/i, 2], [/\bdrills?\b|\bexercises?\b/i, 1], [/re.?test|video analysis|feedback meetings?/i, 2], [/solutions?/i, 2], [/next steps?/i, 3], [/need(?:s)? to (?:improve|work on|develop)/i, 2], [/\bsmart\b/i, 1]] },
];
export const SECTION_LIST = SECTION_DEFS.map(({ id, group, label }) => ({ id, group, label }));

// which section(s) does this text look like?
export function detectSections(text) {
  const ranked = SECTION_DEFS.map((d) => {
    const score = d.detect.reduce((n, [rx, w]) => n + w * Math.min(2, (text.match(new RegExp(rx.source, rx.flags.replace("g", "") + "g")) || []).length), 0);
    return { id: d.id, label: d.label, group: d.group, score };
  }).sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const confident = top.score >= 4;
  const chosen = confident ? ranked.filter((r, i) => i === 0 || (r.score >= Math.max(4, top.score * 0.6) && i < 3)) : [];
  return { ranked, chosen, confident };
}

// evidence: the sentence in the student's text that shows an item is covered
const EV = {
  def: [CITED, /\b(is|means|refers to|defined as|involves)\b/i], apply: [/\bclient\b/i, /\bathlete/i], coach: [/\bcoach/i],
  "soi-client": [/\bclient\b/i], "soi-together": [/relationship/i], "soi-coach": [/\bcoach/i],
  "p-interview": [/interview/i], "p-parq": [/par.?q/i], "p-body": [/\bbmi\b/i, /height|\btall\b|\d\s?kg\b/i], "p-injury": [/injur|illness|surgery/i], "p-diet": [/calorie|kcal|diet/i], "p-sleep": [/sleep/i], "p-activity": [/steps?/i],
  "m-test": [/\b(because|chose|purpose|used to)\b/i, /acsi|csai|questionnaire|survey|scale/i], "m-scale": [/\d+\s*(?:-|–|to)\s*\d+|out of \d+/i, /scor/i], "m-meaning": [/\b(this (?:shows|suggests|means|indicates)|which means|suggests|indicates)\b/i],
  "t-named": [/inverted.?u|motivation|anxiety|arousal|confidence|stress/i], "t-nutrition": [/nutri|protein|carbohydrate|sleep|recover/i], "t-linked": [/\b(result|score|shows?|suggests?)\b/i],
  "o-sw": [/strength/i, /weakness/i], "o-relate": [/\b(affect|impact|influence|limit)\w*/i],
  "s-event": [/phase|stage|approach|take.?off|flight|landing/i], "s-records": [/world record/i],
  "f-trials": [/trial\s*[123]|three trials|3 trials|average|mean/i], "f-event": [/initial|baseline/i], "f-meaning": [/current level|need\w* (?:to )?improv|improve/i],
  "te-position": [/body position|posture|lean|alignment/i], "te-angles": [/angle/i], "te-flight": [/release angle|flight|stride/i], "te-speed": [/\d+(?:\.\d+)?\s*(?:m|cm|s|sec|seconds)\b/i], "te-principles": [/balance|force|power|flow|fluency|coordination/i],
  "te-screens": [/strength|weakness/i], "te-model": [/perfect model|olympic|world champion|elite|professional/i], "te-app": [/kinovea|hudl|coach.?s eye|angle meter|app\b/i], "te-terms": [/flexion|extension|plantar|dorsi|quadriceps|hamstring|gluteal/i],
  "n-areas": [/need\w* (?:to )?(?:improv|work|develop)|improve|weak/i], "n-links": [/relationship|environment|communicat/i], "n-help": [/interval|circuit|plyometric|weights|fartlek|drill|exercise/i], "n-why": [/\b(suit|suits|because|will lead|lead to)\b/i], "n-observe": [/video analysis|questionnaire|feedback meeting|re.?test|observ/i],
  cite: [CITED],
};
for (const c of [...TASK1_CHECKS, ...CONCEPT_SECTION_CHECKS]) {
  const key = c.id.replace(/^c-.*-(def|apply|coach)$/, "$1");
  if (EV[key]) c.ev = EV[key];
}
function sentenceAround(t, i) {
  const before = Math.max(t.lastIndexOf(". ", i), t.lastIndexOf("? ", i), t.lastIndexOf("! ", i), t.lastIndexOf("\n", i));
  const afterM = t.slice(i).search(/[.!?](\s|$)|\n/);
  let a = before < 0 ? 0 : before + 1, b = afterM < 0 ? t.length : i + afterM + 1;
  let out = t.slice(a, b).replace(/\s+/g, " ").trim();
  if (out.length > 190) { const rel = i - a; const from = Math.max(0, Math.min(rel - 70, out.length - 180)); out = (from > 0 ? "…" : "") + out.slice(from, from + 180).trim() + (from + 180 < out.length ? "…" : ""); }
  return out;
}
export function quoteFor(check, text) {
  if (!check.ev) return "";
  const scope = check.scope ? check.scope(text) : text;
  if (!scope) return "";
  for (const rx of check.ev) { const m = scope.match(rx); if (m) return sentenceAround(scope, m.index); }
  return "";
}

// section check: only the chosen section(s), 1-2 strengths with quotes, then areas to improve
export function runSectionCheck(taskNumber, text, forcedIds = null) {
  const cfg = RUBRIC[taskNumber];
  if (!cfg || !cfg.sections) return null;
  const stats = textStats(text);
  const det = detectSections(text);
  const ids = forcedIds && forcedIds.length ? forcedIds : det.chosen.map((c) => c.id);
  if (!ids.length) return { mode: "section", needsChoice: true, ranked: det.ranked.slice(0, 3), stats };
  const justified = stats.reasoning >= 2 && stats.reasoningRate >= 0.5;
  const sections = ids.map((id) => {
    const def = SECTION_DEFS.find((d) => d.id === id);
    const checks = [...pick(...def.checks), SEC_DETAIL, byId["sub-prompts"]];
    const results = checks.map((c) => ({ check: c, ...c.fn(text, stats) }));
    const core = results.filter((x) => !["sec-detail", "sub-prompts"].includes(x.check.id));
    const withQuote = core.filter((x) => x.level === 2).map((x) => ({ ...x, quote: quoteFor(x.check, text) }));
    const strengths = [...withQuote.filter((x) => x.quote), ...withQuote.filter((x) => !x.quote)].slice(0, 2);
    const improve = [...results.filter((x) => x.level === 0), ...results.filter((x) => x.level === 1)];
    const ownIds = new Set(def.checks);
    const lvlOf = Object.fromEntries(results.map((x) => [x.check.id, x.level]));
    const strands = TASK1_STRANDS.filter((st) => st.terms || (TASK1_STRAND_MAP[st.id] || []).some((cid) => ownIds.has(cid))).map((st) => {
      let status;
      if (st.terms) status = stats.terms < 2 ? "Needs more PHE terms" : stats.terms < 5 ? "Some PHE terms" : "Strong use of PHE terms";
      else {
        const mine = (TASK1_STRAND_MAP[st.id] || []).filter((cid) => ownIds.has(cid));
        const cov = mine.reduce((n, cid) => n + (lvlOf[cid] || 0), 0) / (mine.length * 2);
        status = cov < 0.67 ? "Started" : justified ? "Described and justified" : "Described, not yet justified";
      }
      return { id: st.id, name: st.name, asks: st.asks, next: st.next, status };
    });
    return { id, label: def.label, group: def.group, covered: core.filter((x) => x.level === 2).length, total: core.length, strengths, improve, strands, score: (det.ranked.find((r) => r.id === id) || {}).score || 0 };
  });
  return { mode: "section", sections, stats, justified, auto: !(forcedIds && forcedIds.length), ranked: det.ranked.slice(0, 4), task: taskNumber, criterion: cfg.criterion, cant: cfg.cant, minWords: 40 };
}

const RUBRIC = {
  1: {
    // Task 1 is checked against the Task 1 checklist template only (and, when added, the student example).
    mode: "checklist",
    note: "This check uses the Task 1 checklist, the Task 1 rubric and the Task 1 student example as its references. The student example was written for a previous unit theme, so use it to see how the work is written, not for what it says.",
    strands: TASK1_STRANDS,
    sections: true,
    title: "Task 1: Initial Observation and Analysis",
    criterion: "Task 1 checklist",
    minWords: 600,
    checks: TASK1_CHECKS,
    focus: "Start with the first missing item above. Add it to your Word document in your own words. Then look at the rubric section and, for each strand, add the reasons and evidence the rubric asks for. Paste your work in again to see what has changed.",
    cant: [
      "Written work is 5-6 pages maximum, in no smaller than 10pt font (including tables, screenshots and diagrams).",
      "You have deleted all the grey prompts and tick-lists from your Word document. This tool can only spot prompts left in the text you paste.",
      "Words linking to the key concept, related concept, global context and statement of inquiry are in bold and/or a different colour.",
      "The tables in the template are completed, and graphs, pictures and screenshots support your analysis.",
      "Your full bibliography is a separate submission after Task 4.",
    ],
    next: { "1-2": "", "3-4": "", "5-6": "", "7-8": "" },
  },
  2: {
    title: "Task 2: Performance Development Plan",
    criterion: "Criterion B: Planning for Performance",
    minWords: 600,
    checks: [
      F("t2-weak", "Factors affecting performance", "Factors affecting performance", "Weak physical and health aspects and their impact",
        (t) => { const phys = findTerms(t, ["power", "speed", "strength", "flexibility", "technique", "phase", "component"]); const health = findTerms(t, ["anxiety", "confidence", "motivation", "sleep", "protein|diet|nutrition", "social media", "screen", "stress", "fear"]); const imp = /impact|affect|limit|hinder|weak|reduce/i.test(t); return { level: phys.length >= 2 && health.length >= 2 && imp ? 2 : phys.length + health.length >= 2 ? 1 : 0, found: [...phys, ...health] }; },
        "You discuss how weak physical and health aspects affect performance.",
        "The weak physical and health aspects, and how they affect performance, are not clear.",
        ["Name the weak physical aspects (a component of fitness and the phase of the event).", "Name the weak health aspects (for example sleep, protein, social media, confidence, anxiety).", "For each, explain how it affects the event result."]),
      F("t2-smart", "Physical and health goals", "Physical and health goals", "SMART format",
        (t, s) => { const w = findTerms(t, ["specific", "measurable", "achievable", "relevant", "timely|time.?bound"]); return { level: w.length >= 4 && s.numbers >= 6 ? 2 : w.length >= 2 || s.numbers >= 4 ? 1 : 0, found: w }; },
        "Your goals are set out in SMART format with numbers.",
        "The goals are not clearly set out in SMART format with numbers.",
        ["Use the SMART goal builder on this page.", "Write each goal under Specific, Measurable, Achievable, Relevant and Timely headings.", "Give baseline and target numbers and a deadline."]),
      F("t2-two", "Physical and health goals", "Physical and health goals", "One physical goal and one health goal",
        (t) => ({ level: both(t, "physical goal|physical smart", "health goal|health smart|psycholog") ? 2 : termRx("goal").test(t) ? 1 : 0, found: [] }),
        "You have both a physical goal and a health (psychology) goal.",
        "It is not clear that you have one physical goal and one health goal.",
        ["Write one physical goal that will improve performance in your event.", "Write one health goal that focuses on psychology and relates to social media use.", "Label them clearly."]),
      T("t2-rel", "Physical and health goals", "Physical and health goals", "How the two goals relate",
        ["relationship between", "link between", "connect", "both goals", "together", "overall improvement", "linked"], 2,
        "You explain how the two goals relate to each other.",
        "The relationship between your two goals is not explained.",
        ["Explain how improving the health goal supports the physical goal (for example how lower anxiety could help timing and focus).", "Explain how improving both will lead to better overall event performance."]),
      T("t2-methods", "Training methods", "Training methods", "Physical training methods defined and explained", ["interval", "circuit", "weights|resistance", "plyometric", "fartlek", "continuous", "flexibility training", "technique training"], 2,
        "You name and explain physical training methods.",
        "Physical training methods are not clearly named and explained.",
        ["Name each training method you will use and define it.", "Say why it suits your client's weaknesses and your event.", "Link it to the principle of specificity."]),
      T("t2-drills", "Training methods", "Training methods", "Technique drills for the event", ["drill", "technique", "take.?off", "approach", "phase", "exercise"], 4,
        "You include technique drills linked to your event.",
        "Technique drills are limited.",
        ["Research specific drills for your event and cite your sources.", "State which part of the technique each drill improves (for example take-off or body position).", "Give exercises with sets and reps."]),
      T("t2-pst", "Training methods", "Training methods", "Psychological skills training", ["breathing", "visuali", "imagery", "self.?talk", "relaxation", "meditation", "mindfulness", "progressive muscle"], 3,
        "You include psychological skills training methods.",
        "Psychological skills training is not clear enough.",
        ["Name at least two methods (for example breathing, imagery, self-talk, relaxation).", "Explain how each is done and why you chose it for your client.", "Plan one into every session."]),
      T("t2-social", "Training methods", "Training methods", "Changes to social media and screen time", ["social media", "screen ?time", "phone", "app limit", "usage", "digital", "notifications", "reduce|limit"], 4,
        "You plan changes to social media or screen time.",
        "Changes to social media or screen time are not explained.",
        ["State the specific change (for example a daily limit or no phone before training).", "Explain why and how it will affect performance and health.", "Say how you will track it."]),
      T("t2-fitt", "FITT and SPORT principles", "FITT and SPORT principles", "FITT and SPORT principles", ["frequency", "intensity", "\\btime\\b", "\\btype\\b", "specificity", "progress", "overload", "reversibility", "tedium"], 7,
        "You define and apply FITT and SPORT.",
        "FITT and SPORT are not fully defined and applied.",
        ["Define each letter of FITT and SPORT.", "Give an example from your plan for each one.", "Explain how and why each is applied."]),
      T("t2-tools", "Innovative tools", "Innovative tools", "Innovative tools to track performance and screen time", ["\\bapps?\\b", "tracker", "wearable", "heart rate", "apple watch|garmin|strava|fitbit", "kinovea|hudl", "sleep", "diet", "screen ?time", "innovative"], 4,
        "You explain how innovative tools will track performance and screen time.",
        "The use of innovative tools is not clear.",
        ["Name the tools you will use.", "Say what data each will give you (heart rate, duration, calories, stress rating, sleep, screen time).", "Explain how you will use that data to adapt the plan."]),
      F("t2-sessions", "Training programme", "Training programme sessions 1 to 8", "A structured programme of 8 sessions",
        (t) => { const nums = new Set([...t.matchAll(/session\s*#?\s*([1-8])/gi)].map((m) => m[1])); const parts = findTerms(t, ["warm.?up", "main (?:activity|workout|set)|main", "cool.?down", "psycholog"]); return { level: nums.size >= 6 && parts.length >= 4 ? 2 : nums.size >= 2 || parts.length >= 2 ? 1 : 0, found: [...nums].map((n) => `session ${n}`) }; },
        "Your programme covers the sessions and includes a warm-up, main activity, cool-down and psychological skills.",
        "The 8 sessions are not all clear, or sessions are missing a warm-up, main activity, cool-down or psychological skills.",
        ["Use the session planner on this page to plan all 8 sessions.", "Each session needs a warm-up, main activity(ies), a cool-down and psychological skills training.", "Show logical progression using FITT and SPORT."]),
      T("t2-interim", "Interim performance analysis", "Interim performance analysis", "Interim re-test and changes", ["interim", "re.?test", "half.?way", "after (?:4|four|session 4)", "progress", "change"], 3,
        "You include an interim re-test and discuss progress and changes.",
        "The interim re-test and analysis are missing or thin.",
        ["Re-test the fitness tests and the event after session 4.", "Report progress towards each SMART goal.", "State what must change in the plan and whether a goal needs to change."]),
      T("t2-adapt", "Training programme sessions 5 to 8", "Training programme sessions 5 to 8", "Clear adaptations after the interim results", ["adapt", "changed?", "modif", "adjust", "because", "increase", "decrease", "instead", "replaced"], 5,
        "You show adaptations to the plan based on results.",
        "Adaptations are not clearly shown.",
        ["Show clear examples of what changed between sessions 1-4 and 5-8.", "Give the reason for each change using your interim results.", "Justify the changes with FITT and SPORT."]),
      T("t2-reflect", "Daily reflections", "Daily reflections", "Reflections and client feedback", ["reflection", "padlet", "voice memo", "interview", "feedback", "went well", "difficult"], 4,
        "You include reflections and client feedback after sessions.",
        "Reflections and client feedback are thin.",
        ["Summarise the client's reflection after each session from Padlet.", "Record what went well, what was difficult and what to change.", "Add a screenshot and say how the coach-client relationship is developing."]),
      T("t2-why", "Justification", "Rubric: justify", "Reasons for your choices", ["because", "justif", "reason", "chosen|chose", "why", "so that", "as a result"], 4,
        "You give reasons for your design choices.",
        "Your design choices are described without enough reasons.",
        ["For each major choice, add the word because.", "Support the reason with your data, your research or a principle of training."]),
      CITE_CHECK,
    ],
    next: {
      "1-2": "Next focus: outline a basic plan that is logical, refers to drills and technique, and connects your health and physical goals. Respond to your client's development.",
      "3-4": "Next focus: make the plan detailed, clear and logical, with drills for appropriate technique, a health element that connects to the physical goal, and a clear adaptation after the interim results.",
      "5-6": "Next focus: justify your goals and design choices, keep the plan specific, clear and concise, and adapt and justify changes after every session.",
      "7-8": "You are meeting the highest descriptors. Check that every design choice has a valid reason and that adaptations are justified session by session.",
    },
  },
  3: {
    title: "Task 3: Applying and Performing",
    criterion: "Criterion C: Applying and Performing",
    minWords: 200,
    note: "Paste your video script or voice-over notes. This check can only look at what you say, not at your performance.",
    checks: [
      T("t3-struct", "Structure", "Structure", "Clear sections and title slides", ["title", "section", "part", "introduction", "summary", "conclusion", "phase", "slide"], 3,
        "Your video is organised into sections.",
        "The sections and title slides are not clear.",
        ["Plan a title slide for each section (for example full performance, approach, take-off, flight, landing, psychological skills, results).", "Write a line of script for each section."]),
      T("t3-angles", "Content", "Content", "Multiple camera angles", ["angles?", "camera", "view", "front", "side", "behind", "overhead", "rear"], 3,
        "You plan to show the performance from different angles.",
        "Multiple camera angles are not mentioned.",
        ["List the camera angles you recorded (for example side, front, behind).", "Say what each angle shows about your technique."]),
      T("t3-slow", "Content", "Content", "Full speed on loop, then slow motion", ["slow.?motion|slow mo", "loop", "full speed|normal speed|real time", "frame"], 2,
        "You show full speed and slow motion.",
        "Full speed on loop and slow motion are not mentioned.",
        ["Start with the entire performance at full speed on a loop.", "Then show smaller clips of the phases, including slow motion."]),
      T("t3-annot", "Content", "Content", "Annotation with an innovative tool", ["annotat", "kinovea", "hudl", "coachview", "coach.?s eye", "draw", "lines?", "circle", "angle", "arrow"], 3,
        "You annotate the video with an analysis tool.",
        "Annotation is not mentioned.",
        ["Name the tool you used (for example Kinovea, Hudl, CoachView).", "Draw angles, lines or circles on the key moments.", "Say what each annotation shows."]),
      T("t3-explain", "Content", "Content", "Explaining and justifying improvements", ["improv", "changed", "before|initial|started", "now|final|after", "because", "due to", "result"], 5,
        "You talk about how your performance improved and why.",
        "Improvements are not explained with reasons.",
        ["Compare your initial and final performance in each phase.", "Say what changed and what training caused the change.", "Justify with a reason: because..."]),
      T("t3-manner", "Content", "Content", "Manner of performance", ["accura", "efficien", "control", "coordination", "timing", "fluen", "speed", "power", "rhythm", "balance"], 4,
        "You describe the manner in which skills are performed (accuracy, control, timing and so on).",
        "The manner of performance is not described.",
        ["Choose four or five qualities (accuracy, efficiency, control, coordination, timing, fluency, speed, power).", "Point to a moment in the video where each can be seen."]),
      T("t3-complex", "Content", "Content", "Complex strategies and skills combined", ["complex", "combin", "sequence", "linked", "transition", "tactic", "strateg", "space", "force", "flow", "sophisticated"], 4,
        "You describe complex skills combined together.",
        "Complex skills and strategies are not described.",
        ["Name the most complex skills or techniques in your event.", "Explain how you combined them (for example run-up, take-off, flight and landing).", "Explain how you use space, time, force and flow of movement."]),
      T("t3-pst", "Content", "Content", "Psychological skills clip and benefits", ["breathing", "visuali", "imagery", "self.?talk", "relaxation", "mindfulness", "routine", "psycholog", "benefit", "helped", "calm", "focus", "confiden"], 3,
        "You include a psychological skills clip and its benefits.",
        "The psychological skills clip is not clear.",
        ["Add a short clip of you using a psychological skill before your performance.", "Say what you did and how it helped."]),
      F("t3-results", "Content", "Content", "Initial and final results on screen", (t, s) => ({ level: s.numbers >= 4 && both(t, "initial|baseline|start", "final|end") ? 2 : s.numbers >= 2 ? 1 : 0, found: s.numbers ? [`${s.numbers} numbers`] : [] }),
        "You show initial and final results.",
        "Initial and final results are not shown.",
        ["Display your initial and final results on screen as text.", "Mention the difference and what it shows."]),
    ],
    next: {
      "1-2": "Next focus: show basic skills and technique and some basic strategies and patterns of movement.",
      "3-4": "Next focus: show a simple combination of skills, intermediate technique, and patterns of movement showing some use of space, time, force and flow.",
      "5-6": "Next focus: show a combination of complex skills, sophisticated technique and skilled use of space, time, force and flow.",
      "7-8": "You are meeting the highest descriptors. Keep the video within 3 minutes with clear annotation and audio.",
    },
  },
  4: {
    title: "Task 4: Reflecting and Improving Performance",
    criterion: "Criterion D: Reflecting and Improving",
    minWords: 600,
    checks: [
      F("t4-roles", "As a coach and as a client", "Task", "Both coach and client reflections", (t) => ({ level: /as a coach/i.test(t) && /as a client/i.test(t) ? 2 : both(t, "coach", "client") ? 1 : 0, found: [] }),
        "You reflect both as a coach and as a client.",
        "Both the coach and client reflections are not clearly set out.",
        ["Use sub-headings As a Coach and As a Client.", "Make sure each section answers its own checklist questions."]),
      T("t4-strategies", "As a coach and as a client", "Content", "Strategies to enhance interpersonal skills", ["communicat", "listen", "feedback", "collaborat", "negotiat", "empath", "encourag", "respect", "trust", "rapport", "relationship", "compromise"], 6,
        "You explain strategies to enhance interpersonal skills.",
        "The strategies for interpersonal skills are limited.",
        ["Name specific strategies you used (for example active listening, giving feedback, agreeing changes together).", "Give an example of each in action.", "Explain why each helped the relationship."]),
      T("t4-atl", "As a coach and as a client", "Content", "ATL skills", ["self.?confidence", "engagement", "professional relationship", "listening", "attitude", "collaboration", "organi[sz]ation", "motivation", "resilience", "growth mindset"], 4,
        "You name ATL skills you used or developed.",
        "ATL skills are not named.",
        ["Choose four or five ATL skills from the list.", "For each, give an example of when you used or needed to develop it."]),
      T("t4-ib", "As a coach and as a client", "Content", "IB learner profile attributes", ["inquirer", "knowledgeable", "thinker", "communicator", "principled", "open.?minded", "caring", "risk.?taker", "balanced", "reflective", "learner profile"], 3,
        "You link your experience to IB learner profile attributes.",
        "IB learner profile attributes are not covered.",
        ["Choose attributes you developed (for example Risk-taker, Communicator, Principled).", "Support each with an example from the unit."]),
      T("t4-feedback", "As a coach and as a client", "Content", "Feedback that led to changes", ["feedback", "changed?", "adapt", "adjust", "modif", "because", "as a result", "plan"], 5,
        "You give examples of feedback that led to changes in the plan.",
        "Examples of feedback that led to changes are limited.",
        ["Give two or three specific examples: what was said, and what changed in the plan.", "Explain why the change was made."]),
      T("t4-collab", "As a coach and as a client", "Content", "Collaboration strategies", ["padlet", "voice memo", "discuss", "meeting", "agreed", "mutual", "negotiat", "together", "check.?in"], 3,
        "You describe how you collaborated to adapt the plan.",
        "Collaboration strategies are not clear.",
        ["Describe how you worked together (Padlet, voice memos, discussions).", "Explain how it led to agreement on changes to the plan."]),
      T("t4-goals", "Effectiveness of the plan", "Content", "Were the goals met?", ["goal", "achiev", "met\\b", "reached", "exceed", "fell short|not met|did not meet", "target", "smart"], 4,
        "You evaluate whether the goals were met.",
        "Whether the goals were met is not clear.",
        ["State each SMART goal and whether it was met, with the numbers.", "Explain why it was or was not met."]),
      F("t4-results", "Effectiveness of the plan", "Content", "Initial, interim and final results", (t, s) => ({ level: s.numbers >= 10 && ["initial", "interim", "final"].every((w) => termRx(w).test(t)) ? 2 : s.numbers >= 4 ? 1 : 0, found: s.numbers ? [`${s.numbers} numbers`] : [] }),
        "You compare initial, interim and final results.",
        "Initial, interim and final results are not compared.",
        ["Show initial, interim and final results in a table for the event, fitness tests and well-being goals.", "Comment on the pattern of change."]),
      T("t4-diff", "Effectiveness of the plan", "Content", "What you would do differently", ["next time", "another time", "differently", "would change", "could have", "in future", "if i"], 1,
        "You say what you might do differently next time.",
        "There is no clear statement of what you would do differently.",
        ["Say what you would change and why.", "Link it to something that did not work."]),
      F("t4-succ", "Effectiveness of the plan", "Content", "Successes and challenges", (t) => ({ level: both(t, "success", "challeng") ? 2 : termRx("success|challeng").test(t) ? 1 : 0, found: [] }),
        "You discuss successes and challenges.",
        "Successes and challenges are not both covered.",
        ["Describe at least two successes and two challenges.", "Explain what caused each."]),
      T("t4-phases", "As a client", "Content", "Phases of the event, initial vs final", ["phase", "approach", "take.?off", "flight", "landing", "release", "start", "drive", "stride", "initial", "final"], 5,
        "You break the event into phases and compare initial and final performance.",
        "The phases and the initial/final comparison are not clear.",
        ["Break the event into phases.", "Compare initial and final performance in each with screenshots.", "Explain strengths and limitations for each phase."]),
      F("t4-sl", "As a client", "Content", "Strengths and limitations", (t) => ({ level: both(t, "strength", "limitation|weakness") ? 2 : termRx("strength|limitation|weakness").test(t) ? 1 : 0, found: [] }),
        "You weigh strengths and limitations.",
        "Strengths and limitations are not both weighed.",
        ["Weigh up at least two strengths and two limitations of your final performance.", "Give evidence for each."]),
      T("t4-concepts", "Structure", "Structure", "Key concept, related concepts, global context and statement of inquiry", ["key concept", "related concept", "global context", "statement of inquiry", "communicat", "environment", "interaction", "identit"], 5,
        "You refer to the unit concepts and context.",
        "The key concept, related concepts, global context and statement of inquiry are not referred to enough.",
        ["Refer to each one by name and connect it to your coaching or performance.", "Put these words in bold text."]),
      CITE_CHECK,
    ],
    next: {
      "1-2": "Next focus: describe and explain feedback, negotiation and the outcome of the plan. Give detailed evidence of how goals were met.",
      "3-4": "Next focus: analyse the effectiveness of the plan, say what you would do differently, and evaluate your performance by weighing strengths and limitations.",
      "5-6": "Next focus: give reasons for your strategies, show how feedback led to changes in the plan, and critically review your performance against your goals and the aims of PHE.",
      "7-8": "You are meeting the highest descriptors. Check every claim has reasons and evidence.",
    },
  },
};

const BAND_NAMES = ["1-2", "3-4", "5-6", "7-8"];

function checkLevel(check, text, stats) {
  if (check.fn) return check.fn(text, stats);
  const f = findTerms(text, check.terms);
  return { level: f.length >= check.min ? 2 : f.length >= 1 ? 1 : 0, found: f };
}

export function runSelfCheck(taskNumber, text) {
  const cfg = RUBRIC[taskNumber];
  const stats = textStats(text);
  const d = depth(stats);
  const results = cfg.checks.map((c) => ({ check: c, ...checkLevel(c, text, stats) }));
  const coverage = results.reduce((n, r) => n + r.level, 0) / (results.length * 2);
  const depthAvg = (d.reasoning + d.evaluating + d.terminology) / 6;
  const raw = coverage * 0.6 + depthAvg * 0.4;
  let band = raw < 0.28 ? 0 : raw < 0.52 ? 1 : raw < 0.76 ? 2 : 3;
  const capped = band === 3 && (d.reasoning < 2 || d.terminology < 2);
  if (capped) band = 2;
  let strandResults = null;
  if (cfg.strands) {
    const lvlOf = Object.fromEntries(results.map((x) => [x.check.id, x.level]));
    strandResults = cfg.strands.map((st) => {
      let status, cov = 0;
      if (st.terms) {
        status = stats.words < 80 || stats.terms < 3 ? "Needs more PHE terms" : stats.terms < 10 ? "Some PHE terms" : "Strong use of PHE terms";
      } else {
        const ids = TASK1_STRAND_MAP[st.id] || [];
        cov = ids.length ? ids.reduce((n, id) => n + (lvlOf[id] || 0), 0) / (ids.length * 2) : 0;
        status = stats.words < 80 || cov < 0.34 ? "Not yet shown" : cov < 0.67 ? "Started" : d.reasoning < 2 ? "Described, not yet justified" : "Described and justified";
      }
      return { id: st.id, name: st.name, asks: st.asks, next: st.next, status, coverage: cov, terms: !!st.terms };
    });
  }
  return {
    strands: strandResults,
    task: taskNumber, title: cfg.title, criterion: cfg.criterion, note: cfg.note || "", mode: cfg.mode || "rubric", cant: cfg.cant || null, focus: cfg.focus || "",
    stats, depth: d, results, coverage, raw, band, bandName: BAND_NAMES[band], capped,
    next: cfg.next[BAND_NAMES[band]],
    tooShort: stats.words < 80,
    short: stats.words < cfg.minWords,
    minWords: cfg.minWords,
  };
}

export const SELF_CHECK_TASKS = Object.fromEntries(Object.entries(RUBRIC).map(([k, v]) => [k, { title: v.title, criterion: v.criterion, note: v.note || "", mode: v.mode || "rubric", sections: !!v.sections }]));
