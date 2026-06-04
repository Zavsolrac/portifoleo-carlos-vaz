/* Light-mode visibility audit + welcome single-line check.
   Renders every major section in LIGHT theme, screenshots them, opens
   the knowledge tree overlay, and measures whether the welcome title
   now fits on a single line. */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".cursor", "light-audit");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const browser = await chromium.launch({ headless: true });

async function newPage(w = 1440, h = 900) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  return page;
}

function setLight(page) {
  return page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
}

/* ---- 1. WELCOME title single-line check (dark, as shipped) ---- */
{
  for (const [w, h] of [[1440, 900], [768, 1024], [390, 844], [360, 800], [320, 720]]) {
    const page = await newPage(w, h);
    await page.evaluate(() => {
      const el = document.getElementById("arcane-welcome");
      el?.classList.add("is-active");
      el?.setAttribute("aria-hidden", "false");
      document.querySelectorAll(".welcome__line").forEach((n) => {
        n.style.opacity = "1";
        n.style.transform = "none";
      });
      document.querySelectorAll(".welcome__char, .welcome__star").forEach((n) => {
        n.style.opacity = "1";
        n.style.transform = "none";
        n.style.filter = "none";
        n.style.animation = "none";
      });
    });
    await page.waitForTimeout(400);
    const info = await page.evaluate(() => {
      const t = document.querySelector(".welcome__title");
      if (!t) return null;
      const r = t.getBoundingClientRect();
      const cs = getComputedStyle(t);
      const lineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
      return {
        height: Math.round(r.height),
        lineHeight: Math.round(lineH),
        lines: Math.max(1, Math.round(r.height / lineH)),
        fontSize: cs.fontSize,
        width: Math.round(r.width),
        panelWidth: Math.round(document.querySelector(".welcome__panel").getBoundingClientRect().width),
      };
    });
    console.log(`WELCOME @${w}px ->`, JSON.stringify(info));
    await page.locator(".welcome__panel").screenshot({ path: join(out, `welcome-${w}.png`) });
    await page.close();
  }
}

/* ---- 2. LIGHT-MODE section screenshots ---- */
const sections = ["hero", "knowledge", "memories", "contracts", "portal"];
async function forceReveal(page) {
  await page.addStyleTag({
    content: `*{animation-play-state:running!important}
      [data-reveal],.memories__entry,.contract,.contracts__row,.portal__column,
      .memories__title,.memories__lede,.memories__eyebrow,[class*="__reveal"]{
        opacity:1!important;transform:none!important;filter:none!important;visibility:visible!important}`,
  });
  await page.evaluate(() => {
    document.querySelectorAll("section, [id]").forEach((s) => s.setAttribute && s.setAttribute("data-narrative-entered", "true"));
    document.querySelectorAll("*").forEach((el) => {
      const cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) < 0.05 && el.offsetParent !== null) el.style.opacity = "1";
    });
  });
}
for (const id of sections) {
  const page = await newPage(1440, 950);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());
  await setLight(page);
  await forceReveal(page);
  await page.waitForTimeout(300);
  await page.evaluate((sid) => document.getElementById(sid)?.scrollIntoView({ block: "start" }), id);
  await page.waitForTimeout(700);
  const loc = page.locator(`#${id}`);
  try {
    await loc.screenshot({ path: join(out, `light-${id}.png`), timeout: 8000 });
  } catch {
    await page.screenshot({ path: join(out, `light-${id}.png`) });
  }
  await page.close();
}

/* ---- 3. LIGHT-MODE knowledge tree overlay ---- */
{
  const page = await newPage(1440, 950);
  await setLight(page);
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());
  await page.evaluate(() => {
    const btn = document.querySelector("[data-ktree-open]");
    btn?.click();
  });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: join(out, `light-ktree.png`) });
  // hover a crystal to surface panel/tip
  await page.mouse.move(720, 480);
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(out, `light-ktree-hover.png`) });
  await page.close();
}

await browser.close();
console.log("done");
