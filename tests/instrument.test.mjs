import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });

after(async () => vite.close());

test("opens the seven-day experiment one experienced day at a time", async () => {
  const { applyExperimentAction } = await vite.ssrLoadModule("/lib/experiment.ts");
  const startedAt = Date.UTC(2026, 7, 30, 10);
  const start = applyExperimentAction(null, {
    experimentAction: "start",
    startDate: "2026-08-30",
    timeZone: "UTC",
    morningReminder: "08:00",
    eveningReminder: "19:00",
  }, startedAt);

  assert.equal(start.currentDay, 1);
  assert.equal(start.days[0].state, "available");
  assert.ok(start.days.slice(1).every((day) => day.state === "scheduled"));
  assert.throws(() => applyExperimentAction(start, { experimentAction: "record", dayNumber: 2, moment: "Future answer", status: 1 }, startedAt), /not available/i);

  const dayOne = applyExperimentAction(start, { experimentAction: "record", dayNumber: 1, moment: "A decision I experienced", status: 1 }, startedAt);
  assert.equal(dayOne.records.length, 1);
  assert.equal(dayOne.records[0].captureMode, "same_day");
  assert.equal(dayOne.reviewAvailable, false);
});

test("distinguishes retrospective grace, missing evidence and review readiness", async () => {
  const { applyExperimentAction, experimentView } = await vite.ssrLoadModule("/lib/experiment.ts");
  const startedAt = Date.UTC(2026, 7, 30, 8);
  const start = applyExperimentAction(null, { experimentAction: "start", startDate: "2026-08-30", timeZone: "UTC", morningReminder: "08:00", eveningReminder: "19:00" }, startedAt);
  const graceTime = Date.UTC(2026, 7, 31, 10);
  const grace = experimentView(start, graceTime);
  assert.equal(grace.days[0].state, "grace");
  const retrospective = applyExperimentAction(start, { experimentAction: "record", dayNumber: 1, moment: "Yesterday, recalled this morning", status: 0 }, graceTime);
  assert.equal(retrospective.records[0].captureMode, "retrospective_grace");

  const afterGrace = experimentView(start, Date.UTC(2026, 7, 31, 13));
  assert.equal(afterGrace.days[0].state, "missed");
  assert.equal(afterGrace.missedDays, 1);
  assert.equal(afterGrace.answeredDays, 0);

  const daySevenTime = Date.UTC(2026, 8, 5, 18);
  const daySevenOpen = experimentView(start, daySevenTime);
  assert.equal(daySevenOpen.currentDay, 7);
  assert.equal(daySevenOpen.reviewAvailable, false);
  const withDaySeven = applyExperimentAction(start, { experimentAction: "record", dayNumber: 7, moment: "The seventh experienced day", status: 1 }, daySevenTime);
  assert.equal(withDaySeven.reviewAvailable, true);
});

test("normalises all Volume 1 Labs into one longitudinal interaction grammar", async () => {
  const { publishedLabs } = await vite.ssrLoadModule("/lib/lab-catalog.ts");
  for (const lab of publishedLabs) {
    const baseline = lab.timeline.steps[0].components.map((component) => component.id);
    assert.deepEqual(baseline.slice(0, 3), ["comp_baseline_story", "comp_baseline_index", "comp_baseline_profile"]);
    const components = lab.timeline.steps.flatMap((step) => step.components);
    assert.equal(components.filter((component) => component.type === "DailyExperiment").length, 1, `${lab.cartridgeId} needs exactly one governed tracker`);
    assert.equal(components.filter((component) => component.type === "CompletionCertificate").length, 1, `${lab.cartridgeId} needs one profile-filled certificate`);
    assert.ok(components.some((component) => component.type === "EvidenceSummary"), `${lab.cartridgeId} needs one automatic evidence summary`);
  }
});

test("turns multi-answer workbook prompts into one authored field per answer", async () => {
  const { parseWorkbookPrompt } = await vite.ssrLoadModule("/lib/habit-lab.ts");
  const purchases = parseWorkbookPrompt("Look at your last three purchases. What feeling was I trying to get from each one? **Purchase** **Feeling I Was Trying to Get**");
  assert.deepEqual(purchases.items.map((item) => item.id), ["purchase_1", "feeling_1", "purchase_2", "feeling_2", "purchase_3", "feeling_3", "spending_driver"]);
  const letter = parseWorkbookPrompt("Letter to My Future Self\nTell yourself what you learned.\nDear Future Me,");
  assert.equal(letter.items.length, 1);
  assert.equal(letter.items[0].id, "future_self_letter");
});
