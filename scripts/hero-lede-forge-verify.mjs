/* Verify the forged-metal hero lede:
   - the SVG roots layer is gone
   - the paragraph carries the new 3-layer background
   - the forge animation is running on background-position
   - reduced-motion freezes it cleanly
   - hover bumps the halo
   - light theme adapts to parchment */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out  = join(root, ".cursor", "relic-shots");
mkdirSync(out, { recursive: true });
const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");

const browser = await chromium.launch({ headless: true });

async function shot(tag, { width, height, theme, reduceMotion, hover }) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: reduceMotion ? "reduce" : "no-preference",
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());
  await page.evaluate(() => document.querySelectorAll(".merlin")?.forEach((n) => n.remove()));
  if (theme === "light") {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    await page.waitForTimeout(300);
  }
  // The act1-fade-up animation only runs when #hero has the
  // narrative-entered flag. With it NOT set, the lede starts
  // visible and the forge animation runs by itself. We just
  // ensure opacity is 1 in case any inherited rule hid it.
  await page.evaluate(() => {
    const lede = document.querySelector(".hero__lede");
    if (lede) {
      lede.style.opacity = "1";
    }
  });
  await page.evaluate(() =>
    document.querySelector(".hero__lede")?.scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(700);

  if (hover) {
    await page.locator(".hero__lede").hover({ force: true });
    await page.waitForTimeout(700);
  }

  const probe = await page.evaluate(() => {
    const el = document.querySelector(".hero__lede");
    if (!el) return null;
    const cs = getComputedStyle(el);
    const wrapStillExists = !!document.querySelector(".hero__lede-wrap");
    const rootsStillExist  = !!document.querySelector(".hero__lede-roots");
    return {
      wrapStillExists,
      rootsStillExist,
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      backgroundImage: cs.backgroundImage.slice(0, 300),
      backgroundSize: cs.backgroundSize,
      animationName: cs.animationName,
      animationDuration: cs.animationDuration,
      textShadow: cs.textShadow.slice(0, 160),
      filter: cs.filter,
      colorTransparent: cs.color === "rgba(0, 0, 0, 0)" ||
                        cs.webkitTextFillColor === "rgba(0, 0, 0, 0)",
      hasMetalGradient:
        cs.backgroundImage.includes("rgb(43, 32, 23)") ||  /* metal-dark */
        cs.backgroundImage.includes("#2B2017") ||
        cs.backgroundImage.includes("rgb(43, 24, 16)"),    /* light-theme metal */
      hasEmberAmber: cs.backgroundImage.includes("242, 200, 121") ||
                     cs.backgroundImage.includes("224, 138, 46"),
      hasEmberMagma: cs.backgroundImage.includes("217, 101, 26") ||
                     cs.backgroundImage.includes("166, 59, 30"),
    };
  });

  const headBox = await page.evaluate(() => {
    const el = document.querySelector(".hero__lede");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const pad = 24;
    return {
      x: Math.max(0, Math.round(r.x - pad)),
      y: Math.max(0, Math.round(r.y - pad)),
      width: Math.min(window.innerWidth, Math.round(r.width + pad * 2)),
      height: Math.min(window.innerHeight, Math.round(r.height + pad * 2)),
    };
  });
  if (headBox && headBox.width > 0 && headBox.height > 0) {
    await page.screenshot({
      path: join(out, `hero-lede-forge-${tag}.png`),
      clip: headBox,
    });
  }
  await page.close();
  return probe;
}

const dark      = await shot("dark",     { width: 1366, height: 900, theme: "dark"  });
const darkHover = await shot("dark-hov", { width: 1366, height: 900, theme: "dark",  hover: true });
const light     = await shot("light",    { width: 1366, height: 900, theme: "light" });
const rm        = await shot("rm",       { width: 1366, height: 900, theme: "dark",  reduceMotion: true });
const mobile    = await shot("mobile",   { width: 414,  height: 850, theme: "dark"  });

const dump = { dark, darkHover, light, rm, mobile };
console.log(JSON.stringify(dump, null, 2));

const verdict = {
  wrapRemoved: !dark.wrapStillExists,
  rootsRemoved: !dark.rootsStillExist,
  metalGradientDark: dark.hasMetalGradient,
  emberAmberDark: dark.hasEmberAmber,
  emberMagmaDark: dark.hasEmberMagma,
  textTransparentDark: dark.colorTransparent,
  animationActiveDark: dark.animationName?.includes("hero-lede-forge"),
  durationInBriefWindow:
    parseFloat(dark.animationDuration) >= 8 && parseFloat(dark.animationDuration) <= 12,
  hoverFilterStronger: darkHover.filter !== dark.filter,
  reducedMotionFrozen: rm.animationName === "none" || rm.animationDuration === "0s",
  lightThemeHasMetal: light.hasMetalGradient,
  cinzelFont: /Cinzel/i.test(dark.fontFamily),
};
console.log("VERDICT", JSON.stringify(verdict, null, 2));
await browser.close();
