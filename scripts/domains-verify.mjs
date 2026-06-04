/* Verify the "Domínios em Expansão" right-rail artefact:
   - it exists, is fixed to the right edge, vertically centred
   - z-index sits below nav (100) and Merlin (200)
   - 3 tech bars with animated fill + sweep, 6 skills with pulses
   - no percentage / numeric text leaks into the DOM
   - i18n resolves title/subtitle in each locale
   - collapses on narrow viewport into the rune tab, toggles open
   - dark + light + mobile screenshots */
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
  if (theme === "light") {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    await page.waitForTimeout(300);
  }
  // skip the entrance delay
  await page.evaluate(() => {
    const d = document.getElementById("domains");
    if (d) { d.style.animation = "none"; d.style.opacity = "1"; }
  });
  await page.waitForTimeout(400);
}

/* ---------- DESKTOP DARK ---------- */
let page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await prep(page, "dark");

const probe = await page.evaluate(() => {
  const d = document.getElementById("domains");
  const panel = document.querySelector(".domains__panel");
  const cs = getComputedStyle(d);
  const pcs = getComputedStyle(panel);
  const r = panel.getBoundingClientRect();
  const fills = Array.from(document.querySelectorAll(".domains__bar-fill"));
  const sweeps = Array.from(document.querySelectorAll(".domains__bar-sweep"));
  const pulses = Array.from(document.querySelectorAll(".domains__pulse"));
  const techNames = Array.from(document.querySelectorAll(".domains__tech-name")).map((n) => n.textContent.trim());
  const skillNames = Array.from(document.querySelectorAll(".domains__skill-name")).map((n) => n.textContent.trim());
  const allText = d.innerText;
  return {
    exists: !!d,
    position: cs.position,
    zIndex: cs.zIndex,
    rightEdge: Math.round(window.innerWidth - r.right),
    verticallyCentred: Math.abs((r.top + r.height / 2) - window.innerHeight / 2) < 40,
    panelOpacityRest: pcs.opacity,
    title: document.querySelector(".domains__title")?.textContent.trim(),
    subtitle: document.querySelector(".domains__subtitle")?.textContent.trim(),
    techNames,
    skillNames,
    fillCount: fills.length,
    fillAnim: getComputedStyle(fills[0]).animationName,
    sweepAnim: getComputedStyle(sweeps[0]).animationName,
    pulseCount: pulses.length,
    pulseAnim: getComputedStyle(pulses[0]).animationName,
    hasDigit: /\d/.test(allText),
    textDump: allText.replace(/\s+/g, " ").trim(),
  };
});
console.log("DESKTOP", JSON.stringify(probe, null, 2));

// Hover brightens
const restOpacity = await page.evaluate(() => getComputedStyle(document.querySelector(".domains__panel")).opacity);
await page.locator(".domains__panel").hover();
await page.waitForTimeout(600);
const hoverOpacity = await page.evaluate(() => getComputedStyle(document.querySelector(".domains__panel")).opacity);
console.log("HOVER", { restOpacity, hoverOpacity, brightens: parseFloat(hoverOpacity) > parseFloat(restOpacity) });

await page.locator(".domains__panel").screenshot({ path: join(out, "domains-dark.png") });
await page.close();

/* ---------- DESKTOP LIGHT ---------- */
page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await prep(page, "light");
await page.evaluate(() => { const p = document.querySelector(".domains__panel"); if (p) p.style.opacity = "1"; });
await page.waitForTimeout(200);
await page.locator(".domains__panel").screenshot({ path: join(out, "domains-light.png") });
await page.close();

/* ---------- MOBILE (auto-collapse) ---------- */
page = await browser.newPage({ viewport: { width: 414, height: 850 } });
await prep(page, "dark");
const mobile = await page.evaluate(() => {
  const d = document.getElementById("domains");
  const handle = document.getElementById("domains-handle");
  const hcs = getComputedStyle(handle);
  const pcs = getComputedStyle(document.querySelector(".domains__panel"));
  return {
    collapsedByDefault: d.dataset.collapsed,
    handleDisplay: hcs.display,
    handleAriaExpanded: handle.getAttribute("aria-expanded"),
    panelOpacityCollapsed: pcs.opacity,
  };
});
console.log("MOBILE default", JSON.stringify(mobile, null, 2));
await page.screenshot({ path: join(out, "domains-mobile-collapsed.png"), clip: { x: 0, y: 0, width: 414, height: 850 } });

// open it
await page.locator("#domains-handle").click();
await page.waitForTimeout(700);
const mobileOpen = await page.evaluate(() => {
  const d = document.getElementById("domains");
  const handle = document.getElementById("domains-handle");
  const pcs = getComputedStyle(document.querySelector(".domains__panel"));
  return {
    collapsed: d.dataset.collapsed,
    handleAriaExpanded: handle.getAttribute("aria-expanded"),
    panelOpacityOpen: pcs.opacity,
  };
});
console.log("MOBILE opened", JSON.stringify(mobileOpen, null, 2));
await page.screenshot({ path: join(out, "domains-mobile-open.png"), clip: { x: 0, y: 0, width: 414, height: 850 } });
await page.close();

/* ---------- I18N across locales ---------- */
for (const lang of ["pt", "gl", "es", "en"]) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(url, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(700);
  await p.evaluate((l) => { if (window.I18n?.setLang) window.I18n.setLang(l); }, lang);
  await p.waitForTimeout(300);
  const t = await p.evaluate(() => ({
    title: document.querySelector(".domains__title")?.textContent.trim(),
    skills: document.querySelector(".domains__subtitle")?.textContent.trim(),
    handle: document.querySelector(".domains__handle-label")?.textContent.trim(),
  }));
  console.log("I18N", lang, JSON.stringify(t));
  await p.close();
}

/* ---------- REDUCED MOTION ---------- */
page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await prep(page, "dark");
const rm = await page.evaluate(() => {
  const fill = document.querySelector(".domains__bar-fill");
  const pulse = document.querySelector(".domains__pulse");
  return {
    fillAnim: getComputedStyle(fill).animationName,
    pulseAnim: getComputedStyle(pulse).animationName,
    fillWidth: getComputedStyle(fill).width,
  };
});
console.log("REDUCED MOTION", JSON.stringify(rm, null, 2));
await page.close();

await browser.close();
