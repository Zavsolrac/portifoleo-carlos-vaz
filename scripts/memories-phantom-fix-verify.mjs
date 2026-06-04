/**
 * Verifies phantom-border fix on #memories during Act III singularity.
 */
import { chromium } from "playwright";
import { writeFileSync, appendFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".cursor", "relic-shots");
const log = join(root, ".cursor", "memories-phantom-fix.log");
mkdirSync(out, { recursive: true });
writeFileSync(log, "", "utf8");
const w = (o) => appendFileSync(log, JSON.stringify(o) + "\n", "utf8");

const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await page.evaluate(() => document.querySelector(".welcome")?.remove());
await page.evaluate(() =>
  document.getElementById("memories")?.scrollIntoView({ block: "center" })
);
await page.waitForTimeout(500);
await page.evaluate(() => {
  const m = document.getElementById("memories");
  if (m) m.dataset.narrativeEntered = "true";
});
await page.waitForTimeout(400);
await page.evaluate(() => {
  document.getElementById("memories")?.classList.add("memories--big-bang");
});
await page.waitForTimeout(1200);

const probe = await page.evaluate(() => {
  const el = document.getElementById("memories");
  const cs = getComputedStyle(el);
  const before = getComputedStyle(el, "::before");
  const after = getComputedStyle(el, "::after");
  const r = el.getBoundingClientRect();
  return {
    overflow: cs.overflow,
    overflowX: cs.overflowX,
    overflowY: cs.overflowY,
    border: cs.border,
    boxShadow: cs.boxShadow,
    background: cs.backgroundColor,
    isolation: cs.isolation,
    bigBangClass: el.classList.contains("memories--big-bang"),
    afterContent: after.content,
    afterPosition: after.position,
    afterDisplay: after.display,
    beforeDisplay: before.display,
    rect: { w: Math.round(r.width), h: Math.round(r.height) },
  };
});
w({ phase: "mid-bigbang", probe });

await page.screenshot({ path: join(out, "memories-mid-bigbang.png"), fullPage: false });
await page.waitForTimeout(2200);
await page.screenshot({ path: join(out, "memories-post-bigbang.png"), fullPage: false });

const verdict = {
  overflowVisible:
    probe.overflow === "visible" ||
    (probe.overflowX === "visible" && probe.overflowY === "visible"),
  noSectionBorder: probe.border.includes("0px") || probe.border === "none",
  flashUsesFixed: probe.afterPosition === "fixed",
  bigBangActive: probe.bigBangClass,
};
w({ verdict });
console.log(JSON.stringify(verdict, null, 2));
await browser.close();
