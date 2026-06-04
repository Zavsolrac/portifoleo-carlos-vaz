/* Quick mobile geometry probe for the portal section. */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".cursor", "relic-shots");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 414, height: 850 } });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
await page.evaluate(() => document.querySelector(".welcome")?.remove());
await page.evaluate(() => document.querySelectorAll(".merlin")?.forEach((n) => n.remove()));
await page.evaluate(() => document.getElementById("portal")?.scrollIntoView({ block: "start" }));
// Wait for the IntersectionObserver-driven reveal (.reveal → .is-visible)
// to add the visible class and the opacity 0.7s transition to complete.
await page.waitForTimeout(1500);
await page.evaluate(() =>
  document.querySelector(".portal__stage")?.classList.add("is-visible")
);
await page.waitForTimeout(900);

const geom = await page.evaluate(() => {
  const sec = document.getElementById("portal");
  const stage = document.querySelector(".portal__stage");
  const links = document.querySelector(".portal__links");
  const cards = Array.from(document.querySelectorAll(".portal__link"));
  const grab = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
      display: cs.display,
      gridCols: cs.gridTemplateColumns,
      visibility: cs.visibility,
      opacity: cs.opacity,
    };
  };
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight, scrollY: window.scrollY, docH: document.documentElement.scrollHeight },
    section: grab(sec),
    stage: grab(stage),
    links: grab(links),
    cards: cards.map((c, i) => ({ i, channel: c.dataset.channel, ...grab(c) })),
  };
});
console.log(JSON.stringify(geom, null, 2));

// Full page screenshot of the portal area
await page.evaluate(() => document.getElementById("portal")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(400);
await page.screenshot({ path: join(out, "portal-mobile-fullpage.png"), fullPage: false });
await browser.close();
