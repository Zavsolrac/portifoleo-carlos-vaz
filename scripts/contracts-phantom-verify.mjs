/* Captures the #contracts header area before/after toggling the
   .contracts::before pseudo to confirm it is the phantom-border source. */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".cursor", "relic-shots");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);
await page.evaluate(() => document.querySelector(".welcome")?.remove());
await page.evaluate(() => document.querySelectorAll(".merlin")?.forEach((n) => n.remove()));
await page.evaluate(() => {
  document.getElementById("contracts")?.scrollIntoView({ block: "start" });
  // Force narrative entered so reveal animations finish
  document.getElementById("contracts")?.setAttribute("data-narrative-entered", "true");
  document.querySelectorAll(".contracts__head, .contract, .reveal")
    .forEach((el) => el.classList.add("is-visible"));
});
await page.waitForTimeout(1600);

const debug = await page.evaluate(() => {
  const sec = document.getElementById("contracts");
  const head = document.querySelector(".contracts__head");
  const r1 = sec?.getBoundingClientRect();
  const r2 = head?.getBoundingClientRect();
  return {
    sectionExists: !!sec,
    sectionRect: r1 && { x: r1.x, y: r1.y, w: r1.width, h: r1.height },
    headRect: r2 && { x: r2.x, y: r2.y, w: r2.width, h: r2.height },
    viewport: { w: window.innerWidth, h: window.innerHeight, scrollY: window.scrollY, docH: document.documentElement.scrollHeight },
    secDisplay: sec ? getComputedStyle(sec).display : null,
  };
});
console.log("DEBUG", JSON.stringify(debug, null, 2));

const headBox = await page.evaluate(() => {
  const sec = document.getElementById("contracts");
  if (!sec) return null;
  const r = sec.getBoundingClientRect();
  const x = Math.max(0, Math.round(r.x));
  const y = Math.max(0, Math.round(r.y));
  const w = Math.min(window.innerWidth - x, Math.round(r.width));
  const h = Math.min(window.innerHeight - Math.max(0, y), 520);
  if (w <= 0 || h <= 0) return null;
  return { x, y: Math.max(0, y), width: w, height: h };
});
if (!headBox) {
  console.error("contracts section not visible in viewport");
  await browser.close();
  process.exit(2);
}

await page.screenshot({
  path: join(out, "contracts-head-FIXED.png"),
  clip: { x: headBox.x, y: headBox.y, width: headBox.width, height: headBox.height },
});

// Probe computed style of the pseudo to confirm the fix
const pseudoState = await page.evaluate(() => {
  const before = getComputedStyle(document.querySelector(".contracts"), "::before");
  return {
    content: before.content,
    display: before.display,
    background: before.background.slice(0, 80),
    backgroundImage: before.backgroundImage,
  };
});
console.log("PSEUDO STATE", JSON.stringify(pseudoState, null, 2));

// Also test the LIGHT theme to make sure the fix carries over
await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
await page.waitForTimeout(450);
await page.screenshot({
  path: join(out, "contracts-head-FIXED-light.png"),
  clip: { x: headBox.x, y: headBox.y, width: headBox.width, height: headBox.height },
});
const pseudoLight = await page.evaluate(() => {
  const before = getComputedStyle(document.querySelector(".contracts"), "::before");
  return {
    content: before.content,
    display: before.display,
    backgroundImage: before.backgroundImage,
  };
});
console.log("PSEUDO STATE (light)", JSON.stringify(pseudoLight, null, 2));

console.log("Captured before/after at", headBox);
await browser.close();
