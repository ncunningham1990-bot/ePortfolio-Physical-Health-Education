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

const RUBRIC = {
  1: {
    title: "Task 1: Initial Observation and Analysis",
    criterion: "Criterion A: Knowing and Understanding",
    minWords: 500,
    checks: [
      F("t1-links", "Unit terminology and connections", "Items 1 to 3", "Links to the global context, key concept, related concepts and statement of inquiry",
        (t) => { const ph = ["global context", "key concept", "related concept", "statement of inquiry"].filter((p) => termRx(p).test(t)); const cw = findTerms(t, ["identit", "communicat", "environment", "interaction", "relationship"]); return { level: ph.length >= 3 && cw.length >= 4 ? 2 : ph.length + cw.length >= 3 ? 1 : 0, found: [...ph, ...cw] }; },
        "You connect your work to the unit's global context, key concept, related concepts and statement of inquiry.",
        "The links to the unit's global context, key concept, related concepts and statement of inquiry are missing or thin.",
        ["Write the four names out: global context (Identities and Relationships), key concept (Communication), related concepts (Environment, Interaction) and the statement of inquiry.", "For each one, explain in a sentence or two how it connects to your chosen sport, PHE and physical, mental and social well-being.", "Put those words in bold or a different colour, as the checklist asks."]),
      T("t1-parq", "Health analysis", "Items 4 to 5", "Interview and PAR-Q", ["par.?q", "interview", "questionnaire", "client"], 2,
        "You used an interview and a PAR-Q to gather health information from your client.",
        "There is no clear sign of the interview questions or the PAR-Q.",
        ["List the interview questions you asked about health, well-being and fitness.", "Complete the PAR-Q with your client and say what it showed.", "Explain what each answer tells you about their readiness to train."]),
      T("t1-baseline", "Health analysis", "Items 5 and 9", "Baseline health information", ["sleep", "steps", "screen ?time", "bmi", "diet|calorie|nutrition", "water|hydrat", "recovery|rest day", "injur|illness", "height", "weight", "age\\b"], 5,
        "You collected a range of baseline health information (for example sleep, steps, screen time, BMI, diet).",
        "Your baseline health information is limited.",
        ["Check the list in items 5 and 9: sleep, steps, screen time, height, weight, BMI, injury or illness, diet, calories, water, recovery days and activity levels.", "Add the missing measures that matter for your client.", "For each one, comment on what it suggests about their overall health, fitness and device use."]),
      T("t1-tools", "Health analysis", "Item 6", "How health was measured", ["acsi", "csai", "who", "smuis", "bsmas", "observation", "survey", "questionnaire"], 2,
        "You name the tools you used to measure well-being and psychology (for example ACSI, CSAI-2, SMUIS, BSMAS).",
        "The measuring tools are not clearly named.",
        ["Name each tool or method you used (for example ACSI, WHO well-being, CSAI-2, SMUIS, BSMAS, interviews, observation).", "Say briefly what each one measures and why you chose it."]),
      F("t1-results", "Health analysis", "Item 7", "Results displayed and explained", (t, s) => ({ level: s.numbers >= 12 && /table|graph|chart|figure|screenshot|illustration/i.test(t) ? 2 : s.numbers >= 4 ? 1 : 0, found: s.numbers ? [`${s.numbers} numbers`] : [] }),
        "You include results as numbers and refer to tables, graphs or figures.",
        "There are few numbers or references to tables and graphs.",
        ["Present your results in a table or graph and refer to it in your writing (for example Figure 1).", "Under each one, say what the results tell you about your client.", "Include only the data you will actually discuss."]),
      T("t1-theory", "Health analysis", "Item 8", "Links to theory from lessons and beyond", ["inverted.?u", "motivation", "somatic", "cognitive", "arousal", "confidence", "stress", "pressure", "nutri|carbohydrate|protein", "sleep", "recovery", "well.?being", "anxiety"], 5,
        "You connect your findings to health, diet and sports psychology theory.",
        "There are few links to health, diet or sports psychology theory.",
        ["Choose two or three of your findings and link each to theory (for example Inverted U Theory, somatic and cognitive anxiety, arousal, motivation, nutrients, sleep and recovery).", "Use the pattern: finding, then the theory, then what it means for your client's performance.", "Go beyond the lessons by researching one idea and citing it."]),
      T("t1-tech", "Health and physical analysis", "Items 10 and 20", "Innovative tools", ["kinovea", "hudl", "kinemaster", "coach.?s eye", "coachview", "\\bapps?\\b", "wearable", "tracker", "smart ?watch", "whoop|garmin|fitbit|strava", "video analysis", "slow.?motion", "innovative"], 2,
        "You refer to innovative tools for monitoring health and analysing performance.",
        "Innovative tools are not mentioned clearly.",
        ["Name at least one tool for monitoring health, well-being or screen time, and at least one for analysing technique (for example Kinovea, Hudl, Coach's Eye).", "Say what each tool would show you about your client and how you will use it.", "Add a screenshot where you can."]),
      T("t1-fitness", "Physical analysis", "Items 14 to 16", "Components of fitness for the event", ["speed", "power", "strength", "flexibility", "endurance", "agility", "coordination", "balance", "reaction", "muscular", "cardiovascular", "body composition"], 4,
        "You identify the components of fitness the event needs.",
        "The components of fitness for your event are not clear.",
        ["List the components of fitness your event needs.", "Define each one in your own words.", "Explain why each one matters for your specific event."]),
      T("t1-tests", "Physical analysis", "Items 17 to 18", "Fitness tests, trials and averages", ["sit.?and.?reach", "vertical jump", "standing (?:long )?jump", "30 ?m", "sprint", "bleep", "cooper", "grip", "illinois", "push.?up", "sit.?up", "plank", "medicine ball", "3 trials|three trials|trial", "average|mean"], 4,
        "You describe the fitness tests, with trials and averages.",
        "The fitness tests, trials or averages are not clear.",
        ["Name each fitness test and say which component of fitness it measures and why you chose it.", "Record 3 trials for each test and calculate the average.", "Show the results in a table or graph and include a picture of your client performing."]),
      T("t1-norms", "Physical analysis", "Item 19", "Normative data and records", ["normative", "world record", "national record", "dassa", "norm", "benchmark", "record", "average for", "compare"], 3,
        "You compare your client's results with normative data or records.",
        "There is no clear comparison with normative data or records.",
        ["Research normative data and records for your event (world, national, DASSA).", "Put them beside your client's results in a table and highlight the range their results fall into.", "Relate the comparison to social media influences, as the checklist asks."]),
      T("t1-technique", "Physical analysis", "Item 20", "Technique analysis with PHE terminology", ["angle", "flexion", "extension", "plantar", "dorsi", "stride", "release", "body position", "centre of mass|center of mass", "force", "balance", "coordination", "take.?off", "approach", "flight", "landing", "phase", "trajectory"], 6,
        "You analyse technique using joint movements, phases and biomechanics.",
        "The technique analysis is thin on joint angles, phases and PHE terms.",
        ["Break the event into phases and analyse each one.", "Use joint movements and angles (for example flexion and extension at the knee and hip) and name the muscles involved.", "Apply principles like balance, force and coordination, and add annotated screenshots."]),
      F("t1-model", "Physical analysis", "Item 20", "Comparison with a model performer", (t) => ({ level: both(t, "model|olympic|world champion|professional|elite|perfect|benchmark", "compare|comparison|whereas|unlike|differ|in contrast") ? 2 : termRx("model|olympic|world champion|professional|elite").test(t) ? 1 : 0, found: [] }),
        "You compare your client's technique with a model performer.",
        "There is no clear comparison with a model performer.",
        ["Choose an elite performer (for example an Olympian or world champion) and find footage of their technique.", "Compare matching phases side by side, with screenshots.", "State where your client matches the model and where they differ, and why that matters."]),
      F("t1-sw", "Summary", "Items 13 and 21", "Strengths and weaknesses", (t) => ({ level: both(t, "strength", "weakness") ? 2 : termRx("strength|weakness").test(t) ? 1 : 0, found: [] }),
        "You identify your client's strengths and weaknesses.",
        "Strengths and weaknesses are not clearly stated.",
        ["State at least two strengths and two weaknesses for health and for physical performance.", "For each one, give the evidence (a result, a measurement or a screenshot).", "Say how each weakness is affecting the event."]),
      T("t1-env", "Environment and relationships", "Items 11, 15 and 21", "Environment, relationships and the digital environment", ["environment", "coach", "relationship", "social media", "screen ?time", "digital", "online", "padlet", "identity", "communicat"], 6,
        "You discuss environment, relationships and the digital environment.",
        "The environment, relationships and digital environment are not covered in depth.",
        ["Discuss the training environment (facilities, coach, the environment your coach creates).", "Discuss relationships and communication online, including your client's social media use and its impact.", "Explain how these affect performance and athletic identity."]),
      T("t1-next", "Summary and next steps", "Items 22 to 25", "Next steps and how you will track progress", ["smart", "goal", "plan", "re.?test", "video analysis", "questionnaire", "feedback", "padlet", "next step", "improve", "measure"], 5,
        "You outline next steps and how you will track progress.",
        "Next steps and how you will track progress are thin.",
        ["State what your client needs to work on first.", "Say how you will observe progress (video analysis, questionnaires, feedback meetings, re-testing).", "Say how feedback will be given in a digital environment (for example Padlet) and finish by relating everything back to the unit concepts."]),
      CITE_CHECK,
    ],
    next: {
      "1-2": "Next focus: move from lists to a brief account. Describe your client's current ability, strengths and weaknesses for both physical performance and health, and start suggesting solutions. Use some PHE terminology.",
      "3-4": "Next focus: add distinguishing features. Show how your health and physical findings relate to each other, use your lesson knowledge to investigate the issues, and offer mostly relevant solutions with frequent PHE terms.",
      "5-6": "Next focus: justify. Give a detailed account that justifies your judgements with evidence, investigate issues in depth and consistently use PHE terminology.",
      "7-8": "You are meeting the highest descriptors. Check that every judgement is justified with evidence and that nothing in the checklist is missing.",
    },
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
  return {
    task: taskNumber, title: cfg.title, criterion: cfg.criterion, note: cfg.note || "",
    stats, depth: d, results, coverage, raw, band, bandName: BAND_NAMES[band], capped,
    next: cfg.next[BAND_NAMES[band]],
    tooShort: stats.words < 80,
    short: stats.words < cfg.minWords,
    minWords: cfg.minWords,
  };
}

export const SELF_CHECK_TASKS = Object.fromEntries(Object.entries(RUBRIC).map(([k, v]) => [k, { title: v.title, criterion: v.criterion, note: v.note || "" }]));
