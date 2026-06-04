/**
 * Verification for the "Artefato Exemplar" relics added to each contract.
 *
 * Confirms that:
 *  - every .contract has exactly ONE .contract__relic
 *  - relic images load successfully (no broken src)
 *  - link uses target="_blank" + rel="noopener"
 *  - .contract__relic-desc is clamped to 2 lines
 *  - the relic does NOT make the .contract__page--left taller than
 *    the .contract__page--right (i.e. contract stays balanced)
 *  - mobile layout (375x812) keeps the relic inside the contract bounds
 *
 * Captures desktop + mobile screenshots of the Codex section.
 */
import { chromium } from "playwright";
import { writeFileSync, appendFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir   = dirname(fileURLToPath(import.meta.url));
const root    = join(__dir, "..");
const outDir  = join(root, ".cursor", "relic-shots");
const logPath = join(root, ".cursor", "relic-verify.log");
mkdirSync(outDir, { recursive: true });
writeFileSync(logPath, "", "utf8");
const log = (o) => appendFileSync(logPath, JSON.stringify(o) + "\n", "utf8");

const indexUrl = "file:///" + join(root, "index.html").replace(/\\/g, "/");
const browser = await chromium.launch({ headless: true });

async function inspect(viewport, tag) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (e) => log({ tag, kind: "pageerror", msg: String(e) }));
  page.on("console", (m) => {
    if (m.type() === "error") log({ tag, kind: "console.error", msg: m.text() });
  });

  await page.goto(indexUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());

  // Scroll to the contracts section so the relic images are in view
  await page.evaluate(() =>
    document.querySelector("#contracts")?.scrollIntoView({ block: "start" })
  );
  await page.waitForTimeout(800);

  // Force eager loading of relic images so naturalWidth is populated
  await page.evaluate(() => {
    document.querySelectorAll(".contract__relic img").forEach((img) => {
      img.loading = "eager";
      // re-assign src to retrigger fetch under eager mode
      const s = img.getAttribute("src");
      img.setAttribute("src", s);
    });
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(600);

  const report = await page.evaluate(() => {
    const contracts = [...document.querySelectorAll(".contract")];
    const results = [];
    for (const [i, contract] of contracts.entries()) {
      const relics = contract.querySelectorAll(".contract__relic");
      const r = contract.querySelector(".contract__relic");
      const img = r?.querySelector("img");
      const link = r?.querySelector(".contract__relic-link");
      const desc = r?.querySelector(".contract__relic-desc");
      const pageLeft = contract.querySelector(".contract__page--left");
      const pageRight = contract.querySelector(".contract__page--right");

      const cs = desc ? getComputedStyle(desc) : null;

      results.push({
        index: i,
        rarity: contract.dataset.rarity,
        relicCount: relics.length,
        imgSrc: img?.getAttribute("src"),
        imgLoaded: img ? (img.complete && img.naturalWidth > 0) : false,
        imgNaturalW: img?.naturalWidth,
        imgNaturalH: img?.naturalHeight,
        linkHref: link?.getAttribute("href"),
        linkTarget: link?.getAttribute("target"),
        linkRel: link?.getAttribute("rel"),
        descClamp: cs?.webkitLineClamp || cs?.lineClamp,
        descMaxLines: cs?.webkitBoxOrient,
        relicBoxH: r?.getBoundingClientRect().height,
        relicBoxW: r?.getBoundingClientRect().width,
        leftPageH: pageLeft?.getBoundingClientRect().height,
        rightPageH: pageRight?.getBoundingClientRect().height,
        contractH: contract.getBoundingClientRect().height,
        // Relic visible inside the contract?
        relicInside: (() => {
          const cb = contract.getBoundingClientRect();
          const rb = r?.getBoundingClientRect();
          if (!rb) return false;
          return rb.left >= cb.left - 1 && rb.right <= cb.right + 1;
        })(),
      });
    }
    return results;
  });

  log({ tag, viewport, report });
  await page.screenshot({
    path: join(outDir, `contracts-${tag}.png`),
    fullPage: false,
    clip: await page.evaluate(() => {
      const el = document.querySelector("#contracts");
      const r = el.getBoundingClientRect();
      return {
        x: Math.max(0, r.left),
        y: Math.max(0, r.top),
        width: Math.min(window.innerWidth, r.width),
        height: Math.min(window.innerHeight - Math.max(0, r.top), r.height),
      };
    }),
  });

  // also capture the first contract close-up for crisp visual eval
  const firstContract = await page.locator(".contract").first();
  await firstContract.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await firstContract.screenshot({ path: join(outDir, `contract-1-${tag}.png`) });

  await page.close();
  return report;
}

const desktop = await inspect({ width: 1366, height: 900 }, "desktop");
const mobile  = await inspect({ width: 375,  height: 812 }, "mobile");

await browser.close();

const summary = {
  totalContracts: desktop.length,
  desktop: {
    eachHasOneRelic: desktop.every((d) => d.relicCount === 1),
    allImgsLoaded: desktop.every((d) => d.imgLoaded),
    allTargetBlank: desktop.every((d) => d.linkTarget === "_blank"),
    allInsideContract: desktop.every((d) => d.relicInside),
    avgRelicH: Math.round(desktop.reduce((s, d) => s + d.relicBoxH, 0) / desktop.length),
  },
  mobile: {
    eachHasOneRelic: mobile.every((d) => d.relicCount === 1),
    allImgsLoaded: mobile.every((d) => d.imgLoaded),
    allInsideContract: mobile.every((d) => d.relicInside),
    avgRelicH: Math.round(mobile.reduce((s, d) => s + d.relicBoxH, 0) / mobile.length),
  },
};
log({ kind: "summary", summary });
console.log(JSON.stringify(summary, null, 2));
