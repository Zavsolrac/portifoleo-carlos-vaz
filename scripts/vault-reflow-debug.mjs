/* Diagnose vault layout reflow — track stage, core, card during open */
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

const samples = await page.evaluate(async () => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      top: +r.top.toFixed(1),
      h: +r.height.toFixed(1),
      transform: (cs.transform || "none").slice(0, 40),
      transition: cs.transitionProperty,
    };
  };
  const log = [];
  window.Crystals.openTour();
  for (let i = 0; i < 100; i++) {
    log.push({
      f: i,
      stage: pick(".crystal-vault__stage"),
      core: pick(".crystal-vault__core"),
      card: pick(".crystal-vault .relic-card"),
      frame: pick(".crystal-vault .relic-card__frame"),
    });
    await new Promise((r) => requestAnimationFrame(r));
  }
  /* steady state after 2.5s */
  await new Promise((r) => setTimeout(r, 2500));
  const steady = [];
  for (let i = 0; i < 60; i++) {
    steady.push({ f: i, cardTop: pick(".crystal-vault .relic-card")?.top });
    await new Promise((r) => requestAnimationFrame(r));
  }
  let maxJ = 0;
  for (let i = 1; i < steady.length; i++) {
    const d = Math.abs(steady[i].cardTop - steady[i - 1].cardTop);
    if (d > maxJ) maxJ = d;
  }
  return { openPhase: log.filter((_, i) => i % 10 === 0), steadyMaxJump: +maxJ.toFixed(2), steadyRange: +(Math.max(...steady.map((s) => s.cardTop)) - Math.min(...steady.map((s) => s.cardTop))).toFixed(2) };
});

console.log(JSON.stringify(samples, null, 2));
await browser.close();
