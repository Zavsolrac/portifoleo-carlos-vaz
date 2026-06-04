/* Post-fix vault stability probe — opens tour, waits 2s, checks backdrop
   filter, scene pause, and card position jitter. */
import { chromium } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelector(".welcome")?.remove());

const probe = await page.evaluate(async () => {
  window.Crystals.openTour();
  /* Wait past summon (0.85s) into steady float phase */
  await new Promise((r) => setTimeout(r, 1200));
  const card = document.querySelector(".crystal-vault .relic-card");
  const frame = document.querySelector(".crystal-vault .relic-card__frame");
  const bd = document.getElementById("crystal-vault-backdrop");
  const csBd = bd ? getComputedStyle(bd) : null;
  const csCard = card ? getComputedStyle(card) : null;
  const csFrame = frame ? getComputedStyle(frame) : null;
  const tops = [], frameTops = [];
  for (let i = 0; i < 90; i++) {
    tops.push(card ? +card.getBoundingClientRect().top.toFixed(2) : null);
    frameTops.push(frame ? +frame.getBoundingClientRect().top.toFixed(2) : null);
    await new Promise((r) => requestAnimationFrame(r));
  }
  function stats(arr) {
    let maxJump = 0, dirChanges = 0, prev = null, prevDelta = 0;
    for (const t of arr) {
      if (t == null) continue;
      if (prev != null) {
        const d = t - prev;
        if (Math.abs(d) > maxJump) maxJump = Math.abs(d);
        if (prevDelta !== 0 && Math.sign(d) !== Math.sign(prevDelta) && Math.abs(d) > 0.3) dirChanges++;
        prevDelta = d;
      }
      prev = t;
    }
    const valid = arr.filter((x) => x != null);
    return {
      maxFrameJump: +maxJump.toFixed(2),
      dirChanges,
      topRange: valid.length ? +(Math.max(...valid) - Math.min(...valid)).toFixed(2) : 0,
    };
  }
  return {
    backdropFilter: csBd ? (csBd.backdropFilter || csBd.webkitBackdropFilter) : null,
    cardAnim: csCard?.animationName,
    frameAnim: csFrame?.animationName,
    vaultOpen: document.querySelector(".crystal-vault.is-open") != null,
    card: stats(tops),
    frame: stats(frameTops),
  };
});

console.log(JSON.stringify(probe, null, 2));
await browser.close();
