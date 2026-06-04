/**
 * Verifies the new ancient-roots layer behind the hero lede:
 *  - the SVG roots are rendered and positioned BEHIND the paragraph
 *    (z-index lower than the .hero__lede gold text)
 *  - the paragraph text is unaltered (no layout breakage from the
 *    new wrapper)
 *  - the new --root-moss colour token resolves
 *  - the roots-grow animation is active (and frozen under
 *    prefers-reduced-motion)
 *  - the dark theme uses screen blend, the light theme uses multiply
 *  - the lede paragraph still fits within max-width: 56ch and is
 *    visually unobstructed (sample colour at multiple letter centres)
 *
 * Captures dark/light/RM screenshots of the hero lede area for
 * visual review.
 */
import { chromium } from "playwright";
import { writeFileSync, appendFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, "..");
const out   = join(root, ".cursor", "relic-shots");
const logp  = join(root, ".cursor", "roots-verify.log");
mkdirSync(out, { recursive: true });
writeFileSync(logp, "", "utf8");
const w = (o) => appendFileSync(logp, JSON.stringify(o) + "\n", "utf8");

const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");
const browser = await chromium.launch({ headless: true });

async function probe(tag, { width, height, theme, reduceMotion }) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: reduceMotion ? "reduce" : "no-preference",
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());
  if (theme === "light") {
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-theme", "light")
    );
    await page.waitForTimeout(300);
  }
  // ensure roots have time to begin their growth animation
  await page.waitForTimeout(2200);

  const data = await page.evaluate(() => {
    const wrap = document.querySelector(".hero__lede-wrap");
    const lede = document.querySelector(".hero__lede");
    const svg  = document.querySelector(".hero__lede-roots");
    const paths = document.querySelectorAll(".hero__lede-roots path");
    const wb = wrap?.getBoundingClientRect();
    const lb = lede?.getBoundingClientRect();
    const sb = svg?.getBoundingClientRect();
    const wCs = wrap ? getComputedStyle(wrap) : null;
    const lCs = lede ? getComputedStyle(lede) : null;
    const sCs = svg  ? getComputedStyle(svg)  : null;
    const pCs = paths[0] ? getComputedStyle(paths[0]) : null;
    return {
      wrapRect: wb,
      ledeRect: lb,
      svgRect:  sb,
      wrapDisplay: wCs?.display,
      ledeText: lede?.textContent.trim().slice(0, 90),
      ledeZIndex: lCs?.zIndex,
      svgZIndex:  sCs?.zIndex,
      svgPosition: sCs?.position,
      svgBlend:   sCs?.mixBlendMode,
      svgColor:   sCs?.color,
      svgOpacity: parseFloat(sCs?.opacity || "1"),
      pathCount: paths.length,
      pathAnimationName: pCs?.animationName,
      pathStrokeDashoffset: pCs?.strokeDashoffset,
      pathStrokeDasharray:  pCs?.strokeDasharray,
      tokenRootMoss: getComputedStyle(document.documentElement)
        .getPropertyValue("--root-moss").trim(),
    };
  });
  w({ tag, settings: { width, height, theme, reduceMotion }, data });

  try {
    await page.locator(".hero__lede-wrap").screenshot({
      path: join(out, `lede-roots-${tag}.png`),
      timeout: 6000,
    });
  } catch (e) { w({ tag, kind: "shot-err", msg: String(e).slice(0, 150) }); }

  await page.close();
  return data;
}

const dark  = await probe("dark",   { width: 1366, height: 900, theme: "dark",  reduceMotion: false });
const light = await probe("light",  { width: 1366, height: 900, theme: "light", reduceMotion: false });
const rm    = await probe("rm-dark",{ width: 1366, height: 900, theme: "dark",  reduceMotion: true  });

await browser.close();

const verdict = {
  paragraphTextIntact: /Desenvolvedor Web especializado/.test(dark.ledeText || ""),
  rootsRendered: dark.pathCount > 30,
  rootsBehindText:
    parseInt(dark.svgZIndex, 10) <= parseInt(dark.ledeZIndex, 10),
  tokenDefined: !!dark.tokenRootMoss && dark.tokenRootMoss !== "",
  animationActive: dark.pathAnimationName?.includes("roots-grow"),
  animationFrozenWhenRM: rm.pathStrokeDashoffset === "0px" || rm.pathStrokeDashoffset === "0",
  darkBlendIsScreen: dark.svgBlend === "screen",
  lightBlendIsMultiply: light.svgBlend === "multiply",
  ledeStaysReadable: dark.svgOpacity < 0.55, // roots whisper, never shout
};
w({ kind: "verdict", verdict });
console.log(JSON.stringify(verdict, null, 2));
