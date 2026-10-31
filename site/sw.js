// Service worker for the PHE ePortfolio Hub. Generated into site/sw.js by `npm run build`; edit this template, not sw.js.
// It keeps the app files on the device so the lessons work offline, and refreshes them in the background when online.
const CACHE = "phe-hub-f1fcea8847";
const FILES = [
 "./",
 "activities/major-muscles.html",
 "app.js",
 "content/bank/01-health-fitness.md",
 "content/bank/02-anatomy.md",
 "content/bank/03-diet-nutrition.md",
 "content/bank/04-sports-psychology.md",
 "content/chatbot.json",
 "content/clinic/01-the-tired-swimmer.md",
 "content/clinic/02-the-stalled-jogger.md",
 "content/clinic/03-the-knee-injury.md",
 "content/clinic/04-which-event.md",
 "content/clinic/05-the-tired-footballer.md",
 "content/clinic/06-the-fast-food-week.md",
 "content/clinic/07-match-day-nerves.md",
 "content/clinic/08-the-ankle-roll.md",
 "content/clock/01-health-fitness.md",
 "content/clock/02-anatomy.md",
 "content/clock/03-diet-nutrition.md",
 "content/clock/04-sports-psychology.md",
 "content/deadlines.json",
 "content/ids.json",
 "content/manifest.json",
 "content/tasks/00-rubric.md",
 "content/tasks/01-task-1.md",
 "content/tasks/02-task-2.md",
 "content/tasks/03-task-3.md",
 "content/tasks/04-task-4.md",
 "content/topics/01-health-fitness/01-definition-and-components-of-fitness.md",
 "content/topics/01-health-fitness/02-fitness-testing.md",
 "content/topics/01-health-fitness/03-use-of-fitness-testing-data.md",
 "content/topics/01-health-fitness/04-innovative-tools-for-performance.md",
 "content/topics/01-health-fitness/05-maximum-oxygen-uptake-vo2-max.md",
 "content/topics/01-health-fitness/06-factors-affecting-fitness.md",
 "content/topics/01-health-fitness/07-principles-of-training.md",
 "content/topics/01-health-fitness/08-essential-elements-of-a-training-programme.md",
 "content/topics/01-health-fitness/09-methods-of-training.md",
 "content/topics/01-health-fitness/10-monitoring-of-exercise-intensity.md",
 "content/topics/01-health-fitness/11-indicators-of-over-training.md",
 "content/topics/01-health-fitness/12-unit-review.md",
 "content/topics/01-health-fitness/_unit.md",
 "content/topics/02-anatomy/01-functions-of-the-skeleton-and-examples-of-bones.md",
 "content/topics/02-anatomy/02-different-types-of-bone.md",
 "content/topics/02-anatomy/03-joints-and-types-of-joint.md",
 "content/topics/02-anatomy/04-features-of-a-synovial-joint.md",
 "content/topics/02-anatomy/05-range-of-movement-at-joints.md",
 "content/topics/02-anatomy/06-types-of-muscle-and-major-muscles.md",
 "content/topics/02-anatomy/07-origin-and-insertion-of-muscles.md",
 "content/topics/02-anatomy/08-muscle-fibre-types.md",
 "content/topics/02-anatomy/09-muscle-movement-antagonistic-pairs.md",
 "content/topics/02-anatomy/10-muscle-contraction-types.md",
 "content/topics/02-anatomy/11-unit-review.md",
 "content/topics/02-anatomy/_unit.md",
 "content/topics/03-diet-nutrition/01-food-groups-carbohydrates-proteins-and-fats.md",
 "content/topics/03-diet-nutrition/02-food-groups-vitamins-minerals-fibre-and-water.md",
 "content/topics/03-diet-nutrition/03-examples-of-food-groups-and-a-healthy-balanced-diet.md",
 "content/topics/03-diet-nutrition/04-energy-requirements-and-expenditure.md",
 "content/topics/03-diet-nutrition/05-unit-review.md",
 "content/topics/03-diet-nutrition/_unit.md",
 "content/topics/04-sports-psychology/01-definition-of-health-and-well-being.md",
 "content/topics/04-sports-psychology/02-safe-practice-par-q.md",
 "content/topics/04-sports-psychology/03-treatment-of-injuries.md",
 "content/topics/04-sports-psychology/04-physique-body-types.md",
 "content/topics/04-sports-psychology/05-motivation-definition-and-types.md",
 "content/topics/04-sports-psychology/06-anxiety-arousal-and-performance.md",
 "content/topics/04-sports-psychology/07-measurement-of-anxiety-and-well-being.md",
 "content/topics/04-sports-psychology/08-responses-to-arousal.md",
 "content/topics/04-sports-psychology/09-psychological-skills-training.md",
 "content/topics/04-sports-psychology/10-goal-setting-smart-format.md",
 "content/topics/04-sports-psychology/11-unit-review.md",
 "content/topics/04-sports-psychology/_unit.md",
 "icons/apple-touch-icon.png",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/icon-maskable-512.png",
 "images/antagonistic-pair.svg",
 "images/arousal-responses.svg",
 "images/bone-types.svg",
 "images/box-breathing.svg",
 "images/chart-anxiety-baseline.svg",
 "images/chart-bleep-progress.svg",
 "images/chart-fitness-vs-norms.svg",
 "images/chart-overload-reversibility.svg",
 "images/chart-overtraining.svg",
 "images/chart-vo2max.svg",
 "images/components-of-fitness.svg",
 "images/contraction-types.svg",
 "images/drive-theory.svg",
 "images/energy-balance.svg",
 "images/energy-use.svg",
 "images/factors-affecting-fitness.svg",
 "images/favicon.png",
 "images/fibre-types.svg",
 "images/hr-training-zones.svg",
 "images/inverted-u-skills.svg",
 "images/inverted-u.svg",
 "images/joint-classes.svg",
 "images/joint-movements-numbered.svg",
 "images/joint-movements.svg",
 "images/karvonen-worked-example.svg",
 "images/macronutrients.svg",
 "images/micronutrients.svg",
 "images/motivation-types.svg",
 "images/muscle-types.svg",
 "images/origin-insertion-labelled.svg",
 "images/origin-insertion-numbered.svg",
 "images/par-q-flow.svg",
 "images/phe-e-coach-logo-v2.webp",
 "images/phe-eportfolio-hub-logo.webp",
 "images/plate-model.svg",
 "images/protocol-beep-test.svg",
 "images/protocol-grip-strength.svg",
 "images/protocol-illinois-agility.svg",
 "images/protocol-push-up.svg",
 "images/protocol-ruler-drop.svg",
 "images/protocol-sit-and-reach.svg",
 "images/protocol-sprint.svg",
 "images/protocol-standing-long-jump.svg",
 "images/protocol-stork-stand.svg",
 "images/pst-toolkit.svg",
 "images/rice-injury-treatment.svg",
 "images/skeleton-labelled.svg",
 "images/skeleton-numbered.svg",
 "images/smart-goals.svg",
 "images/somatotypes.svg",
 "images/synovial-joint-labelled.svg",
 "images/synovial-joint-numbered.svg",
 "images/task-4-atl-1.webp",
 "images/task-4-atl-2.webp",
 "images/task-4-atl-3.webp",
 "images/task-4-atl-4.webp",
 "images/task-4-atl-5.webp",
 "images/task-4-atl-6.webp",
 "images/training-method-profiles.svg",
 "images/training-session-elements.svg",
 "images/wearable-ai.svg",
 "images/wellbeing-triangle.svg",
 "index.html",
 "manifest.webmanifest",
 "parse-widgets.js",
 "progress-io.js",
 "selfcheck.js",
 "style.css",
 "tools.js",
 "vendor/fonts/LICENSE-barlow-condensed.txt",
 "vendor/fonts/LICENSE-barlow.txt",
 "vendor/fonts/barlow-condensed-latin-600-normal.woff2",
 "vendor/fonts/barlow-condensed-latin-700-normal.woff2",
 "vendor/fonts/barlow-condensed-latin-800-normal.woff2",
 "vendor/fonts/barlow-latin-400-italic.woff2",
 "vendor/fonts/barlow-latin-400-normal.woff2",
 "vendor/fonts/barlow-latin-500-normal.woff2",
 "vendor/fonts/barlow-latin-600-normal.woff2",
 "vendor/fonts/barlow-latin-700-normal.woff2",
 "vendor/marked.min.js",
 "vendor/purify.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.all(FILES.map((f) => cache.add(new Request(f, { cache: "reload" })).catch(() => {})))).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("phe-hub-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // only handle our own plain GET requests (not YouTube, MagicSchool, or audio range requests)
  if (req.method !== "GET" || url.origin !== location.origin || req.headers.has("range")) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => { if (res && res.ok && res.type === "basic") cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }   // fast: show the saved copy, refresh it in the background
      const res = await network;
      if (res) return res;
      if (req.mode === "navigate") return (await cache.match("./")) || (await cache.match("index.html"));
      return new Response("Offline", { status: 503, statusText: "Offline" });
    })
  );
});
