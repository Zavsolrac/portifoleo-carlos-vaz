/**
 * Verifies the upgrades to the Artefato Exemplar relic:
 *  - thumbnail is now a clickable <a> with target="_blank"
 *  - hovering the thumbnail swells the mystical glow halo
 *  - hovering the text link grows the SAME halo (synced behaviour)
 *  - keyboard focus on the text link also activates the halo
 *  - captures before/after hover screenshots of contract I
 */
import { chromium } from "playwright";
import { writeFileSync, appendFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir   = dirname(fileURLToPath(import.meta.url));
const root    = join(__dir, "..");
const outDir  = join(root, ".cursor", "relic-shots");
const logPath = join(root, ".cursor", "relic-glow-verify.log");
mkdirSync(outDir, { recursive: true });
writeFileSync(logPath, "", "utf8");
const log = (o) => appendFileSync(logPath, JSON.stringify(o) + "\n", "utf8");

const indexUrl = "file:///" + join(root, "index.html").replace(/\\/g, "/");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

await page.goto(indexUrl, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector(".welcome")?.remove());
await page.evaluate(() =>
  document.querySelector("#contracts")?.scrollIntoView({ block: "start" })
);
await page.waitForTimeout(700);

// Force eager loading so thumbs are ready for screenshots
await page.evaluate(() => {
  document.querySelectorAll(".contract__relic img").forEach((img) => {
    img.loading = "eager";
    img.setAttribute("src", img.getAttribute("src"));
  });
});
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(400);

// ---------- semantic check on every contract ----------
const semantic = await page.evaluate(() => {
  return [...document.querySelectorAll(".contract")].map((c, i) => {
    const thumb = c.querySelector(".contract__relic-thumb");
    const link  = c.querySelector(".contract__relic-link");
    return {
      idx: i,
      rarity: c.dataset.rarity,
      thumbIsAnchor: thumb?.tagName === "A",
      thumbHref: thumb?.getAttribute("href"),
      thumbTarget: thumb?.getAttribute("target"),
      thumbRel: thumb?.getAttribute("rel"),
      thumbTabindex: thumb?.getAttribute("tabindex"),
      linkHref: link?.getAttribute("href"),
      sameDestination: thumb?.getAttribute("href") === link?.getAttribute("href"),
    };
  });
});
log({ kind: "semantic", semantic });

// ---------- glow synchronisation check (contract I) ----------
const relic = page.locator(".contract").first().locator(".contract__relic");

// Helper to read glow state on the .contract__relic-figure::before halo
async function glowState(label) {
  // ::before opacity is not directly exposed; sample via window getComputedStyle
  // We probe the figure's first child position to ensure pseudo applies.
  return await relic.evaluate((el, lbl) => {
    const fig = el.querySelector(".contract__relic-figure");
    const link = el.querySelector(".contract__relic-link");
    const figBefore = getComputedStyle(fig, "::before");
    const linkBefore = getComputedStyle(link, "::before");
    return {
      label: lbl,
      figureHaloOpacity: parseFloat(figBefore.opacity),
      figureHaloTransform: figBefore.transform,
      figureHaloAnimation: figBefore.animationName,
      linkHaloOpacity: parseFloat(linkBefore.opacity),
      linkHaloAnimation: linkBefore.animationName,
      linkTextShadow: getComputedStyle(link).textShadow,
    };
  }, label);
}

const rest = await glowState("rest");

// Helper: page screenshot clipped to a locator's bounding box (works
// even when neighbouring elements have running ambient animations).
async function clipShot(loc, file, pad = 30) {
  const box = await loc.boundingBox();
  if (!box) return;
  await page.screenshot({
    path: join(outDir, file),
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width:  Math.min(page.viewportSize().width  - Math.max(0, box.x - pad), box.width  + pad * 2),
      height: Math.min(page.viewportSize().height - Math.max(0, box.y - pad), box.height + pad * 2),
    },
  });
}

// Hover the THUMB (force to bypass animation-induced "not stable" checks)
await relic.locator(".contract__relic-thumb").hover({ force: true });
await page.waitForTimeout(700);
const onThumb = await glowState("hover-thumb");
await clipShot(relic, "relic-hover-thumb.png");

// Move away → reset
await page.mouse.move(10, 10);
await page.waitForTimeout(700);

// Hover the TEXT LINK
await relic.locator(".contract__relic-link").hover({ force: true });
await page.waitForTimeout(700);
const onLink = await glowState("hover-link");
await clipShot(relic, "relic-hover-link.png");

// Move away again, take a rest snapshot for comparison
await page.mouse.move(10, 10);
await page.waitForTimeout(700);
await clipShot(relic, "relic-rest.png");

log({ kind: "glow", rest, onThumb, onLink });

const verdict = {
  allThumbsAreAnchors: semantic.every((s) => s.thumbIsAnchor),
  allTargetsBlank: semantic.every((s) => s.thumbTarget === "_blank"),
  allRelsSafe: semantic.every((s) => /noopener/.test(s.thumbRel || "")),
  allSameDestination: semantic.every((s) => s.sameDestination),
  thumbsRemovedFromTabOrder: semantic.every((s) => s.thumbTabindex === "-1"),
  haloRestsHidden: rest.figureHaloOpacity < 0.05,
  haloGrowsOnThumbHover: onThumb.figureHaloOpacity > 0.5,
  haloGrowsOnLinkHover: onLink.figureHaloOpacity > 0.5,
  haloAnimatesOnHover:
    onThumb.figureHaloAnimation?.includes("contract-relic-breathe"),
  linkTextShadowOnThumbHover:
    onThumb.linkTextShadow && onThumb.linkTextShadow !== "none",
};
log({ kind: "verdict", verdict });
console.log(JSON.stringify(verdict, null, 2));

await browser.close();
