/* Verify the new 2018 chronicle renders before 2019 across all locales. */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out  = join(root, ".cursor", "relic-shots");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const expected = {
  pt: "Técnico em Meio Ambiente",
  gl: "Técnico en Medio Ambiente",
  es: "Técnico en Medio Ambiente",
  en: "Environmental Technician",
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);
await page.evaluate(() => document.querySelector(".welcome")?.remove());
// Force the codex overlay open so the chronicles section is laid out
await page.evaluate(() => {
  const codex = document.querySelector(".codex");
  if (codex) {
    codex.classList.add("is-open");
    codex.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("is-codex-open");
  }
});
await page.waitForTimeout(600);

const results = {};
for (const lang of ["pt", "gl", "es", "en"]) {
  await page.evaluate((l) => window.I18n?.setLang?.(l), lang);
  await page.waitForTimeout(350);
  // Scroll to the chronicles section
  await page.evaluate(() => document.querySelector(".codex__chronicles")?.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(400);
  const probe = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll(".codex__chronicles ol > li"));
    return items.map((li) => ({
      year: li.querySelector("time")?.textContent.trim(),
      body: li.querySelector("p")?.textContent.trim().replace(/\s+/g, " "),
    }));
  });
  results[lang] = probe;

  try {
    const box = await page.evaluate(() => {
      const el = document.querySelector(".codex__chronicles");
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.max(0, Math.round(r.x)),
        y: Math.max(0, Math.round(r.y)),
        w: Math.min(window.innerWidth - Math.max(0, Math.round(r.x)), Math.round(r.width)),
        h: Math.min(window.innerHeight - Math.max(0, Math.round(r.y)), Math.round(r.height)),
      };
    });
    if (box && box.w > 0 && box.h > 0) {
      await page.screenshot({
        path: join(out, `chronicles-${lang}.png`),
        clip: { x: box.x, y: box.y, width: box.w, height: box.h },
      });
    }
  } catch (e) { console.warn("shot", lang, String(e).slice(0, 120)); }
}

const verdict = {};
for (const lang of ["pt", "gl", "es", "en"]) {
  const r = results[lang];
  const first2018 = r[0];
  verdict[lang] = {
    firstYearIs2018: first2018?.year === "2018",
    secondYearIs2019: r[1]?.year === "2019",
    yearsInOrder: r.map((x) => x.year).join(",") === "2018,2019,2020,2021,2022,2023,2024,2025,2026",
    bodyContainsExpected: (first2018?.body || "").includes(expected[lang]),
  };
}
console.log(JSON.stringify({ results, verdict }, null, 2));
await browser.close();
