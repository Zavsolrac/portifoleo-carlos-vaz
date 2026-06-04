/* Verify the new 2-column portal: regional headers, flags, tints,
   tight card sizing, hover behaviour, mobile stacking. */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out  = join(root, ".cursor", "relic-shots");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const browser = await chromium.launch({ headless: true });

async function capture(tag, { width, height, theme, lang }) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());
  await page.evaluate(() => document.querySelectorAll(".merlin")?.forEach((n) => n.remove()));
  if (theme === "light") {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    await page.waitForTimeout(250);
  }
  if (lang) {
    await page.evaluate((l) => window.I18n?.setLang?.(l), lang);
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => document.getElementById("portal")?.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector(".portal__stage")?.classList.add("is-visible"));
  await page.waitForTimeout(700);
  await page.evaluate(() => document.querySelector(".portal__columns")?.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(500);

  const probe = await page.evaluate(() => {
    const cols = Array.from(document.querySelectorAll(".portal__column"));
    return cols.map((col) => {
      const title = col.querySelector(".portal__column-title");
      const flags = col.querySelectorAll(".portal__flag");
      const cards = Array.from(col.querySelectorAll(".portal__link"));
      const cardR = cards[0]?.getBoundingClientRect();
      const cs = getComputedStyle(col);
      return {
        region: col.dataset.region,
        titleText: title?.textContent.trim(),
        titleColor: title ? getComputedStyle(title).color : null,
        flagCount: flags.length,
        cardCount: cards.length,
        cardWidth: cardR ? Math.round(cardR.width) : null,
        cardHrefs: cards.map((c) => c.getAttribute("href")),
        cardLabels: cards.map((c) => c.querySelector(".portal__link-label")?.textContent.trim()),
        accent: cs.getPropertyValue("--col-accent").trim(),
      };
    });
  });
  console.log(tag, JSON.stringify(probe, null, 2));

  const box = await page.evaluate(() => {
    const el = document.querySelector(".portal__columns");
    const r = el.getBoundingClientRect();
    const pad = 30;
    return {
      x: Math.max(0, Math.round(r.x - pad)),
      y: Math.max(0, Math.round(r.y - pad)),
      width: Math.min(window.innerWidth, Math.round(r.width + pad * 2)),
      height: Math.min(window.innerHeight, Math.round(r.height + pad * 2)),
    };
  });
  if (box.width > 0 && box.height > 0) {
    await page.screenshot({ path: join(out, `portal-columns-${tag}.png`), clip: box });
  }

  // Hover an Atlantic card and an Iberian card to confirm the column glow takes over
  if (tag === "dark") {
    for (const region of ["atlantic", "iberian"]) {
      await page.mouse.move(0, 0);
      await page.waitForTimeout(200);
      const sel = `.portal__column[data-region="${region}"] .portal__link[data-channel="whatsapp"]`;
      await page.locator(sel).hover({ force: true });
      await page.waitForTimeout(800);
      const glow = await page.evaluate((s) => {
        const el = document.querySelector(s);
        const before = getComputedStyle(el, "::before");
        return {
          beforeOpacity: parseFloat(before.opacity),
          beforeBg: before.backgroundImage.slice(0, 200),
        };
      }, sel);
      console.log(`${region} hover glow`, JSON.stringify(glow));
      const cardBox = await page.evaluate((s) => {
        const r = document.querySelector(s).getBoundingClientRect();
        return { x: Math.round(r.x - 30), y: Math.round(r.y - 30), width: Math.round(r.width + 60), height: Math.round(r.height + 60) };
      }, sel);
      await page.screenshot({ path: join(out, `portal-${region}-hover.png`), clip: cardBox });
    }
  }

  await page.close();
  return probe;
}

await capture("dark",   { width: 1366, height: 900, theme: "dark"  });
await capture("light",  { width: 1366, height: 900, theme: "light" });
await capture("mobile", { width: 414,  height: 850, theme: "dark"  });
await capture("en",     { width: 1366, height: 900, theme: "dark", lang: "en" });

await browser.close();
