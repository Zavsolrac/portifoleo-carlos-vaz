/* Verify the upgraded galaxy-portal canvas:
   - canvas exists, is animating (pixels change between frames)
   - non-blank (lots of lit pixels), centred bright core
   - hover lifts intensity (more lit pixels)
   - reduced-motion renders a static, non-blank composition
   Captures dark + light + reduced-motion + hover screenshots. */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out  = join(root, ".cursor", "relic-shots");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const browser = await chromium.launch({ headless: true });

async function prep(page, theme) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());
  await page.evaluate(() => document.querySelectorAll(".merlin, .domains").forEach((n) => n.remove()));
  if (theme === "light") {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => {
    document.getElementById("portal")?.setAttribute("data-narrative-entered", "true");
    document.querySelectorAll("#portal .reveal").forEach((n) => n.classList.add("is-visible"));
  });
  await page.evaluate(() => document.getElementById("portal")?.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(900);
}

// pixel stats inside the canvas
async function canvasStats(page) {
  return page.evaluate(() => {
    const c = document.getElementById("portal-canvas");
    const ctx = c.getContext("2d");
    const { width, height } = c;
    const img = ctx.getImageData(0, 0, width, height).data;
    let lit = 0, sum = 0;
    for (let i = 0; i < img.length; i += 4) {
      const a = img[i + 3];
      const lum = (img[i] + img[i + 1] + img[i + 2]) / 3;
      if (a > 8 && lum > 16) lit++;
      sum += lum * (a / 255);
    }
    // centre brightness (core)
    const cx = (width / 2) | 0, cy = (height / 2) | 0;
    const ci = (cy * width + cx) * 4;
    const coreLum = (img[ci] + img[ci + 1] + img[ci + 2]) / 3;
    return {
      width, height,
      litFraction: +(lit / (width * height / 4)).toFixed(4),
      avgLum: +(sum / (width * height / 4)).toFixed(2),
      coreLum: Math.round(coreLum),
    };
  });
}

/* ── DARK · animation check ── */
let page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await prep(page, "dark");

const frameA = await page.evaluate(() => {
  const c = document.getElementById("portal-canvas");
  return c.getContext("2d").getImageData(c.width / 2 - 40, c.height / 2 - 40, 80, 80).data.join(",");
});
await page.waitForTimeout(600);
const frameB = await page.evaluate(() => {
  const c = document.getElementById("portal-canvas");
  return c.getContext("2d").getImageData(c.width / 2 - 40, c.height / 2 - 40, 80, 80).data.join(",");
});
const stats = await canvasStats(page);
console.log("DARK stats", JSON.stringify(stats));
console.log("ANIMATING", frameA !== frameB);

await page.locator(".portal__stage").screenshot({ path: join(out, "portal-galaxy-dark.png") });

// hover intensity
await page.locator(".portal__stage").hover();
await page.waitForTimeout(900);
const statsHover = await canvasStats(page);
console.log("HOVER stats", JSON.stringify(statsHover), "brighter:", statsHover.avgLum >= stats.avgLum);
await page.locator(".portal__stage").screenshot({ path: join(out, "portal-galaxy-hover.png") });
await page.close();

/* ── LIGHT ── */
page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await prep(page, "light");
await page.locator(".portal__stage").screenshot({ path: join(out, "portal-galaxy-light.png") });
await page.close();

/* ── REDUCED MOTION ── */
page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
await prep(page, "dark");
const rmStats = await canvasStats(page);
console.log("REDUCED MOTION stats", JSON.stringify(rmStats), "nonBlank:", rmStats.litFraction > 0.05);
await page.locator(".portal__stage").screenshot({ path: join(out, "portal-galaxy-reduced.png") });
await page.close();

/* ── MOBILE ── */
page = await browser.newPage({ viewport: { width: 414, height: 850 } });
await prep(page, "dark");
await page.locator(".portal__stage").screenshot({ path: join(out, "portal-galaxy-mobile.png") });
await page.close();

await browser.close();
