import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const portalSource = await readFile(`${root}/components/bis/PortalExperience.tsx`, "utf8");
const portalCss = await readFile(`${root}/app/portal/portal.css`, "utf8");

test("uses a bounded Lab selector instead of a twelve-item page-width rail", () => {
  assert.doesNotMatch(portalSource, /today-lab-switcher/);
  assert.match(portalSource, /className="today-lab-controller"/);
  assert.match(portalSource, /<Select value=\{lab\.cartridgeId\} onValueChange=\{onChangeLab\}>/);
  assert.match(portalSource, /publishedLabs\.map\(\(candidate, index\)/);
  assert.match(portalCss, /\.today-lab-controller \{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(270px,360px\)/);
  assert.match(portalCss, /@media \(max-width:760px\) \{[\s\S]*?\.today-lab-controller \{[^}]*grid-template-columns:1fr/);
});

test("keeps the application canvas inside the viewport", () => {
  assert.match(portalCss, /html,\s*\nbody \{ width:100%; max-width:100%; overflow-x:hidden; \}/);
  assert.match(portalCss, /\.quiet-workspace,[\s\S]*?\.lab-interaction \{ min-width:0; max-width:100%; \}/);
  assert.match(portalCss, /\.quiet-shell :where\(input,textarea,select,button\) \{ min-width:0; max-width:100%; \}/);
});

test("Marketplace supports scalable release-state filtering and a responsive library summary", () => {
  assert.match(portalSource, /availability, setAvailability/);
  assert.match(portalSource, /matchesAvailability/);
  assert.match(portalSource, /className="marketplace-release-strip"/);
  assert.match(portalSource, /className="marketplace-library-metrics"/);
  assert.match(portalCss, /\.marketplace-categories \{ display:flex; flex-wrap:wrap; overflow:visible; \}/);
  assert.match(portalCss, /\.marketplace-library-metrics \{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});
