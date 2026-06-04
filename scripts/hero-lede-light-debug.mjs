/* Debug the light-theme forged-metal lede: capture the full hero
   and inspect the lede's actual rect, opacity, fill, and parent
   stacking context so we know why the previous probe came back
   empty. */
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
await page.waitForTimeout(1200);
await page.evaluate(() => document.querySelector(".welcome")?.remove());
await page.evaluate(() => document.querySelectorAll(".merlin")?.forEach((n) => n.remove()));
await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
await page.waitForTimeout(500);
await page.evaluate(() => {
  const lede = document.querySelector(".hero__lede");
  if (lede) lede.style.opacity = "1";
});
await page.evaluate(() =>
  document.querySelector(".hero__lede")?.scrollIntoView({ block: "center" })
);
await page.waitForTimeout(600);

const info = await page.evaluate(() => {
  const el = document.querySelector(".hero__lede");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return {
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    opacity: cs.opacity,
    visibility: cs.visibility,
    display: cs.display,
    textContent: el.textContent.trim().slice(0, 80),
    background: cs.backgroundImage.slice(0, 180),
    fontSize: cs.fontSize,
    fontFamily: cs.fontFamily.slice(0, 60),
  };
});
console.log("LIGHT LEDE INFO", JSON.stringify(info, null, 2));

// Full hero capture
await page.screenshot({
  path: join(out, "hero-lede-light-full.png"),
  clip: { x: 0, y: 0, width: 1366, height: 900 },
});

// Tight crop centred on the lede with generous padding
if (info && info.rect.w > 0) {
  await page.screenshot({
    path: join(out, "hero-lede-light-tight.png"),
    clip: {
      x: Math.max(0, Math.round(info.rect.x - 40)),
      y: Math.max(0, Math.round(info.rect.y - 30)),
      width: Math.min(1366, Math.round(info.rect.w + 80)),
      height: Math.min(900,  Math.round(info.rect.h + 60)),
    },
  });
}

await browser.close();
