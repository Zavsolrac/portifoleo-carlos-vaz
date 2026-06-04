/* Inspect alignment of the two portal columns.
   We probe rects of:
     - .portal__column        (the columns themselves)
     - .portal__column-head   (flags + title + rule)
     - .portal__column-flags  (the flag rows)
     - .portal__column-title  (the i18n titles)
     - .portal__column-rule   (the hairline rule)
     - .portal__links         (the cards list)
   so we know which row is the misaligned one. */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out  = join(root, ".cursor", "relic-shots");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);
await page.evaluate(() => document.querySelector(".welcome")?.remove());
await page.evaluate(() => document.querySelectorAll(".merlin")?.forEach((n) => n.remove()));
await page.evaluate(() => {
  document.getElementById("portal")?.setAttribute("data-narrative-entered", "true");
  document
    .querySelectorAll("#portal .reveal")
    .forEach((n) => n.classList.add("is-visible"));
});
await page.evaluate(() =>
  document.getElementById("portal")?.scrollIntoView({ block: "center" })
);
await page.waitForTimeout(700);

const probe = await page.evaluate(() => {
  const grab = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      lh: cs.lineHeight,
      ml: cs.marginLeft,
      mt: cs.marginTop,
      mb: cs.marginBottom,
    };
  };
  const cols = Array.from(document.querySelectorAll(".portal__column"));
  return cols.map((col) => ({
    region: col.dataset.region,
    column: grab(col),
    head: grab(col.querySelector(".portal__column-head")),
    flags: grab(col.querySelector(".portal__column-flags")),
    flagCount: col.querySelectorAll(".portal__flag").length,
    title: grab(col.querySelector(".portal__column-title")),
    titleText: col.querySelector(".portal__column-title")?.textContent.trim(),
    rule: grab(col.querySelector(".portal__column-rule")),
    links: grab(col.querySelector(".portal__links")),
  }));
});
console.log(JSON.stringify(probe, null, 2));

// Use locator screenshot which auto-scrolls — page coordinates
// are way past viewport (y > 7000) so a clip-based shot fails.
await page
  .locator(".portal__columns")
  .screenshot({ path: join(out, "portal-align-after.png") });

const verdict = (() => {
  if (probe.length !== 2) return { ok: false, reason: "expected 2 columns" };
  const [a, b] = probe;
  return {
    columnTopsAligned:   a.column.y === b.column.y,
    linksTopsAligned:    a.links.y === b.links.y,
    rulesTopsAligned:    a.rule.y  === b.rule.y,
    headHeightsEqual:    a.head.h  === b.head.h,
    deltaLinksTop:       Math.abs(a.links.y - b.links.y),
    deltaRuleTop:        Math.abs(a.rule.y  - b.rule.y),
    deltaHeadHeight:     Math.abs(a.head.h  - b.head.h),
  };
})();
console.log("VERDICT", JSON.stringify(verdict, null, 2));
await browser.close();
