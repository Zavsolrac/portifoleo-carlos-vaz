/**
 * Post-fix verification for the Carlos Vaz hero name update:
 *  - particle "form-text" mode must NOT activate in Act I
 *  - .hero__letter must render with the magma gradient
 *    (background-clip: text + transparent text fill)
 *  - the gap between "Carlos" and "Vaz" must be tighter than before
 *  - welcome-char-lava animation must be present on .hero__letter
 *
 * Writes NDJSON to .cursor/debug-bc6917.log for the debug session.
 */
import { chromium } from "playwright";
import { writeFileSync, appendFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir   = dirname(fileURLToPath(import.meta.url));
const root    = join(__dir, "..");
const logPath = join(root, ".cursor", "debug-bc6917.log");
const indexUrl = "file:///" + join(root, "index.html").replace(/\\/g, "/");
function logLine(o) { appendFileSync(logPath, JSON.stringify(o) + "\n", "utf8"); }
writeFileSync(logPath, "", "utf8");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

// Capture all NarrativeParticles internal state by patching after load
await page.addInitScript(() => {
  window.__VBA_TRACE = { setModeCalls: [] };
});

await page.goto(indexUrl, { waitUntil: "domcontentloaded" });
// Skip the welcome overlay so the hero animation triggers
await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector(".welcome")?.classList.add("is-done", "is-leaving"));
await page.evaluate(() => document.querySelector(".welcome")?.remove());
await page.waitForTimeout(1200);

const probe = await page.evaluate(() => {
  function colorFromRect(rect, ctx) { return null; }

  const html = document.documentElement;
  const hero = document.getElementById("hero");
  const headline = document.getElementById("hero-headline");
  const first = document.querySelector(".hero__name-first");
  const last  = document.querySelector(".hero__name-last");
  const letters = Array.from(document.querySelectorAll(".hero__letter"));

  const csName  = headline ? getComputedStyle(headline) : null;
  const csFirst = first ? first.getBoundingClientRect() : null;
  const csLast  = last  ? last.getBoundingClientRect()  : null;

  const gap = csFirst && csLast ? Math.round(csLast.top - csFirst.bottom) : null;

  const letterStyles = letters.slice(0, 3).map((el) => {
    const cs = getComputedStyle(el);
    return {
      tag: el.textContent,
      backgroundImage: cs.backgroundImage.slice(0, 90),
      backgroundClip: cs.backgroundClip || cs.webkitBackgroundClip,
      webkitTextFillColor: cs.webkitTextFillColor,
      color: cs.color,
      animationName: cs.animationName,
      animationDuration: cs.animationDuration,
      animationDelay: cs.animationDelay,
      lineHeight: cs.lineHeight,
      opacity: cs.opacity,
    };
  });

  return {
    narrativeAct: html.getAttribute("data-narrative-act"),
    heroEntered: hero?.getAttribute("data-narrative-entered"),
    headlineLineHeight: csName?.lineHeight,
    headlineFontSize: csName?.fontSize,
    rectFirst: csFirst ? { top: Math.round(csFirst.top), bottom: Math.round(csFirst.bottom), h: Math.round(csFirst.height) } : null,
    rectLast:  csLast  ? { top: Math.round(csLast.top),  bottom: Math.round(csLast.bottom),  h: Math.round(csLast.height) }  : null,
    gapBetweenLines: gap,
    letterCount: letters.length,
    letterStyles,
  };
});

logLine({
  sessionId: "bc6917",
  location: "scripts/hero-name-verify.mjs",
  message: "Hero name post-fix probe",
  data: probe,
  timestamp: Date.now(),
  hypothesisId: "HERO-NAME",
});

console.log(JSON.stringify(probe, null, 2));
await browser.close();
