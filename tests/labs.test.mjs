import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const labSpecs = [
  ["habit", "habit-lab-2026", 1, [1, 23], 55],
  ["decision", "decision-lab-2026", 2, [50, 71], 84],
  ["money", "money-lab-2026", 3, [86, 107], 48],
  ["identity", "identity-lab-2026", 4, [123, 144], 48],
  ["attention", "attention-lab-2026", 5, [159, 180], 48],
  ["time", "time-lab-2026", 6, [196, 217], 48],
  ["risk", "risk-lab-2026", 7, [232, 253], 48],
  ["trust", "trust-lab-2026", 8, [268, 289], 48],
  ["influence", "influence-lab-2026", 9, [304, 326], 48],
  ["leadership", "leadership-lab-2026", 10, [341, 362], 48],
  ["purpose", "purpose-lab-2026", 11, [378, 399], 48],
  ["resilience", "resilience-lab-2026", 12, [414, 435], 48],
];
const labs = labSpecs.map(([slug]) => JSON.parse(readFileSync(new URL(`../data/${slug}-lab.json`, import.meta.url), "utf8")));
const [, decisionLab] = labs;

function validateCartridge(lab) {
  const stepIds = lab.timeline.steps.map((step) => step.id);
  const components = lab.timeline.steps.flatMap((step) => step.components);
  const componentIds = components.map((component) => component.id);
  const allowedTypes = new Set([
    "StoryNarrative",
    "PrivateReflection",
    "LikertMatrix",
    "MindfulBreath",
    "WorkbookChecklist",
    "DailyExperiment",
  ]);

  assert.equal(new Set(stepIds).size, stepIds.length, "step IDs must be unique");
  assert.equal(new Set(componentIds).size, componentIds.length, "component IDs must be unique inside a cartridge");
  assert.ok(components.every((component) => allowedTypes.has(component.type)), "every interaction must use a supported renderer");

  for (const [index, step] of lab.timeline.steps.entries()) {
    for (const prerequisite of step.prerequisites ?? []) {
      assert.ok(stepIds.slice(0, index).includes(prerequisite), `${step.id} must only depend on an earlier milestone`);
    }
  }

  return components;
}

test("publishes all 12 Volume 1 Labs as complete source-versioned cartridges", () => {
  assert.equal(labs.length, 12);
  assert.deepEqual(labs.map((lab) => lab.cartridgeId), labSpecs.map(([, cartridgeId]) => cartridgeId));

  for (const [index, lab] of labs.entries()) {
    const [, cartridgeId, labNumber, pageRange, componentCount] = labSpecs[index];
    const components = validateCartridge(lab);
    const componentIds = new Set(components.map((component) => component.id));

    assert.equal(lab.cartridgeId, cartridgeId);
    assert.equal(lab.version, "3.0.1");
    assert.equal(lab.timeline.steps.length, 11);
    assert.equal(lab.timeline.steps.slice(1, -1).length, 9);
    assert.ok(lab.timeline.steps.slice(1, -1).every((step) => /^Investigation \d+:/.test(step.title)));
    assert.equal(components.length, componentCount);
    assert.equal(lab.beiSchema.length, 10);
    assert.equal(lab.source.document, "BIS Volume 1 v3.pdf");
    assert.equal(lab.source.volume, 1);
    assert.equal(lab.source.labNumber, labNumber);
    assert.deepEqual(lab.source.learnerWorkbookPages, pageRange);
    assert.equal(lab.source.interpretationStatus, "source_faithful_digital_cartridge");
    assert.ok(lab.beiSchema.every((indicator) => indicator.sourceComponentIds.every((id) => componentIds.has(id))));
  }
});

test("uses authored checklist and seven-day controls for every newly digitised Lab", () => {
  for (const lab of labs.slice(2)) {
    const componentTypes = new Set(validateCartridge(lab).map((component) => component.type));
    assert.ok(componentTypes.has("WorkbookChecklist"), `${lab.cartridgeId} must include workbook checklist interactions`);
    assert.ok(componentTypes.has("DailyExperiment"), `${lab.cartridgeId} must include its seven-day experiment`);
  }
});

test("preserves the Decision workbook investigation sequence under the governed claims boundary", () => {
  assert.deepEqual(decisionLab.timeline.steps.map((step) => step.title), [
    "Decision Baseline Check-in (Pre-Workshop)",
    "Investigation 1: The Hook",
    "Investigation 2: The Prediction",
    "Investigation 3: The Revelation",
    "Investigation 4: Decision Mapping",
    "Investigation 5: Decision Equation",
    "Investigation 6: Decision Contract",
    "Investigation 7: 7-Day Experiment",
    "Investigation 8: Evidence Review",
    "Investigation 9: Behaviour Evidence Summary",
    "Decision Lab Completion Certificate",
  ]);

  const sourceText = decisionLab.timeline.steps
    .flatMap((step) => [step.title, ...step.components.map((component) => component.props.markdown ?? component.props.prompt ?? component.props.question ?? "")])
    .join("\n");

  for (const marker of ["Lethabo", "third option", "Decision Equation", "Decision Contract", "7-Day", "BEI-10", "DECISION LAB COMPLETION CERTIFICATE"]) {
    assert.match(sourceText, new RegExp(marker, "i"));
  }
});

test("routes saved work through the selected cartridge boundary", () => {
  const routeSource = readFileSync(new URL("../app/api/lab/route.ts", import.meta.url), "utf8");
  assert.match(routeSource, /body\.cartridgeId/);
  assert.match(routeSource, /eq\(labComponentResponses\.cartridgeId, lab\.cartridgeId\)/);
  assert.match(routeSource, /cartridgeId: lab\.cartridgeId/);
});
