/* Mobile responsiveness audit — screenshots every major section at
   two common phone widths, plus the open crystal vault, and probes
   for horizontal overflow (a classic mobile bug). */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".cursor", "relic-shots", "mobile");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const devices = [
  { tag: "iphone12", width: 390, height: 844 },
  { tag: "androidsm", width: 360, height: 800 },
];

const browser = await chromium.launch({ headless: true });

for (const d of devices) {
  const page = await browser.newPage({
    viewport: { width: d.width, height: d.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());

  // Horizontal overflow probe
  const overflow = await page.evaluate(() => {
    const de = document.documentElement;
    const scrollW = de.scrollWidth;
    const clientW = de.clientWidth;
    const offenders = [];
    document.querySelectorAll("section, div, header, footer, aside, ul, article").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > clientW + 1 || r.left < -1) {
        if (r.width > 30) {
          offenders.push({
            cls: (el.className || "").toString().slice(0, 40),
            left: Math.round(r.left),
            right: Math.round(r.right),
            w: Math.round(r.width),
          });
        }
      }
    });
    return { scrollW, clientW, hasOverflow: scrollW > clientW + 1, offenders: offenders.slice(0, 12) };
  });
  console.log(d.tag, "OVERFLOW", JSON.stringify(overflow, null, 1));

  const sections = ["hero", "knowledge", "memories", "contracts", "portal"];
  for (const id of sections) {
    const exists = await page.evaluate((sid) => !!document.getElementById(sid), id);
    if (!exists) continue;
    await page.evaluate((sid) => {
      document.getElementById(sid)?.setAttribute("data-narrative-entered", "true");
      document.querySelectorAll(`#${sid} .reveal`).forEach((n) => n.classList.add("is-visible"));
      document.getElementById(sid)?.scrollIntoView({ block: "start" });
    }, id);
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(out, `${d.tag}-${id}.png`) });
  }

  // Open the crystal vault (tour) on mobile
  await page.evaluate(() => window.Crystals?.openTour?.());
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(out, `${d.tag}-vault.png`) });

  await page.close();
}

await browser.close();
console.log("DONE");
