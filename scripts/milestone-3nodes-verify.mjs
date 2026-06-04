/* Verify the 3-distinct-node portrait milestone + new banner text.
   Two independent checks:
   A) Click-on-detect: scan the constellation; the instant the tree
      reports a node under the cursor (cursor:pointer), click it right
      there (no delay → no gravity drift). Stop when the milestone fires.
   B) Banner text: also assert the displayed banner reads the new copy. */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".cursor", "milestone-shots");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const b = await chromium.launch({ headless: true });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
await page.evaluate(() => {
  document.querySelector(".welcome")?.remove();
  try { localStorage.removeItem("cv-skilltree-milestone-3"); } catch {}
  window.__msFired = false; window.__msDetail = null; window.__clicks = 0;
  window.addEventListener("cv-milestone-8skills", (e) => { window.__msFired = true; window.__msDetail = e.detail || null; });
});

let fired = false;
let clicks = 0;
scan:
for (let y = 150; y <= 760; y += 20) {
  for (let x = 260; x <= 1200; x += 20) {
    await page.mouse.move(x, y);
    const isNode = await page.evaluate(() => document.body.style.cursor === "pointer");
    if (!isNode) continue;
    await page.mouse.down();
    await page.mouse.up();
    clicks++;
    fired = await page.evaluate(() => window.__msFired);
    if (fired) { console.log(`milestone fired after clicking node #${clicks} at (${x},${y})`); break scan; }
    // nudge away so we re-detect a fresh node next time
    await page.mouse.move(x + 40, y + 40);
  }
}
const detail = await page.evaluate(() => window.__msDetail);
console.log("A) clickFired:", fired, "totalNodeClicks:", clicks, "detail:", JSON.stringify(detail));
if (fired) {
  await page.waitForTimeout(900);
  const banner = await page.evaluate(() => {
    const el = document.querySelector(".milestone-banner__text");
    return el ? el.textContent.trim() : "(no banner)";
  });
  console.log("A) banner text:", JSON.stringify(banner));
  await page.screenshot({ path: join(out, "milestone-fired.png") });
}

// B) independent banner-text check via direct event (locale = pt)
const page2 = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page2.goto(url, { waitUntil: "domcontentloaded" });
await page2.waitForTimeout(800);
const banner2 = await page2.evaluate(async () => {
  document.querySelector(".welcome")?.remove();
  window.dispatchEvent(new CustomEvent("cv-milestone-8skills", { detail: { count: 3 } }));
  await new Promise((r) => setTimeout(r, 500));
  const el = document.querySelector(".milestone-banner__text");
  return el ? el.textContent.trim() : "(no banner)";
});
console.log("B) banner text (direct):", JSON.stringify(banner2));
await page2.close();

await b.close();
console.log("done");
