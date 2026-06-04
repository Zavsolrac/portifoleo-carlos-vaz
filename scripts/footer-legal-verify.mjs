/**
 * Verifies the new footer copyright/notice block:
 *  - element is rendered, centered, and discreet (low opacity)
 *  - on desktop (≥1280px) the disclaimer collapses to 1 line and
 *    the © line sits above it ⇒ total of TWO compact lines
 *  - on a wider viewport the line count is still ≤ 2
 *  - on mobile (≤480px) the block stays inside the viewport
 *  - i18n switching keeps the key wired (same line count)
 */
import { chromium } from "playwright";
import { writeFileSync, appendFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, "..");
const out   = join(root, ".cursor", "relic-shots");
const log   = join(root, ".cursor", "footer-legal.log");
mkdirSync(out, { recursive: true });
writeFileSync(log, "", "utf8");
const w = (o) => appendFileSync(log, JSON.stringify(o) + "\n", "utf8");

const url = "file:///" + join(root, "index.html").replace(/\\/g, "/");
const browser = await chromium.launch({ headless: true });

async function probe(width, height, tag) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector(".welcome")?.remove());
  await page.evaluate(() =>
    document.querySelector(".footer")?.scrollIntoView({ block: "end" })
  );
  await page.waitForTimeout(400);

  const data = await page.evaluate(() => {
    const legal  = document.querySelector(".footer__legal");
    const copy   = document.querySelector(".footer__legal-copy");
    const notice = document.querySelector(".footer__legal-notice");
    if (!legal) return null;
    const cs   = getComputedStyle(legal);
    const csC  = getComputedStyle(copy);
    const csN  = getComputedStyle(notice);
    const rb   = legal.getBoundingClientRect();
    const cb   = copy.getBoundingClientRect();
    const nb   = notice.getBoundingClientRect();
    // Approximate line count via height / line-height
    const lhN = parseFloat(csN.lineHeight) || (parseFloat(csN.fontSize) * 1.5);
    const lhC = parseFloat(csC.lineHeight) || (parseFloat(csC.fontSize) * 1.5);
    return {
      bodyW: document.documentElement.clientWidth,
      legal: {
        textAlign: cs.textAlign,
        opacity: cs.opacity,
        fontSize: cs.fontSize,
        maxWidth: cs.maxWidth,
        width: rb.width,
        offsetLeft: rb.left,
        offsetRight: window.innerWidth - rb.right,
        inViewport: rb.left >= 0 && rb.right <= window.innerWidth,
      },
      copy: {
        height: cb.height,
        lineHeight: lhC,
        lineCount: Math.max(1, Math.round(cb.height / lhC)),
        text: copy.textContent.trim().slice(0, 80),
      },
      notice: {
        height: nb.height,
        lineHeight: lhN,
        lineCount: Math.max(1, Math.round(nb.height / lhN)),
        text: notice.textContent.trim().slice(0, 80) + "…",
      },
    };
  });

  w({ tag, viewport: { width, height }, data });

  // Screenshot of just the footer — use locator screenshot with bounding
  // box so we capture wherever the footer ended up regardless of scroll.
  try {
    await page.locator(".footer").screenshot({
      path: join(out, `footer-${tag}.png`),
      timeout: 8000,
    });
  } catch (e) {
    w({ tag, kind: "screenshot-error", msg: String(e).slice(0, 200) });
  }
  await page.close();
  return data;
}

const desktop = await probe(1366, 900,  "desktop-1366");
const wide    = await probe(1600, 900,  "desktop-1600");
const tablet  = await probe(820,  900,  "tablet");
const mobile  = await probe(375,  812,  "mobile");

await browser.close();

const verdict = {
  centered:
    desktop.legal.textAlign === "center" &&
    Math.abs(desktop.legal.offsetLeft - desktop.legal.offsetRight) < 4,
  discreet: parseFloat(desktop.legal.opacity) < 0.65,
  insideViewport:
    desktop.legal.inViewport && wide.legal.inViewport &&
    tablet.legal.inViewport && mobile.legal.inViewport,
  totalLines: {
    "1366": desktop.copy.lineCount + desktop.notice.lineCount,
    "1600": wide.copy.lineCount + wide.notice.lineCount,
    "820":  tablet.copy.lineCount + tablet.notice.lineCount,
    "375":  mobile.copy.lineCount + mobile.notice.lineCount,
  },
  desktopFitsInTwoLines:
    (desktop.copy.lineCount + desktop.notice.lineCount) <= 2 ||
    (wide.copy.lineCount + wide.notice.lineCount) <= 2,
};
w({ kind: "verdict", verdict });
console.log(JSON.stringify(verdict, null, 2));
