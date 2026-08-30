import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });

after(async () => {
  await vite.close();
});

function filesUnder(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

test("governs all Habit and Decision indicators with versioned source provenance", async () => {
  const { habitLab } = await vite.ssrLoadModule("/lib/habit-lab.ts");
  const { decisionLab } = await vite.ssrLoadModule("/lib/lab-catalog.ts");
  const { BIS_MEASUREMENT_MANUAL_VERSION, validateMeasurementRegistry } = await vite.ssrLoadModule("/lib/measurement.ts");

  for (const lab of [habitLab, decisionLab]) {
    assert.equal(lab.measurement.manualVersion, BIS_MEASUREMENT_MANUAL_VERSION);
    assert.equal(lab.measurement.modelStatus, "descriptive_evidence");
    assert.equal(lab.beiSchema.length, 10);
    assert.deepEqual(validateMeasurementRegistry(lab), []);
    for (const indicator of lab.beiSchema) {
      assert.equal(indicator.reportingStatus, "descriptive_only");
      assert.ok(indicator.scoringRule.length > 20);
      assert.ok(indicator.interpretationLimit.length > 20);
      assert.ok(indicator.sourceComponentIds.length > 0);
    }
  }
});

test("uses the source-faithful binary seven-day practice record", async () => {
  const { publishedLabs } = await vite.ssrLoadModule("/lib/lab-catalog.ts");
  for (const lab of publishedLabs) {
    const component = lab.timeline.steps.flatMap((step) => step.components).find((candidate) => candidate.id === "comp_exp_matrix");
    assert.deepEqual(component.props.labels, ["Not done", "Done"]);
    assert.deepEqual(component.props.values, [0, 1]);
    const definition = lab.beiSchema.find((indicator) => indicator.code === "BEI-06");
    assert.deepEqual(definition.range, [0, 1]);
    assert.equal(definition.evidenceClass, "practice_record");
  }
});

test("calculates only approved learner-reported pre/post differences", async () => {
  const { habitLab } = await vite.ssrLoadModule("/lib/habit-lab.ts");
  const { pairedSelfReportChange } = await vite.ssrLoadModule("/lib/measurement.ts");
  const responses = [
    { componentId: "comp_baseline_index", isComplete: true, payload: { beiScore: 4 } },
    { componentId: "comp_review_bei07", isComplete: true, payload: { beiScore: 7 } },
    { componentId: "comp_eq_confidence", isComplete: true, payload: { beiScore: 5 } },
    { componentId: "comp_review_bei08", isComplete: true, payload: { beiScore: 6 } },
  ];
  const changes = pairedSelfReportChange(habitLab, responses);
  assert.equal(changes.length, 2);
  assert.deepEqual(changes.map((change) => change.difference), [3, 1]);
  assert.ok(changes.every((change) => /no causal/i.test(change.interpretation)));
});

test("publishes the exact 32-Lab architecture and three delivery skins", async () => {
  const { deliverySkins, productFamilies, productLabs } = await vite.ssrLoadModule("/lib/product-architecture.ts");
  assert.equal(productLabs.length, 32);
  assert.equal(productLabs.filter((lab) => lab.status === "available").length, 2);
  assert.deepEqual(productFamilies.map((family) => family.labs.length), [8, 11, 10, 3]);
  assert.deepEqual(Object.keys(deliverySkins).sort(), ["school", "workplace", "youth_programme"]);
});

test("keeps known overclaims out of active product copy and cartridge content", () => {
  const roots = ["app", "components", "data", "lib"].flatMap((directory) => filesUnder(join(root, directory)));
  const source = roots.filter((path) => /\.(tsx?|json)$/.test(path)).map((path) => readFileSync(path, "utf8")).join("\n");
  for (const phrase of [
    "a forensic marker of behavioural change",
    "psychometrically credible",
    "validated measurement architecture",
    "Evidence, not opinion",
    "Growth is becoming visible",
    "Observations appear only when the evidence is strong enough",
    "Transformation Certificate",
  ]) assert.doesNotMatch(source, new RegExp(phrase, "i"));
});

test("server-stamps evidence provenance and reports participation separately", () => {
  const labRoute = readFileSync(new URL("../app/api/lab/route.ts", import.meta.url), "utf8");
  const dashboardRoute = readFileSync(new URL("../app/api/dashboard/route.ts", import.meta.url), "utf8");
  assert.match(labRoute, /measurementVersion/);
  assert.match(labRoute, /evidenceClass/);
  assert.match(dashboardRoute, /participation:/);
  assert.match(dashboardRoute, /behaviouralEvidence:/);
  assert.match(dashboardRoute, /automatedScoring: false/);
  assert.doesNotMatch(dashboardRoute, /totalPossible/);
});
